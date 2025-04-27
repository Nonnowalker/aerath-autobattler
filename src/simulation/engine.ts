// src/simulation/engine.ts
// Versione Completa e Pulita

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
    // Implementazione Fisher-Yates shuffle
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getGiocatori(stato: StatoPartita): { attivo: StatoGiocatore, passivo: StatoGiocatore } {
    // Restituisce gli oggetti giocatore attivo e passivo
    const attivo = stato.giocatori.find(g => g.id === stato.idGiocatoreAttivo);
    const passivo = stato.giocatori.find(g => g.id !== stato.idGiocatoreAttivo);
    if (!attivo || !passivo) {
        // Questo non dovrebbe mai accadere in una partita valida
        throw new Error(`Errore critico: Impossibile determinare giocatori attivo/passivo per idGiocatoreAttivo=${stato.idGiocatoreAttivo}`);
    }
    return { attivo, passivo };
}

function getCampi(stato: StatoPartita): { campoAttivo: (UnitaInGioco | null)[], campoPassivo: (UnitaInGioco | null)[] } {
    // Restituisce gli array del campo battaglia per giocatore attivo e passivo
     const campoAttivo = stato.idGiocatoreAttivo === 1 ? stato.campoG1 : stato.campoG2;
     const campoPassivo = stato.idGiocatoreAttivo === 1 ? stato.campoG2 : stato.campoG1;
     return { campoAttivo, campoPassivo };
}

function logEvento(stato: StatoPartita, messaggio: string) {
    // Aggiunge un messaggio al log eventi della partita
    stato.eventiLog.push(messaggio);
}

// --- Funzioni delle Fasi del Turno ---

function faseInizioTurno(stato: StatoPartita) {
    stato.faseTurno = "InizioTurno";
    logEvento(stato, `\n--- TURNO ${stato.turnoAttuale} (Giocatore ${stato.idGiocatoreAttivo}) ---`);
    // TODO: Risolvere eventuali effetti "inizio turno" qui
}

function fasePesca(stato: StatoPartita) {
    stato.faseTurno = "Pesca";
    const { attivo } = getGiocatori(stato);

    // Regola speciale per il primo turno del Giocatore 1
    if (stato.turnoAttuale === 1 && stato.idGiocatoreAttivo === 1 && !stato.primoTurnoP1Saltato) {
        logEvento(stato, `G${attivo.id}: Salta la pesca del primo turno.`);
        stato.primoTurnoP1Saltato = true;
        return; // Nessuna pesca o fatica
    }

    // Pesca o Fatica
    if (attivo.mazzoRimanente.length === 0) {
        attivo.contatoreFatica++;
        const dannoFatica = attivo.contatoreFatica;
        attivo.eroe.hpAttuali -= dannoFatica;
        logEvento(stato, `G${attivo.id}: Mazzo vuoto! Subisce ${dannoFatica} danni da Fatica (HP Eroe: ${attivo.eroe.hpAttuali})`);
         // Controllo KO immediato da fatica
         if (attivo.eroe.hpAttuali <= 0 && !stato.gameOver) {
             stato.gameOver = true;
             stato.vincitore = attivo.id === 1 ? 2 : 1; // Vince l'avversario
             logEvento(stato, `!!! EROE G${attivo.id} SCONFITTO DALLA FATICA! G${stato.vincitore} VINCE !!!`);
         }
    } else {
        // Pesca una carta dal mazzo
        const cartaPescataDef = attivo.mazzoRimanente.shift()!;
        const nuovaCartaInMano: CartaInMano = {
            idIstanzaUnica: stato.prossimoIdIstanzaUnica++,
            cartaDef: cartaPescataDef,
            preparazioneAttuale: cartaPescataDef.punteggioPreparazioneIniziale,
            // statoPotere non settato al pescaggio
        };
        attivo.mano.push(nuovaCartaInMano); // Aggiunge alla mano (lo scarto avviene a fine turno)
        logEvento(stato, `G${attivo.id}: Pesca ${cartaPescataDef.nome} (Prep: ${nuovaCartaInMano.preparazioneAttuale})`);
    }
}

function fasePreparazione(stato: StatoPartita) {
    stato.faseTurno = "Preparazione";
    const { attivo } = getGiocatori(stato);
    logEvento(stato, `G${attivo.id}: Fase Preparazione.`);
    let logPrep = ""; // Log compatto
    for (const carta of attivo.mano) {
        const nomeCarta = carta.cartaDef.nome.substring(0,10);
        if (carta.preparazioneAttuale > 0) {
            const prepPre = carta.preparazioneAttuale;
            carta.preparazioneAttuale--; // Decrementa preparazione
            logPrep += `${nomeCarta}(${prepPre}->${carta.preparazioneAttuale}) `;
        } else {
            // Logga solo se ha stati particolari (come Bloccato*)
             if (carta.statoPotere === 'Bloccato') {
                 logPrep += `${nomeCarta}(${carta.preparazioneAttuale}*B) `;
             }
        }
    }
    // Logga solo se è successo qualcosa nella preparazione
    if (logPrep) logEvento(stato, `- Prep: ${logPrep.trim()}`);
}

function faseGiocoCarte(stato: StatoPartita) {
    stato.faseTurno = "GiocoCarte";
    const { attivo } = getGiocatori(stato);
    const { campoAttivo } = getCampi(stato);
    logEvento(stato, `G${attivo.id}: Fase Gioco Carte (Mano: ${attivo.mano.length})`);

    let indiceCarta = 0;
    // Itera sulla mano da sinistra a destra
    while (indiceCarta < attivo.mano.length) {
        const carta = attivo.mano[indiceCarta];
        let cartaGiocataEUscitaDallaMano = false;

        // Condizione per giocare: Preparazione a 0 e non già Bloccata in questo turno
        if (carta.preparazioneAttuale === 0 && carta.statoPotere !== 'Bloccato') {
            logEvento(stato, `- Tentativo gioco: ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica})`);

            if (carta.cartaDef.tipo === 'Unita') {
                // Trova il primo slot disponibile sul campo del giocatore attivo
                const slotLibero = campoAttivo.findIndex(slot => !slot);

                if (slotLibero !== -1) { // Slot trovato
                    const nuovaUnita: UnitaInGioco = {
                        idIstanzaUnica: carta.idIstanzaUnica,
                        cartaDef: carta.cartaDef,
                        idGiocatore: attivo.id,
                        slot: slotLibero,
                        vitaAttuale: carta.cartaDef.vita!, // Assumi 'vita' definito per Unità
                        attaccoAttuale: carta.cartaDef.attacco!, // Assumi 'attacco' definito
                    };
                    campoAttivo[slotLibero] = nuovaUnita; // Schiera unità
                    attivo.mano.splice(indiceCarta, 1); // Rimuovi dalla mano
                    logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} nello slot ${slotLibero}`);
                    cartaGiocataEUscitaDallaMano = true; // Carta è stata rimossa
                } else {
                    // Non ci sono slot liberi
                    logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                    // La carta resta in mano, l'indice incrementa sotto
                }
            }
            else if (carta.cartaDef.tipo === 'Potere') {
                // Gestione poteri
                let bersaglioValidoTrovato = false; // Placeholder
                // --- LOGICA PER CONDIZIONI/BERSAGLI DEI POTERI ---
                // Questa sezione VA IMPLEMENTATA carta per carta o con un sistema più generico
                if (carta.cartaDef.id === 'fulmine_improvviso') {
                     const nemiciVivi = getCampi(stato).campoPassivo.filter(u => u !== null && u.vitaAttuale > 0);
                     // Condizione: esiste almeno un nemico vivo
                     if (nemiciVivi.length > 0) {
                         bersaglioValidoTrovato = true;
                     }
                } else {
                     // Default temporaneo: altri poteri (se ce ne fossero) si lanciano sempre
                     bersaglioValidoTrovato = true;
                }
                // --- FINE LOGICA CONDIZIONI/BERSAGLI ---

                if (bersaglioValidoTrovato) {
                    logEvento(stato, `  > G${attivo.id}: Lancia ${carta.cartaDef.nome}`);
                    // --- APPLICARE QUI L'EFFETTO DEL POTERE ---
                    if (carta.cartaDef.id === 'fulmine_improvviso') {
                         // Trova bersaglio effettivo (nemico con meno vita)
                         const { campoPassivo } = getCampi(stato);
                         const nemiciVivi = campoPassivo.filter(u => u !== null && u.vitaAttuale > 0) as UnitaInGioco[];
                         if(nemiciVivi.length > 0){ // Ricontrollo sicurezza
                            nemiciVivi.sort((a, b) => a.vitaAttuale - b.vitaAttuale); // Ordina per vita crescente
                            const target = nemiciVivi[0]; // Il bersaglio è quello con meno vita
                            const dannoFulmine = 3; // Valore d'esempio
                            target.vitaAttuale -= dannoFulmine;
                            logEvento(stato, `    - Fulmine colpisce ${target.cartaDef.nome} per ${dannoFulmine} danni (HP: ${target.vitaAttuale})`);
                         }
                    } else {
                         logEvento(stato, `    - Effetto di ${carta.cartaDef.nome} non implementato! (Placeholder)`);
                    }
                    // --- FINE APPLICAZIONE EFFETTO ---
                    attivo.carteScartate.push(carta.cartaDef); // Aggiungi carta usata agli scarti
                    attivo.mano.splice(indiceCarta, 1); // Rimuovi dalla mano
                    cartaGiocataEUscitaDallaMano = true; // Carta è stata rimossa
                } else {
                    // Bersaglio non trovato o condizione non soddisfatta
                    logEvento(stato, `  > Fallito: Nessun bersaglio/condizione per ${carta.cartaDef.nome}`);
                    carta.statoPotere = 'Bloccato'; // Marca per non riprovare in questo turno
                    // La carta resta in mano, l'indice incrementa sotto
                }
            }
        } // fine if preparazione === 0

        // Incrementa l'indice SOLO se la carta corrente NON è stata rimossa dalla mano.
        // Se splice è stato chiamato, la prossima iterazione del while valuterà la carta
        // che è slittata nella posizione 'indiceCarta'.
        if (!cartaGiocataEUscitaDallaMano) {
            indiceCarta++;
        }

    } // Fine while mano
}


function faseAttacco(stato: StatoPartita) {
    stato.faseTurno = "Attacco";
    const { attivo, passivo } = getGiocatori(stato);
    const { campoAttivo, campoPassivo } = getCampi(stato);
    logEvento(stato, `G${attivo.id}: Fase Attacco.`);
    let attacchiLog = ""; // Log cumulativo per il turno

    for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
        const attaccante = campoAttivo[i];

        // L'unità attacca solo se è presente e viva
        if (attaccante && attaccante.vitaAttuale > 0) {
            const bersaglioUnita = campoPassivo[i];
            const nomeAttaccante = attaccante.cartaDef.nome.substring(0, 3); // Nome corto
            let logRiga = `S${i}:${nomeAttaccante}(${attaccante.vitaAttuale}HP)`;

            // Controlla se c'è un'unità nemica viva nello slot opposto
            if (bersaglioUnita && bersaglioUnita.vitaAttuale > 0) {
                const nomeBersaglio = bersaglioUnita.cartaDef.nome.substring(0, 3);
                const danno = attaccante.attaccoAttuale;
                bersaglioUnita.vitaAttuale -= danno;
                logRiga += ` -> ${nomeBersaglio}(${danno}d, ${bersaglioUnita.vitaAttuale}HP); `;
                attacchiLog += logRiga;
                // TODO: Gestire qui abilità come Rappresaglia del difensore
            } else {
                // Altrimenti, attacca l'eroe nemico
                const danno = attaccante.attaccoAttuale;
                passivo.eroe.hpAttuali -= danno;
                logRiga += ` -> EROE(${danno}d, ${passivo.eroe.hpAttuali}HP); `;
                attacchiLog += logRiga;

                // Controllo KO immediato dell'eroe avversario
                if (passivo.eroe.hpAttuali <= 0 && !stato.gameOver) {
                    stato.gameOver = true;
                    stato.vincitore = attivo.id;
                    logEvento(stato, `- Attacchi fino a sconfitta: ${attacchiLog}`);
                    logEvento(stato, `!!! EROE G${passivo.id} SCONFITTO! G${attivo.id} VINCE !!!`);
                    return; // Interrompi la fase di attacco
                }
            }
            // TODO: Gestire qui abilità dell'attaccante (es. doppio attacco)
        }
    }
    // Logga gli attacchi avvenuti solo se ce ne sono stati
    if (attacchiLog) logEvento(stato, `- Attacchi: ${attacchiLog.trim()}`);
}

function faseMorteEScorrimento(stato: StatoPartita) {
    stato.faseTurno = "Morte";
    let siSonoVerificateMorti = false; // Flag per loggare la fase solo se serve
    let logMortiTotale = "";

    // Ciclo sui due giocatori perché entrambe le parti possono subire morti
    for (const idGiocatoreProcessato of [1, 2]) {
        const campo = idGiocatoreProcessato === 1 ? stato.campoG1 : stato.campoG2;
        const giocatore = stato.giocatori.find(g => g.id === idGiocatoreProcessato)!;
        let ricontrollaQuestoCampo = true; // Flag per gestire morti a catena
        let logMortiGiocatore = "";

        // Continua a ciclare sullo stesso campo finché ci sono morti da processare
        while (ricontrollaQuestoCampo) {
            ricontrollaQuestoCampo = false; // Resetta il flag, si riattiva solo se troviamo un morto
            // Scansiona il campo da sinistra a destra
            for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
                const unita = campo[i];
                if (unita && unita.vitaAttuale <= 0) { // Unità morta trovata
                    siSonoVerificateMorti = true; // Indica che dobbiamo loggare la fase
                    logMortiGiocatore += `${unita.cartaDef.nome.substring(0,10)}@S${i} `; // Logga l'unità morta
                    // --- ATTIVAZIONE ON-DEATH (TODO) ---
                    // Esempio: if (unita.cartaDef.haOnDeath) { attivaEffettoOnDeath(stato, unita); }
                    // --- FINE ON-DEATH ---
                    giocatore.carteScartate.push(unita.cartaDef); // Aggiungi definizione carta agli scarti
                    campo[i] = null; // Rimuovi l'unità dal campo

                    // --- SCORRIMENTO ---
                    // Sposta tutte le unità alla destra dello slot liberato una posizione a sinistra
                    for (let j = i + 1; j < MAX_UNITA_CAMPO; j++) {
                        if (campo[j]) {
                            campo[j - 1] = campo[j]; // Sposta riferimento unità
                            campo[j - 1]!.slot = j - 1; // Aggiorna slot interno all'oggetto unità
                            campo[j] = null; // Libera slot originale
                        } else {
                            break; // Non ci sono più unità a destra da spostare
                        }
                    }
                    ricontrollaQuestoCampo = true; // Abbiamo modificato il campo, serve riesaminarlo dall'inizio
                    break; // Interrompe il 'for' interno e fa ripartire il 'while' per riesaminare
                }
            } // Fine for slot i
        } // Fine while ricontrollaCampo
        if (logMortiGiocatore) logMortiTotale += `Morti G${idGiocatoreProcessato}: ${logMortiGiocatore}; `;
    } // Fine for idGiocatoreProcessato

    // Logga solo se sono avvenute morti
    if (siSonoVerificateMorti) {
        logEvento(stato, `Sistema: Fase Morte & Scorrimento.`);
        if (logMortiTotale) logEvento(stato, `- ${logMortiTotale.trim()}`);
    }

    // Controllo vittoria post-morte (es. effetti onDeath) - importante farlo dopo aver processato entrambi i campi
     if (!stato.gameOver) { // Controlla solo se la partita non è già finita
        const hpG1 = stato.giocatori[0].eroe.hpAttuali;
        const hpG2 = stato.giocatori[1].eroe.hpAttuali;
        // Gestisce anche il caso raro di KO simultaneo
        if (hpG1 <= 0 && hpG2 <= 0) {
            stato.gameOver = true; stato.vincitore = null; // Pareggio
            logEvento(stato, `!!! ENTRAMBI GLI EROI SCONFITTI (post-morte)! PAREGGIO !!!`);
        } else if (hpG1 <= 0) {
           stato.gameOver = true; stato.vincitore = 2; // G1 è KO, vince G2
           logEvento(stato, `!!! EROE G1 SCONFITTO (post-morte)! G2 VINCE !!!`);
        } else if (hpG2 <= 0) {
           stato.gameOver = true; stato.vincitore = 1; // G2 è KO, vince G1
           logEvento(stato, `!!! EROE G2 SCONFITTO (post-morte)! G1 VINCE !!!`);
        }
     }
}


function faseFineTurno(stato: StatoPartita) {
    stato.faseTurno = "FineTurno";
    const { attivo } = getGiocatori(stato);

    // Scarto per mano piena (limite MAX_CARTE_MANO)
    if (attivo.mano.length > MAX_CARTE_MANO) {
        logEvento(stato, `G${attivo.id}: Mano piena (${attivo.mano.length} > ${MAX_CARTE_MANO}), scarto carte...`);
        // Crea un array [carta, indiceOriginale] per ordinamento stabile
        const manoConIndice = attivo.mano.map((carta, index) => ({ carta, index }));
        // Ordina: 1. Preparazione decrescente, 2. Indice decrescente (più a destra)
        manoConIndice.sort((a, b) => {
            if (b.carta.preparazioneAttuale !== a.carta.preparazioneAttuale) {
                return b.carta.preparazioneAttuale - a.carta.preparazioneAttuale;
            }
            return b.index - a.index;
        });

        const numeroCarteDaScartare = attivo.mano.length - MAX_CARTE_MANO;
        const idIstanzeDaScartare = new Set<number>(); // Usa ID istanza per rimuovere correttamente
        let logScarto = "";
        for (let i = 0; i < numeroCarteDaScartare; i++) {
            const { carta } = manoConIndice[i]; // Prendi la carta dall'array ordinato
            logScarto += `${carta.cartaDef.nome.substring(0,10)}(P${carta.preparazioneAttuale}) `;
            attivo.carteScartate.push(carta.cartaDef); // Aggiungi definizione carta al cimitero
            idIstanzeDaScartare.add(carta.idIstanzaUnica); // Aggiungi il suo ID al set da rimuovere
        }
        if (logScarto) logEvento(stato, ` > Scarta: ${logScarto.trim()}`);
        // Filtra la mano mantenendo solo le carte il cui ID non è nel set da scartare
        attivo.mano = attivo.mano.filter(c => !idIstanzeDaScartare.has(c.idIstanzaUnica));
    }

    // Reset dello stato 'Bloccato' sui Poteri rimasti in mano.
    // Saranno rivalutati nella prossima fase GiocoCarte del giocatore.
    for (const carta of attivo.mano) {
        if (carta.statoPotere === 'Bloccato') {
            delete carta.statoPotere;
        }
    }

    logEvento(stato, `Fine Turno G${attivo.id}. Mano: ${attivo.mano.length}`);
}

// --- Funzione Principale di Simulazione ---
export function avviaSimulazioneCompleta(params: SimulationParams): StatoPartita {
    const { mazzoDefG1, mazzoDefG2, hpInizialiEroe = HP_EROE_DEFAULT } = params;

    // Validazione Input Base
    if (!mazzoDefG1 || mazzoDefG1.length === 0 || !mazzoDefG2 || mazzoDefG2.length === 0) {
         const errorLog = "Errore: Impossibile avviare la simulazione, mazzi non validi o vuoti.";
         // Ritorna uno stato minimo di errore
         return {
             turnoAttuale: 0, idGiocatoreAttivo: 1, faseTurno: "ErroreSetup",
             giocatori: [
                 { id: 1, eroe: { idGiocatore: 1, hpAttuali: 0, hpMax: hpInizialiEroe}, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 },
                 { id: 2, eroe: { idGiocatore: 2, hpAttuali: 0, hpMax: hpInizialiEroe}, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 }
             ],
             campoG1: Array(MAX_UNITA_CAMPO).fill(null), campoG2: Array(MAX_UNITA_CAMPO).fill(null),
             eventiLog: [errorLog], gameOver: true, vincitore: null, prossimoIdIstanzaUnica: 1, primoTurnoP1Saltato: false
         };
    }

    // Inizializzazione Stato Partita
    const statoIniziale: StatoPartita = {
        turnoAttuale: 0, // Turno 0 è la preparazione, il gioco inizia al turno 1
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

    // Clonazione dello Stato Iniziale per la Simulazione
    let stato: StatoPartita;
    try {
         // Usiamo JSON parse/stringify per una deep copy semplice (attenzione a tipi non JSON standard se li aggiungi)
         stato = JSON.parse(JSON.stringify(statoIniziale));
    } catch(e) {
        console.error("Errore critico durante la clonazione dello stato iniziale:", e);
        statoIniziale.eventiLog.push("Errore interno motore: impossibile clonare stato iniziale.");
        statoIniziale.gameOver = true;
        return statoIniziale; // Ritorna stato con errore
    }

    // --- FASE INIZIO BATTAGLIA ---
    // TODO: Risolvere eventuali effetti "Inizio Battaglia" qui
    logEvento(stato, `Sistema: Fase Inizio Battaglia (Nessun effetto implementato).`);

    // --- CICLO PRINCIPALE DEI TURNI ---
    while (!stato.gameOver && stato.turnoAttuale < MAX_TURNI) {
        // Incrementa il contatore del turno all'inizio del ciclo
        stato.turnoAttuale++;

        // Esegui le fasi sequenzialmente per il giocatore attivo
        faseInizioTurno(stato);
        fasePesca(stato);               if (stato.gameOver) break; // Fatica può causare KO
        fasePreparazione(stato);
        faseGiocoCarte(stato);          // Carte vengono giocate qui
        faseAttacco(stato);             if (stato.gameOver) break; // Attacchi possono causare KO
        faseMorteEScorrimento(stato);   if (stato.gameOver) break; // Morti/OnDeath possono causare KO
        faseFineTurno(stato);           // Scarto per mano piena e cleanup

        // Passaggio del turno SOLO se la partita non è già terminata
        if (!stato.gameOver) {
            stato.idGiocatoreAttivo = stato.idGiocatoreAttivo === 1 ? 2 : 1;
        }
    } // --- Fine ciclo while ---

    // --- RISOLUZIONE FINE PARTITA (Post-Loop) ---
    if (!stato.gameOver) { // Se esce dal loop senza un vincitore...
        if (stato.turnoAttuale >= MAX_TURNI) { // ...è per limite turni
            stato.gameOver = true;
            logEvento(stato, `!!! Limite Turni (${MAX_TURNI}) Raggiunto!`);
            // Determina vincitore in base agli HP
            const hpG1 = stato.giocatori[0].eroe.hpAttuali;
            const hpG2 = stato.giocatori[1].eroe.hpAttuali;
            if (hpG1 > hpG2) stato.vincitore = 1;
            else if (hpG2 > hpG1) stato.vincitore = 2;
            else stato.vincitore = null; // Pareggio per HP
            logEvento(stato, `Vincitore per HP: ${stato.vincitore !== null ? `Giocatore ${stato.vincitore}` : 'Pareggio'}`);
        } else {
            // Situazione imprevista se esce dal loop prima del limite turni senza gameOver = true
            logEvento(stato, `Attenzione: Uscita dal loop principale inaspettata al turno ${stato.turnoAttuale}.`);
             stato.gameOver = true;
             stato.vincitore = null; // Default a pareggio in caso di errore?
        }
    }

    logEvento(stato, `--- PARTITA TERMINATA --- ${stato.vincitore !== null ? `VINCITORE: Giocatore ${stato.vincitore}` : 'PAREGGIO'}`);
    return stato; // Restituisce lo stato finale della partita
}