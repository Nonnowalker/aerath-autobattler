// src/simulation/engine.ts
import {
    StatoPartita,
    CartaDef,
    StatoGiocatore,
    UnitaInGioco,
    EroeInGioco,
    CartaInMano,
    SimulationParams
} from './types.js';

// --- Costanti Configurabili ---
const MAX_CARTE_MANO = 7;
const MAX_UNITA_CAMPO = 7;
const HP_EROE_DEFAULT = 40;
const MAX_TURNI = 100;

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
    const attivo = stato.giocatori.find(g => g.id === stato.idGiocatoreAttivo);
    const passivo = stato.giocatori.find(g => g.id !== stato.idGiocatoreAttivo);
    if (!attivo || !passivo) {
        throw new Error(`Impossibile determinare giocatori: attivo=${stato.idGiocatoreAttivo}`);
    }
    return { attivo, passivo };
}

function getCampi(stato: StatoPartita): { campoAttivo: (UnitaInGioco | null)[], campoPassivo: (UnitaInGioco | null)[] } {
     const campoAttivo = stato.idGiocatoreAttivo === 1 ? stato.campoG1 : stato.campoG2;
     const campoPassivo = stato.idGiocatoreAttivo === 1 ? stato.campoG2 : stato.campoG1;
     return { campoAttivo, campoPassivo };
}

function logEvento(stato: StatoPartita, messaggio: string) {
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
    if (stato.turnoAttuale === 1 && stato.idGiocatoreAttivo === 1 && !stato.primoTurnoP1Saltato) {
        logEvento(stato, `G${attivo.id}: Salta la pesca del primo turno.`);
        stato.primoTurnoP1Saltato = true;
        return;
    }
    if (attivo.mazzoRimanente.length === 0) {
        attivo.contatoreFatica++;
        const dannoFatica = attivo.contatoreFatica;
        attivo.eroe.hpAttuali -= dannoFatica;
        logEvento(stato, `G${attivo.id}: Mazzo vuoto! Subisce ${dannoFatica} danni da Fatica (HP Eroe: ${attivo.eroe.hpAttuali})`);
         if (attivo.eroe.hpAttuali <= 0 && !stato.gameOver) {
             stato.gameOver = true;
             stato.vincitore = attivo.id === 1 ? 2 : 1;
             logEvento(stato, `!!! EROE G${attivo.id} SCONFITTO DALLA FATICA! G${stato.vincitore} VINCE !!!`);
         }
    } else {
        const cartaPescataDef = attivo.mazzoRimanente.shift()!;
        const nuovaCartaInMano: CartaInMano = {
            idIstanzaUnica: stato.prossimoIdIstanzaUnica++,
            cartaDef: cartaPescataDef,
            preparazioneAttuale: cartaPescataDef.punteggioPreparazioneIniziale,
        };
        attivo.mano.push(nuovaCartaInMano);
        logEvento(stato, `G${attivo.id}: Pesca ${cartaPescataDef.nome} (Prep: ${nuovaCartaInMano.preparazioneAttuale})`);
    }
}

function fasePreparazione(stato: StatoPartita) {
    stato.faseTurno = "Preparazione";
    const { attivo } = getGiocatori(stato);
    logEvento(stato, `G${attivo.id}: Fase Preparazione.`);
    let logPrep = "";
    for (const carta of attivo.mano) {
        const nomeCarta = carta.cartaDef.nome.substring(0,10);
        if (carta.preparazioneAttuale > 0) {
            const prepPre = carta.preparazioneAttuale;
            carta.preparazioneAttuale--;
            logPrep += `${nomeCarta}(${prepPre}->${carta.preparazioneAttuale}) `;
        } else if (carta.statoPotere === 'Bloccato') {
             logPrep += `${nomeCarta}(${carta.preparazioneAttuale}*B) `;
        }
    }
    if (logPrep) logEvento(stato, `- Prep: ${logPrep.trim()}`);
}

// Import necessari all'inizio del file engine.ts (assicurati siano presenti)
import {
    StatoPartita,
    StatoGiocatore, // Assicurati che sia importato se non lo è già
    UnitaInGioco,
    CartaInMano
    // Aggiungi getGiocatori e getCampi se sono in un file separato
    // Aggiungi MAX_UNITA_CAMPO se definita come costante
} from './types.js';

// Assicurati che getGiocatori, getCampi e logEvento siano definite o importate correttamente
// Esempio dichiarazione fittizia se non importate:
// declare function getGiocatori(stato: StatoPartita): { attivo: StatoGiocatore, passivo: StatoGiocatore };
// declare function getCampi(stato: StatoPartita): { campoAttivo: (UnitaInGioco | null)[], campoPassivo: (UnitaInGioco | null)[] };
// declare function logEvento(stato: StatoPartita, messaggio: string): void;
// declare const MAX_UNITA_CAMPO: number;


// --- Funzione Fase Gioco Carte ---

function faseGiocoCarte(stato: StatoPartita): void {
    stato.faseTurno = "GiocoCarte";
    const { attivo } = getGiocatori(stato);
    const { campoAttivo } = getCampi(stato); // Ottiene il riferimento corretto a stato.campoG1 o stato.campoG2
    logEvento(stato, `G${attivo.id}: Fase Gioco Carte (Mano: ${attivo.mano.length})`);

    let indiceCarta = 0;
    // Usiamo un ciclo while perché la lunghezza dell'array `attivo.mano` può cambiare durante l'iterazione (a causa di splice)
    while (indiceCarta < attivo.mano.length) {
        const carta = attivo.mano[indiceCarta];
        let cartaGiocataEUscitaDallaMano = false; // Flag per sapere se l'indice va incrementato

        // Condizione principale: la carta è pronta (prep=0) e non è stata già bloccata in questo turno?
        if (carta.preparazioneAttuale === 0 && carta.statoPotere !== 'Bloccato') {
            logEvento(stato, `- Tentativo gioco: ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica})`);

            // Logica specifica per tipo di carta
            if (carta.cartaDef.tipo === 'Unita') {
                // Tenta di trovare uno slot libero sul campo del giocatore attivo
                const slotLibero = campoAttivo.findIndex(slot => slot === null); // Usa comparazione stretta con null

                if (slotLibero !== -1) { // Slot trovato! (Indice valido da 0 a MAX_UNITA_CAMPO - 1)
                    // Crea l'oggetto UnitaInGioco con i dati della carta
                    const nuovaUnita: UnitaInGioco = {
                        idIstanzaUnica: carta.idIstanzaUnica, // Mantiene ID unico
                        cartaDef: carta.cartaDef,             // Riferimento alla definizione base
                        idGiocatore: attivo.id,                 // Il giocatore che schiera
                        slot: slotLibero,                       // Lo slot trovato
                        // Prende HP/ATK dalla definizione, fornendo un default > 0 per robustezza
                        vitaAttuale: carta.cartaDef.vita ?? 1,
                        attaccoAttuale: carta.cartaDef.attacco ?? 0,
                        // Qui si potrebbero aggiungere altre proprietà iniziali dell'unità se necessario
                    };

                    // Posiziona l'unità nell'array del campo (questo modifica stato.campoG1 o stato.campoG2)
                    campoAttivo[slotLibero] = nuovaUnita;
                    // Rimuove la carta giocata dall'array della mano
                    attivo.mano.splice(indiceCarta, 1);
                    logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} nello slot ${slotLibero}`);
                    cartaGiocataEUscitaDallaMano = true; // Carta rimossa, il flag lo segnala

                    // NON si incrementa indiceCarta qui, perché dopo splice,
                    // la prossima carta da controllare è già all'indice corrente.
                    // Si riparte con il check del while.

                } else {
                    // Non è stato trovato nessuno slot libero (findIndex ha restituito -1)
                    logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                    // La carta non viene giocata, resta in mano. L'indice verrà incrementato sotto.
                }
            }
            else if (carta.cartaDef.tipo === 'Potere') {
                // Logica per gestire il lancio di Poteri
                let bersaglioValidoTrovato = false; // Assume falso finché le condizioni non sono verificate

                // --- Implementazione Logica Bersagli/Condizioni per ciascun potere ---
                // Questo blocco switch (o if/else if) deve contenere la logica specifica per ogni Potere
                switch (carta.cartaDef.id) {
                    case 'fulmine_improvviso': { // Logica specifica per questa carta
                        // Condizione: C'è almeno un'unità nemica viva sul campo?
                        const nemiciVivi = getCampi(stato).campoPassivo.filter(u => u !== null && u.vitaAttuale > 0);
                        if (nemiciVivi.length > 0) {
                            bersaglioValidoTrovato = true; // Condizione soddisfatta
                        }
                        break; // Esce dallo switch dopo aver gestito questo ID
                    }
                    // case 'altra_carta_potere_id': {
                    //     // Implementa qui le condizioni per un altro potere...
                    //     bersaglioValidoTrovato = true; // o false
                    //     break;
                    // }
                    default: {
                        // Comportamento di default per poteri non specificamente gestiti
                        // Potrebbe essere sempre vero (si lancia sempre), o sempre falso, o basato su tag/keywords
                        logEvento(stato, `    - Avviso: Condizione di lancio per ${carta.cartaDef.nome} non specificata, assume possa lanciare.`);
                        bersaglioValidoTrovato = true; // Default temporaneo
                        break;
                    }
                }
                // --- Fine Logica Bersagli/Condizioni ---

                // Agisci in base al risultato del check bersaglio
                if (bersaglioValidoTrovato) {
                    logEvento(stato, `  > G${attivo.id}: Lancia ${carta.cartaDef.nome}`);

                    // --- APPLICAZIONE EFFETTO POTERE REALE ---
                    // Anche qui, logica specifica per ID carta
                    switch (carta.cartaDef.id) {
                        case 'fulmine_improvviso': {
                            const { campoPassivo } = getCampi(stato); // Prendi il campo avversario
                            const nemiciViviOrdinati = (campoPassivo
                                .filter(u => u && u.vitaAttuale > 0) as UnitaInGioco[])
                                .sort((a, b) => a.vitaAttuale - b.vitaAttuale); // Ordina per vita

                            if (nemiciViviOrdinati.length > 0) {
                                const target = nemiciViviOrdinati[0]; // Prende quello con meno vita
                                const danno = 3; // Valore dell'effetto
                                target.vitaAttuale -= danno;
                                logEvento(stato, `    - Colpisce ${target.cartaDef.nome} per ${danno} danni (HP: ${target.vitaAttuale})`);
                                // NON serve gestire la morte qui, lo farà la faseMorteEScorrimento
                            } else {
                                logEvento(stato, `    - Effetto Fulmine non applicato (nessun nemico vivo trovato).`);
                            }
                            break;
                        }
                        // case 'altra_carta_potere_id': {
                        //     // Applica qui l'effetto dell'altro potere...
                        //     break;
                        // }
                        default: {
                            logEvento(stato, `    - Effetto di ${carta.cartaDef.nome} non implementato!`);
                            break;
                        }
                    }
                    // --- FINE APPLICAZIONE EFFETTO ---

                    attivo.carteScartate.push(carta.cartaDef); // Il potere usato va nel cimitero
                    attivo.mano.splice(indiceCarta, 1); // Rimuove la carta dalla mano
                    cartaGiocataEUscitaDallaMano = true; // Carta rimossa

                    // NON si incrementa indiceCarta

                } else {
                    // Bersaglio/Condizione non valido/a
                    logEvento(stato, `  > Fallito: Nessun bersaglio/condizione per ${carta.cartaDef.nome}`);
                    carta.statoPotere = 'Bloccato'; // Marca per non riprovare in questo turno
                    // L'indice verrà incrementato sotto
                }
            } else {
                 // Se il tipo non è 'Unita' né 'Potere' (non dovrebbe accadere con i tipi attuali)
                 console.error(`[ERRORE] Tipo carta sconosciuto incontrato: ${String(carta.cartaDef.tipo)}`);
                  // L'indice verrà incrementato sotto per evitare loop infiniti
            }
        } // Fine if carta.preparazioneAttuale === 0

        // Incrementa l'indice per passare alla carta successiva nella mano
        // SOLO se la carta all'indice corrente NON è stata rimossa (splice).
        if (!cartaGiocataEUscitaDallaMano) {
            indiceCarta++;
        }
        // Altrimenti, il loop while continuerà con lo stesso valore di indiceCarta,
        // esaminando la prossima carta che è slittata in quella posizione.

    } // Fine while (indiceCarta < attivo.mano.length)
}

// NON includere qui il resto di engine.ts (altre fasi, funzione principale, etc.)
// Questo è SOLO il codice della funzione faseGiocoCarte.

function faseAttacco(stato: StatoPartita) {
    stato.faseTurno = "Attacco";
    const { attivo, passivo } = getGiocatori(stato);
    const { campoAttivo, campoPassivo } = getCampi(stato);
    logEvento(stato, `G${attivo.id}: Fase Attacco.`);
    let attacchiLog = "";

    for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
        const attaccante = campoAttivo[i];
        if (attaccante && attaccante.vitaAttuale > 0) {
            const bersaglioUnita = campoPassivo[i];
            let logRiga = `S${i}:${attaccante.cartaDef.nome.substring(0,3)}(${attaccante.vitaAttuale}HP)`;

            if (bersaglioUnita && bersaglioUnita.vitaAttuale > 0) {
                const danno = attaccante.attaccoAttuale;
                bersaglioUnita.vitaAttuale -= danno;
                 logRiga += ` -> ${bersaglioUnita.cartaDef.nome.substring(0,3)}(${danno}d, ${bersaglioUnita.vitaAttuale}HP); `;
                attacchiLog += logRiga;
            } else {
                const danno = attaccante.attaccoAttuale;
                passivo.eroe.hpAttuali -= danno;
                logRiga += ` -> EROE(${danno}d, ${passivo.eroe.hpAttuali}HP); `;
                attacchiLog += logRiga;
                if (passivo.eroe.hpAttuali <= 0 && !stato.gameOver) {
                    stato.gameOver = true;
                    stato.vincitore = attivo.id;
                    logEvento(stato, `- Attacchi fino a sconfitta: ${attacchiLog}`);
                    logEvento(stato, `!!! EROE G${passivo.id} SCONFITTO! G${attivo.id} VINCE !!!`);
                    return;
                }
            }
        }
    }
    if (attacchiLog) logEvento(stato, `- Attacchi: ${attacchiLog.trim()}`);
}

function faseMorteEScorrimento(stato: StatoPartita) {
    stato.faseTurno = "Morte";
    let siSonoVerificateMorti = false;
    let logMortiTotale = "";

    for (const idGiocatoreProcessato of [1, 2]) {
        const campo = idGiocatoreProcessato === 1 ? stato.campoG1 : stato.campoG2;
        const giocatore = stato.giocatori.find(g => g.id === idGiocatoreProcessato)!;
        let ricontrollaQuestoCampo = true;
        let logMortiGiocatore = "";

        while (ricontrollaQuestoCampo) {
             ricontrollaQuestoCampo = false;
             for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
                 const unita = campo[i];
                 if (unita && unita.vitaAttuale <= 0) {
                     siSonoVerificateMorti = true;
                     logMortiGiocatore += `${unita.cartaDef.nome.substring(0,10)}@S${i} `;
                     // TODO: Attivare OnDeath effetti qui
                     giocatore.carteScartate.push(unita.cartaDef);
                     campo[i] = null;
                     for (let j = i + 1; j < MAX_UNITA_CAMPO; j++) {
                         if (campo[j]) {
                             campo[j - 1] = campo[j];
                             campo[j - 1]!.slot = j - 1;
                             campo[j] = null;
                         } else { break; }
                     }
                     ricontrollaQuestoCampo = true;
                     break;
                 }
             }
        }
        if (logMortiGiocatore) logMortiTotale += `Morti G${idGiocatoreProcessato}: ${logMortiGiocatore}; `;
    }

    if (siSonoVerificateMorti) {
        logEvento(stato, `Sistema: Fase Morte & Scorrimento.`);
        if (logMortiTotale) logEvento(stato, `- ${logMortiTotale.trim()}`);
    }

     if (!stato.gameOver) {
        const hpG1 = stato.giocatori[0].eroe.hpAttuali;
        const hpG2 = stato.giocatori[1].eroe.hpAttuali;
        if (hpG1 <= 0 && hpG2 <= 0) {
            stato.gameOver = true; stato.vincitore = null;
            logEvento(stato, `!!! ENTRAMBI GLI EROI SCONFITTI (post-morte)! PAREGGIO? !!!`);
        } else if (hpG1 <= 0) {
           stato.gameOver = true; stato.vincitore = 2;
           logEvento(stato, `!!! EROE G1 SCONFITTO (post-morte)! G2 VINCE !!!`);
        } else if (hpG2 <= 0) {
           stato.gameOver = true; stato.vincitore = 1;
           logEvento(stato, `!!! EROE G2 SCONFITTO (post-morte)! G1 VINCE !!!`);
        }
     }
}


function faseFineTurno(stato: StatoPartita) {
    stato.faseTurno = "FineTurno";
    const { attivo } = getGiocatori(stato);
    if (attivo.mano.length > MAX_CARTE_MANO) {
        logEvento(stato, `G${attivo.id}: Mano piena (${attivo.mano.length} > ${MAX_CARTE_MANO}), scarto...`);
        const manoConIndice = attivo.mano.map((carta, index) => ({ carta, index }));
        manoConIndice.sort((a, b) => {
            if (b.carta.preparazioneAttuale !== a.carta.preparazioneAttuale) { return b.carta.preparazioneAttuale - a.carta.preparazioneAttuale; }
            return b.index - a.index;
        });
        const numeroCarteDaScartare = attivo.mano.length - MAX_CARTE_MANO;
        const idUniciDaScartare = new Set<number>();
        let logScarto = "";
        for (let i = 0; i < numeroCarteDaScartare; i++) {
            const { carta } = manoConIndice[i];
            logScarto += `${carta.cartaDef.nome.substring(0,10)}(P${carta.preparazioneAttuale}) `;
            attivo.carteScartate.push(carta.cartaDef);
            idUniciDaScartare.add(carta.idIstanzaUnica);
        }
        if(logScarto) logEvento(stato, ` > Scarta: ${logScarto.trim()}`);
        attivo.mano = attivo.mano.filter(c => !idUniciDaScartare.has(c.idIstanzaUnica));
    }
     attivo.mano.forEach(carta => { if (carta.statoPotere === 'Bloccato') delete carta.statoPotere; });
    logEvento(stato, `Fine Turno G${attivo.id}. Mano: ${attivo.mano.length}`);
}

// --- Funzione Principale di Simulazione ---
export function avviaSimulazioneCompleta(params: SimulationParams): StatoPartita {
    const { mazzoDefG1, mazzoDefG2, hpInizialiEroe = HP_EROE_DEFAULT } = params;

    if (!mazzoDefG1 || mazzoDefG1.length === 0 || !mazzoDefG2 || mazzoDefG2.length === 0) {
         const errorLog = "Errore: Impossibile avviare la simulazione, mazzi non validi o vuoti.";
         return {
             turnoAttuale: 0, idGiocatoreAttivo: 1, faseTurno: "ErroreSetup",
             giocatori: [ { id: 1, eroe: { idGiocatore: 1, hpAttuali: 0, hpMax: hpInizialiEroe}, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 }, { id: 2, eroe: { idGiocatore: 2, hpAttuali: 0, hpMax: hpInizialiEroe}, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 } ],
             campoG1: Array(MAX_UNITA_CAMPO).fill(null), campoG2: Array(MAX_UNITA_CAMPO).fill(null),
             eventiLog: [errorLog], gameOver: true, vincitore: null, prossimoIdIstanzaUnica: 1, primoTurnoP1Saltato: false
         } as StatoPartita; // Aggiunto type assertion per sicurezza
    }

    const statoIniziale: StatoPartita = {
        turnoAttuale: 0,
        idGiocatoreAttivo: Math.random() < 0.5 ? 1 : 2,
        faseTurno: "InizioPartita",
        giocatori: [
            { id: 1, eroe: { idGiocatore: 1, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe }, mano: [], mazzoRimanente: shuffleArray([...mazzoDefG1]), carteScartate: [], contatoreFatica: 0 },
            { id: 2, eroe: { idGiocatore: 2, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe }, mano: [], mazzoRimanente: shuffleArray([...mazzoDefG2]), carteScartate: [], contatoreFatica: 0 }
        ],
        campoG1: Array(MAX_UNITA_CAMPO).fill(null),
        campoG2: Array(MAX_UNITA_CAMPO).fill(null),
        eventiLog: [`--- Partita Iniziata (HP Eroi: ${hpInizialiEroe}) ---`],
        gameOver: false, vincitore: null, prossimoIdIstanzaUnica: 1, primoTurnoP1Saltato: false,
    };
    logEvento(statoIniziale, `Giocatore ${statoIniziale.idGiocatoreAttivo} inizia.`);

    let stato: StatoPartita;
    try { stato = JSON.parse(JSON.stringify(statoIniziale)); }
    catch(e) { console.error("Errore clonazione stato:", e); return statoIniziale; } // Usa statoIniziale con errore

    logEvento(stato, `Sistema: Fase Inizio Battaglia (TODO)`);

    while (!stato.gameOver && stato.turnoAttuale < MAX_TURNI) {
        stato.turnoAttuale++;

        faseInizioTurno(stato);
        fasePesca(stato);               if (stato.gameOver) break;
        fasePreparazione(stato);
        faseGiocoCarte(stato);
        faseAttacco(stato);             if (stato.gameOver) break;
        faseMorteEScorrimento(stato);   if (stato.gameOver) break;
        faseFineTurno(stato);

        if (!stato.gameOver) { stato.idGiocatoreAttivo = stato.idGiocatoreAttivo === 1 ? 2 : 1; }
    }

    if (!stato.gameOver && stato.turnoAttuale >= MAX_TURNI) {
        stato.gameOver = true;
        logEvento(stato, `!!! Limite Turni (${MAX_TURNI}) Raggiunto!`);
        const hpG1 = stato.giocatori.find(g => g.id === 1)!.eroe.hpAttuali;
        const hpG2 = stato.giocatori.find(g => g.id === 2)!.eroe.hpAttuali;
        if (hpG1 > hpG2) { stato.vincitore = 1; }
        else if (hpG2 > hpG1) { stato.vincitore = 2; }
        else { stato.vincitore = null; }
        logEvento(stato, `Vincitore per HP: ${stato.vincitore !== null ? `Giocatore ${stato.vincitore}` : 'Pareggio'}`);
    } else if (!stato.gameOver) { // Caso limite uscita anomala
        logEvento(stato, `Attenzione: Uscita dal loop anomala. Turno: ${stato.turnoAttuale}`);
        stato.gameOver = true; stato.vincitore = null; // Pareggio per sicurezza
    }

    logEvento(stato, `--- PARTITA TERMINATA --- ${stato.vincitore !== null ? `VINCITORE: Giocatore ${stato.vincitore}` : 'PAREGGIO'}`);
    return stato;
}