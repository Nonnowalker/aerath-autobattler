// src/simulation/engine.ts
import {
    StatoPartita,
    CartaDef,
    StatoGiocatore,
    UnitaInGioco,
    EroeInGioco,
    CartaInMano,
    SimulationParams
} from './types.js'; // Assicurati che l'estensione .js sia presente

// --- Costanti Configurabili ---
const MAX_CARTE_MANO = 7;
const MAX_UNITA_CAMPO = 7;
const HP_EROE_DEFAULT = 40;
const MAX_TURNI = 100; // Limite per prevenire loop infiniti

// --- Funzioni Helper ---

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getGiocatori(stato: StatoPartita): { attivo: StatoGiocatore, passivo: StatoGiocatore } {
    const attivo = stato.giocatori.find(g => g.id === stato.idGiocatoreAttivo)!;
    const passivo = stato.giocatori.find(g => g.id !== stato.idGiocatoreAttivo)!;
    if (!attivo || !passivo) {
        throw new Error("Impossibile determinare giocatore attivo/passivo!");
    }
    return { attivo, passivo };
}

function getCampi(stato: StatoPartita): { campoAttivo: (UnitaInGioco | null)[], campoPassivo: (UnitaInGioco | null)[] } {
     const campoAttivo = stato.idGiocatoreAttivo === 1 ? stato.campoG1 : stato.campoG2;
     const campoPassivo = stato.idGiocatoreAttivo === 1 ? stato.campoG2 : stato.campoG1;
     return { campoAttivo, campoPassivo };
}

// Funzione per aggiungere log (opzionale: rimuovi/commenta console.log se troppo verbose)
function logEvento(stato: StatoPartita, messaggio: string) {
    // console.log(messaggio); // Scommenta per debug in console
    stato.eventiLog.push(messaggio);
}

// --- Funzioni delle Fasi del Turno ---

function faseInizioTurno(stato: StatoPartita) {
    stato.faseTurno = "InizioTurno";
    logEvento(stato, `\n--- TURNO ${stato.turnoAttuale} (Giocatore ${stato.idGiocatoreAttivo}) ---`);
}

function fasePesca(stato: StatoPartita) {
    stato.faseTurno = "Pesca";
    const { attivo } = getGiocatori(stato);

    // Salta pesca per G1 al Turno 1
    if (stato.turnoAttuale === 1 && stato.idGiocatoreAttivo === 1 && !stato.primoTurnoP1Saltato) {
        logEvento(stato, `G${attivo.id}: Salta la pesca del primo turno.`);
        stato.primoTurnoP1Saltato = true;
        return; // Salta il resto della fase
    }

    if (attivo.mazzoRimanente.length === 0) {
        // Fatica!
        attivo.contatoreFatica++;
        const dannoFatica = attivo.contatoreFatica;
        attivo.eroe.hpAttuali -= dannoFatica;
        logEvento(stato, `G${attivo.id}: Mazzo vuoto! Subisce ${dannoFatica} danni da Fatica (HP Eroe: ${attivo.eroe.hpAttuali})`);
         // CONTROLLO VITTORIA POST-FATICA
         if (attivo.eroe.hpAttuali <= 0) {
             stato.gameOver = true;
             stato.vincitore = attivo.id === 1 ? 2 : 1; // Vince l'avversario
             logEvento(stato, `!!! EROE G${attivo.id} SCONFITTO DALLA FATICA! G${stato.vincitore} VINCE !!!`);
         }
    } else {
        // Pesca una carta
        const cartaPescataDef = attivo.mazzoRimanente.shift()!;
        const nuovaCartaInMano: CartaInMano = {
            idIstanzaUnica: stato.prossimoIdIstanzaUnica++,
            cartaDef: cartaPescataDef,
            preparazioneAttuale: cartaPescataDef.punteggioPreparazioneIniziale,
            // statoPotere non definito all'inizio
        };
        attivo.mano.push(nuovaCartaInMano);
        logEvento(stato, `G${attivo.id}: Pesca ${cartaPescataDef.nome} (Prep: ${nuovaCartaInMano.preparazioneAttuale})`);
    }
}

function fasePreparazione(stato: StatoPartita) {
    stato.faseTurno = "Preparazione";
    const { attivo } = getGiocatori(stato);
    logEvento(stato, `G${attivo.id}: Fase Preparazione.`);
    let logPrep = ""; // Log più conciso
    for (const carta of attivo.mano) {
        const nomeCarta = carta.cartaDef.nome.substring(0,10); // Nome corto
        if (carta.preparazioneAttuale > 0) {
            const prepPre = carta.preparazioneAttuale;
            carta.preparazioneAttuale--;
            // Resetta stato potere bloccato SOLO se la preparazione torna > 0
            // In realtà è meglio resettarlo a fine turno
            // if (carta.statoPotere === 'Bloccato' && carta.preparazioneAttuale > 0) {
            //      delete carta.statoPotere;
            // }
            logPrep += `${nomeCarta}(${prepPre}->${carta.preparazioneAttuale}) `;
        } else {
            // Già a 0, mostra solo preparazione e stato bloccato se presente
            logPrep += `${nomeCarta}(${carta.preparazioneAttuale}${carta.statoPotere === 'Bloccato' ? '*' : ''}) `;
        }
    }
    if (logPrep) logEvento(stato, `- Prep: ${logPrep.trim()}`);
}

function faseGiocoCarte(stato: StatoPartita) {
    stato.faseTurno = "GiocoCarte";
    const { attivo } = getGiocatori(stato);
    const { campoAttivo } = getCampi(stato);
    logEvento(stato, `G${attivo.id}: Fase Gioco Carte (Mano: ${attivo.mano.length})`);

    let indiceCarta = 0;
    while (indiceCarta < attivo.mano.length) {
        const carta = attivo.mano[indiceCarta];
        let cartaGiocataEUscitaDallaMano = false;

        // Controlla se la carta è pronta e non già marcata come Bloccato IN QUESTO TURNO
        if (carta.preparazioneAttuale === 0 && carta.statoPotere !== 'Bloccato') {
            logEvento(stato, `- Tentativo gioco: ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica})`);

            if (carta.cartaDef.tipo === 'Unita') {
                const slotLibero = campoAttivo.findIndex(slot => !slot); // Trova primo slot falsy

                if (slotLibero !== -1) { // Slot trovato
                    const nuovaUnita: UnitaInGioco = {
                        idIstanzaUnica: carta.idIstanzaUnica,
                        cartaDef: carta.cartaDef,
                        idGiocatore: attivo.id,
                        slot: slotLibero,
                        vitaAttuale: carta.cartaDef.vita!,
                        attaccoAttuale: carta.cartaDef.attacco!,
                    };
                    campoAttivo[slotLibero] = nuovaUnita;
                    attivo.mano.splice(indiceCarta, 1);
                    logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} nello slot ${slotLibero}`);
                    cartaGiocataEUscitaDallaMano = true;
                    // Non incrementare l'indice, riesamina questo indice
                } else {
                    // Campo pieno
                    logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                    // Lascia la carta, l'indice verrà incrementato sotto
                }
            } else if (carta.cartaDef.tipo === 'Potere') {
                let bersaglioValidoTrovato = false; // Placeholder
                // --- IMPLEMENTARE LOGICA REALE PER BERSAGLI POTERE ---
                 if (carta.cartaDef.id === 'fulmine_improvviso') {
                      const nemiciVivi = getCampi(stato).campoPassivo.filter(u => u !== null && u.vitaAttuale > 0) as UnitaInGioco[];
                      if(nemiciVivi.length > 0){ bersaglioValidoTrovato = true; /* Logica fittizia trova bersaglio */ }
                 } else { bersaglioValidoTrovato = true; /* Default */ }
                // --- FINE PLACEHOLDER ---

                if (bersaglioValidoTrovato) {
                    logEvento(stato, `  > G${attivo.id}: Lancia ${carta.cartaDef.nome}`);
                    // --- IMPLEMENTARE EFFETTO REALE POTERE ---
                    logEvento(stato, `    - Effetto Placeholder applicato! (TODO)`);
                    // --- FINE EFFETTO REALE ---
                    attivo.carteScartate.push(carta.cartaDef); // Il potere usato va negli scarti
                    attivo.mano.splice(indiceCarta, 1);
                    cartaGiocataEUscitaDallaMano = true;
                     // Non incrementare l'indice
                } else {
                    logEvento(stato, `  > Fallito: Nessun bersaglio valido per ${carta.cartaDef.nome}`);
                    carta.statoPotere = 'Bloccato'; // Marca per non riprovare questo turno
                    // Lascia la carta, l'indice verrà incrementato sotto
                }
            }
        }

        // Incrementa l'indice SOLO se la carta NON è stata rimossa dalla mano
        if (!cartaGiocataEUscitaDallaMano) {
            indiceCarta++;
        }
        // Altrimenti, il loop continua sullo stesso indice (che ora contiene la prossima carta)
    }
}


function faseAttacco(stato: StatoPartita) {
    stato.faseTurno = "Attacco";
    const { attivo, passivo } = getGiocatori(stato);
    const { campoAttivo, campoPassivo } = getCampi(stato);
    logEvento(stato, `G${attivo.id}: Fase Attacco.`);
    let attacchiLog = "";

    for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
        const attaccante = campoAttivo[i];
        // L'unità attacca solo se esiste ed è viva
        if (attaccante && attaccante.vitaAttuale > 0) {
            const bersaglioUnita = campoPassivo[i];
            let logRiga = `S${i}:${attaccante.cartaDef.nome.substring(0,3)}(${attaccante.vitaAttuale}HP)`;

            if (bersaglioUnita && bersaglioUnita.vitaAttuale > 0) {
                // Attacca unità opposta
                const danno = attaccante.attaccoAttuale;
                bersaglioUnita.vitaAttuale -= danno;
                 logRiga += ` -> ${bersaglioUnita.cartaDef.nome.substring(0,3)}(${danno}d, ${bersaglioUnita.vitaAttuale}HP); `;
                attacchiLog += logRiga;
            } else {
                // Slot opposto vuoto o unità morta, attacca l'Eroe avversario
                const danno = attaccante.attaccoAttuale;
                passivo.eroe.hpAttuali -= danno;
                logRiga += ` -> EROE(${danno}d, ${passivo.eroe.hpAttuali}HP); `;
                attacchiLog += logRiga;

                // Controlla VITTORIA subito dopo attacco a eroe
                if (passivo.eroe.hpAttuali <= 0) {
                    stato.gameOver = true;
                    stato.vincitore = attivo.id;
                    logEvento(stato, `- Attacchi fino a sconfitta: ${attacchiLog}`);
                    logEvento(stato, `!!! EROE G${passivo.id} SCONFITTO! G${attivo.id} VINCE !!!`);
                    return; // Esce subito dalla fase
                }
            }
            // TODO: Logica per abilità speciali (es. doppio attacco?)
        }
    }
    // Log compatto solo se ci sono stati attacchi effettivi
    if (attacchiLog) logEvento(stato, `- Attacchi: ${attacchiLog.trim()}`);
}

function faseMorteEScorrimento(stato: StatoPartita) {
    stato.faseTurno = "Morte";
    let qualcosaDaLoggare = false; // Per evitare di loggare la fase se non muore nulla
    let logMortiTotale = "";

    // Processa entrambi i campi
    for (const idGiocatoreProcessato of [1, 2]) {
        const campoDaProcessare = idGiocatoreProcessato === 1 ? stato.campoG1 : stato.campoG2;
        const giocatore = stato.giocatori.find(g => g.id === idGiocatoreProcessato)!;
        let reCheckNeeded = true;
        let logMortiGiocatore = "";

        // Continua a controllare il campo finché non ci sono più morti da processare + scorrimenti
        while (reCheckNeeded) {
             reCheckNeeded = false; // Assume che non servirà un altro passaggio
             for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
                 const unita = campoDaProcessare[i];
                 if (unita && unita.vitaAttuale <= 0) {
                     qualcosaDaLoggare = true;
                     logMortiGiocatore += `${unita.cartaDef.nome.substring(0,10)}@S${i} `;
                     // --- Attiva Effetto OnDeath (Placeholder) ---
                     // console.log(`   - Effetto OnDeath ${unita.cartaDef.nome} (TODO)`);
                     // -----------------------------------------
                     giocatore.carteScartate.push(unita.cartaDef);
                     campoDaProcessare[i] = null; // Rimuovi unità morta

                     // --- Esegui SCORRIMENTO verso sinistra ---
                     for (let j = i + 1; j < MAX_UNITA_CAMPO; j++) {
                         if (campoDaProcessare[j]) {
                             // Sposta l'unità dallo slot j allo slot j-1
                             campoDaProcessare[j-1] = campoDaProcessare[j];
                             // Aggiorna l'informazione dello slot interno all'oggetto UnitaInGioco
                             campoDaProcessare[j-1]!.slot = j - 1;
                             campoDaProcessare[j] = null; // Svuota lo slot originale
                         } else {
                              break; // Non ci sono altre unità a destra da spostare
                         }
                     }
                     reCheckNeeded = true; // Una morte + scorrimento è avvenuta, serve ricontrollare il campo da capo
                     break; // Interrompe il for interno per ricominciare il while(reCheckNeeded)
                 }
             } // Fine for interno (check slot i)
        } // Fine while reCheckNeeded (controllo ripetuto dello stesso campo)
         if(logMortiGiocatore) logMortiTotale += `Morti G${idGiocatoreProcessato}: ${logMortiGiocatore}; `;
    } // Fine for esterno (per ogni giocatore)

    if(qualcosaDaLoggare) {
         logEvento(stato, `Sistema: Fase Morte & Scorrimento Completata.`);
         if(logMortiTotale) logEvento(stato, `- ${logMortiTotale.trim()}`);
    }

    // Controllo Vittoria finale post-morte (effetti OnDeath potrebbero aver inflitto danno fatale)
     if (!stato.gameOver) {
        if (stato.giocatori[0].eroe.hpAttuali <= 0) {
           stato.gameOver = true; stato.vincitore = 2;
           logEvento(stato, `!!! EROE G1 SCONFITTO (post-morte)! G2 VINCE !!!`);
        } else if (stato.giocatori[1].eroe.hpAttuali <= 0) {
           stato.gameOver = true; stato.vincitore = 1;
           logEvento(stato, `!!! EROE G2 SCONFITTO (post-morte)! G1 VINCE !!!`);
        }
     }
}


function faseFineTurno(stato: StatoPartita) {
    stato.faseTurno = "FineTurno";
    const { attivo } = getGiocatori(stato);

    // Scarto carte in eccesso alla mano
    if (attivo.mano.length > MAX_CARTE_MANO) {
        logEvento(stato, `G${attivo.id}: Mano piena (${attivo.mano.length} > ${MAX_CARTE_MANO}), scarto carte...`);
        // Crea un array di oggetti con carta e indice originale per lo sorting secondario
        const manoConIndice = attivo.mano.map((carta, index) => ({ carta, index }));
        // Ordina per scartare: prima preparazione più alta, poi indice più alto (destra)
        manoConIndice.sort((a, b) => {
            if (b.carta.preparazioneAttuale !== a.carta.preparazioneAttuale) {
                return b.carta.preparazioneAttuale - a.carta.preparazioneAttuale; // Preparazione più alta prima
            }
            return b.index - a.index; // A parità, indice più alto (più a destra) prima
        });

        const numeroCarteDaScartare = attivo.mano.length - MAX_CARTE_MANO;
        const idUniciDaScartare = new Set<number>(); // Tiene traccia degli ID istanza da scartare
        let logScarto = "";
        for (let i = 0; i < numeroCarteDaScartare; i++) {
            const { carta } = manoConIndice[i]; // Prende la carta da scartare in base all'ordine sortato
             logScarto += `${carta.cartaDef.nome.substring(0,10)}(P${carta.preparazioneAttuale}) `;
            attivo.carteScartate.push(carta.cartaDef); // Aggiungi al cimitero
            idUniciDaScartare.add(carta.idIstanzaUnica); // Aggiungi il suo ID unico al set da rimuovere
        }
        if(logScarto) logEvento(stato, ` > Scarta: ${logScarto.trim()}`);
        // Filtra la mano attuale rimuovendo le carte i cui ID sono nel set
        attivo.mano = attivo.mano.filter(c => !idUniciDaScartare.has(c.idIstanzaUnica));
    }

    // Reset dello stato 'Bloccato' dei poteri rimasti in mano alla fine del turno del giocatore.
    // Saranno rivalutati all'inizio della sua prossima fase GiocoCarte.
    attivo.mano.forEach(carta => {
        if(carta.statoPotere === 'Bloccato') {
            delete carta.statoPotere;
        }
    });

    logEvento(stato, `Fine Turno G${attivo.id}. Mano: ${attivo.mano.length}`);
}

// --- Funzione Principale di Simulazione ---
export function avviaSimulazioneCompleta(params: SimulationParams): StatoPartita {
    const { mazzoDefG1, mazzoDefG2, hpInizialiEroe = HP_EROE_DEFAULT } = params;

    // Validazione base dei mazzi
    if (!mazzoDefG1 || mazzoDefG1.length === 0 || !mazzoDefG2 || mazzoDefG2.length === 0) {
        // Restituisce uno stato di errore invece di lanciare eccezione per UI migliore
         return {
             turnoAttuale: 0, idGiocatoreAttivo: 1, faseTurno: "ErroreSetup",
             giocatori: [{ id: 1, eroe: { idGiocatore: 1, hpAttuali: 0, hpMax: 0}, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 }, { id: 2, eroe: { idGiocatore: 2, hpAttuali: 0, hpMax: 0}, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 }],
             campoG1: [], campoG2: [], eventiLog: ["Errore: Impossibile avviare la simulazione, mazzi non validi."],
             gameOver: true, vincitore: null, prossimoIdIstanzaUnica: 1, primoTurnoP1Saltato: false
         };
    }

    // Inizializzazione Stato Partita
    const statoIniziale: StatoPartita = {
        turnoAttuale: 0,
        idGiocatoreAttivo: Math.random() < 0.5 ? 1 : 2, // Chi inizia
        faseTurno: "InizioPartita",
        giocatori: [
            // Giocatore 1
            { id: 1, eroe: { idGiocatore: 1, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe }, mano: [], mazzoRimanente: shuffleArray([...mazzoDefG1]), carteScartate: [], contatoreFatica: 0 },
            // Giocatore 2
            { id: 2, eroe: { idGiocatore: 2, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe }, mano: [], mazzoRimanente: shuffleArray([...mazzoDefG2]), carteScartate: [], contatoreFatica: 0 }
        ],
        campoG1: Array(MAX_UNITA_CAMPO).fill(null), // Campo G1 inizialmente vuoto
        campoG2: Array(MAX_UNITA_CAMPO).fill(null), // Campo G2 inizialmente vuoto
        eventiLog: [`--- Partita Iniziata (HP Eroi: ${hpInizialiEroe}) ---`],
        gameOver: false,
        vincitore: null,
        prossimoIdIstanzaUnica: 1, // Contatore per ID unici
        primoTurnoP1Saltato: false, // Flag per G1 che salta la prima pesca
    };

    logEvento(statoIniziale, `Giocatore ${statoIniziale.idGiocatoreAttivo} inizia.`);

    // Creazione di una copia profonda per evitare mutazioni accidentali
    // NOTA: JSON.parse/stringify è semplice ma non gestisce Date, function, undefined (anche se qui non dovremmo averne nei dati critici)
    let stato: StatoPartita;
    try {
         stato = JSON.parse(JSON.stringify(statoIniziale));
    } catch(e) {
        console.error("Errore durante deep copy dello stato:", e);
         // Ritorna stato di errore
         statoIniziale.eventiLog.push("Errore interno durante l'inizializzazione dello stato.");
         statoIniziale.gameOver = true;
         return statoIniziale;
    }


    // --- FASE INIZIO BATTAGLIA ---
    // TODO: Risolvere effetti "Inizio Battaglia" di Eroi/Equipaggiamenti qui
    logEvento(stato, `Sistema: Fase Inizio Battaglia (TODO)`);

    // --- CICLO PRINCIPALE DEI TURNI ---
    while (!stato.gameOver && stato.turnoAttuale < MAX_TURNI) {
        // Incrementa il turno PRIMA delle fasi
        stato.turnoAttuale++;

        // --- FASI DEL TURNO GIOCATORE ATTIVO ---
        faseInizioTurno(stato);
        fasePesca(stato);               if (stato.gameOver) break; // Fatica potrebbe terminare la partita
        fasePreparazione(stato);
        faseGiocoCarte(stato);        // Qui vengono schierate unità/lanciati poteri
        faseAttacco(stato);             if (stato.gameOver) break; // Attacchi possono terminare la partita
        faseMorteEScorrimento(stato);   if (stato.gameOver) break; // Effetti OnDeath potrebbero terminare la partita
        faseFineTurno(stato);           // Gestione scarto mano piena

        // Passaggio del turno all'altro giocatore alla fine di tutte le fasi
        stato.idGiocatoreAttivo = stato.idGiocatoreAttivo === 1 ? 2 : 1;

    } // --- Fine ciclo while ---

    // --- FINE PARTITA (Controllo post-loop) ---
    if (!stato.gameOver) { // Se non già finita per KO o fatica...
        if (stato.turnoAttuale >= MAX_TURNI) { // ...controlla se è per limite turni
            stato.gameOver = true;
            logEvento(stato, `!!! Limite Turni (${MAX_TURNI}) Raggiunto!`);
            // Determina vincitore per HP Eroe
            const hpG1 = stato.giocatori.find(g => g.id === 1)!.eroe.hpAttuali;
            const hpG2 = stato.giocatori.find(g => g.id === 2)!.eroe.hpAttuali;
            if (hpG1 > hpG2) stato.vincitore = 1;
            else if (hpG2 > hpG1) stato.vincitore = 2;
            else stato.vincitore = null; // Pareggio per HP uguali
            logEvento(stato, `Vincitore per HP ai punti: ${stato.vincitore ? `Giocatore ${stato.vincitore}` : 'Pareggio'}`);
        }
        // Aggiungere altre condizioni di fine partita qui se necessario (es. combo specifiche?)
    }

    logEvento(stato, `--- PARTITA TERMINATA --- ${stato.vincitore !== null ? `VINCITORE: Giocatore ${stato.vincitore}` : 'PAREGGIO'}`);
    return stato;
}