// src/simulation/engine.ts
import {
    StatoPartita,
    CartaDef,
    StatoGiocatore,
    UnitaInGioco,
    EroeInGioco,
    CartaInMano,
    SimulationParams
} from './types.js'; // IMPORTANTE: Aggiungere .js

// --- Costanti Configurabili ---
const MAX_CARTE_MANO = 7;
const MAX_UNITA_CAMPO = 7;
const HP_EROE_DEFAULT = 40;
const MAX_TURNI = 100; // Rimesso a 100, abbassa se necessario per debug

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
    return { attivo, passivo };
}

function getCampi(stato: StatoPartita): { campoAttivo: (UnitaInGioco | null)[], campoPassivo: (UnitaInGioco | null)[] } {
     const campoAttivo = stato.idGiocatoreAttivo === 1 ? stato.campoG1 : stato.campoG2;
     const campoPassivo = stato.idGiocatoreAttivo === 1 ? stato.campoG2 : stato.campoG1;
     return { campoAttivo, campoPassivo };
}

function logEvento(stato: StatoPartita, messaggio: string) {
    // console.log(messaggio); // DEBUG: Decommenta per vedere i log in console node/browser
    stato.eventiLog.push(messaggio);
}

// --- Funzioni delle Fasi del Turno ---

function faseInizioTurno(stato: StatoPartita) {
    stato.faseTurno = "InizioTurno";
    logEvento(stato, `\n--- TURNO ${stato.turnoAttuale} (Giocatore ${stato.idGiocatoreAttivo}) ---`);
}

function fasePesca(stato: StatoPartita) {
    stato.faseTurno = "Pesca";
    const { attivo } = getGiocatori(stato); // CORREZIONE: Definire 'attivo' qui

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
         // CONTROLLO VITTORIA POST-FATICA
         if (attivo.eroe.hpAttuali <= 0) {
             stato.gameOver = true;
             stato.vincitore = attivo.id === 1 ? 2 : 1; // Vince l'avversario
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
    const { attivo } = getGiocatori(stato); // Definisci 'attivo'
    logEvento(stato, `G${attivo.id}: Fase Preparazione.`);
    let logPrep = "" // Log più conciso
    for (const carta of attivo.mano) {
        const nomeCarta = carta.cartaDef.nome.substring(0,10); // Nome corto
        if (carta.preparazioneAttuale > 0) {
            const prepPre = carta.preparazioneAttuale;
            carta.preparazioneAttuale--;
            if (carta.statoPotere === 'Bloccato' && carta.preparazioneAttuale > 0) {
                 delete carta.statoPotere; // Rimuovi stato se la preparazione non è 0
            }
            logPrep += `${nomeCarta}(${prepPre}->${carta.preparazioneAttuale}) `;
        } else {
            logPrep += `${nomeCarta}(${carta.preparazioneAttuale}${carta.statoPotere ? '*' : ''}) `;
        }
    }
    if (logPrep) logEvento(stato, `- Prep: ${logPrep.trim()}`);
}

function faseGiocoCarte(stato: StatoPartita) {
    stato.faseTurno = "GiocoCarte";
    const { attivo } = getGiocatori(stato); // Definisci 'attivo'
    const { campoAttivo } = getCampi(stato); // Definisci 'campoAttivo'
    logEvento(stato, `G${attivo.id}: Fase Gioco Carte (Mano: ${attivo.mano.length})`);

    let indiceCarta = 0;
    while (indiceCarta < attivo.mano.length) {
        const carta = attivo.mano[indiceCarta];
        console.log(`[ULTRA DEBUG] Check Idx: ${indiceCarta}, Carta: ${carta?.cartaDef?.nome}, Prep: ${carta?.preparazioneAttuale}, Tipo: ${carta?.cartaDef?.tipo}`);

        let cartaGiocataEUscitaDallaMano = false;

        if (carta.preparazioneAttuale === 0) {
            logEvento(stato, `- Tentativo gioco (Prep=0): ${carta.cartaDef.nome}`);

            if (carta.cartaDef.tipo === 'Unita') {
                 console.log("[ULTRA DEBUG] Carta è Unità a Prep 0!");
                 // --- FORZA TEMPORANEAMENTE LO SCHIERAMENTO (SOLO PER DEBUG!) ---
                 const slotLiberoForzato = campoAttivo.findIndex(slot => !slot); // Usa il findIndex corretto per trovare davvero lo slot!
                 console.log(`[ULTRA DEBUG] Tentativo forzato slot (trovato: ${slotLiberoForzato}). Campo prima:`, JSON.stringify(campoAttivo.map(u => u?.cartaDef.nome ?? null)));

                 if (slotLiberoForzato !== -1) { // Usa il vero slot trovato!
                    const nuovaUnita: UnitaInGioco = {
                         idIstanzaUnica: carta.idIstanzaUnica,
                         cartaDef: carta.cartaDef,
                         idGiocatore: attivo.id,
                         slot: slotLiberoForzato,
                         vitaAttuale: carta.cartaDef.vita!,
                         attaccoAttuale: carta.cartaDef.attacco!,
                     };
                     campoAttivo[slotLiberoForzato] = nuovaUnita; // Piazza nello slot corretto
                     attivo.mano.splice(indiceCarta, 1);
                     logEvento(stato, `  > [DEBUG FORZATO] G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} nello slot ${slotLiberoForzato}`);
                     cartaGiocataEUscitaDallaMano = true;
                     continue; // Riesamina lo stesso indice
                 } else {
                      logEvento(stato, `  > [DEBUG FORZATO FALLITO] Nessuno slot libero trovato! (Campo: ${JSON.stringify(campoAttivo.map(u=>u?.cartaDef.nome ?? null))})`);
                       // NON fare continue, l'indice si incrementerà sotto
                 }
                 // --- FINE DEBUG FORZATO ---

            } else if (carta.cartaDef.tipo === 'Potere') {
                 console.log("[ULTRA DEBUG] Carta è Potere a Prep 0!");
                  // --- FORZA TEMPORANEAMENTE IL LANCIO (SOLO PER DEBUG!) ---
                   logEvento(stato, `  > [DEBUG FORZATO] G${attivo.id}: Lancia ${carta.cartaDef.nome}`);
                   logEvento(stato, `    - Effetto Placeholder applicato! (DEBUG FORZATO)`);
                   attivo.carteScartate.push(carta.cartaDef);
                   attivo.mano.splice(indiceCarta, 1);
                   cartaGiocataEUscitaDallaMano = true;
                   continue; // Riesamina lo stesso indice
                  // --- FINE DEBUG FORZATO ---
            }
        } // fine if prep=0

        if (!cartaGiocataEUscitaDallaMano) {
             // Solo se non è stata rimossa, incrementa per passare alla successiva
             // console.log(`[ULTRA DEBUG] Indice incrementato per ${carta.cartaDef.nome}`);
            indiceCarta++;
        }
    } // Fine while mano
     console.log(`[ULTRA DEBUG] G${attivo.id} Fine GiocoCarte - Campo Attivo:`, JSON.stringify(campoAttivo.map(u => u?.cartaDef.nome ?? null)));
}


function faseAttacco(stato: StatoPartita) {
    stato.faseTurno = "Attacco";
    const { attivo, passivo } = getGiocatori(stato); // Definisci qui
    const { campoAttivo, campoPassivo } = getCampi(stato); // Definisci qui
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
                passivo.eroe.hpAttuali -= danno; // Usa 'passivo' definito sopra
                logRiga += ` -> EROE(${danno}d, ${passivo.eroe.hpAttuali}HP); `;
                attacchiLog += logRiga;

                if (passivo.eroe.hpAttuali <= 0) {
                    stato.gameOver = true;
                    stato.vincitore = attivo.id;
                    logEvento(stato, `- Attacchi fino a sconfitta: ${attacchiLog}`);
                    logEvento(stato, `!!! EROE G${passivo.id} SCONFITTO! G${attivo.id} VINCE !!!`);
                    return;
                }
            }
        }
    }
    if(attacchiLog) logEvento(stato, `- Attacchi: ${attacchiLog.trim()}`);
}

function faseMorteEScorrimento(stato: StatoPartita) {
    stato.faseTurno = "Morte";
    let qualcosaDaLoggare = false;
    let logMortiTotale = "";

    for (const idGiocatoreProcessato of [1, 2]) {
        const campoDaProcessare = idGiocatoreProcessato === 1 ? stato.campoG1 : stato.campoG2;
        const giocatore = stato.giocatori.find(g => g.id === idGiocatoreProcessato)!;
        let reCheckNeeded = true;
        let logMortiGiocatore = "";

        while (reCheckNeeded) {
             reCheckNeeded = false;
             for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
                 const unita = campoDaProcessare[i];
                 if (unita && unita.vitaAttuale <= 0) {
                     qualcosaDaLoggare = true;
                     logMortiGiocatore += `${unita.cartaDef.nome.substring(0,10)}@S${i}(G${idGiocatoreProcessato}) `;
                     // TODO: Effetto OnDeath
                     giocatore.carteScartate.push(unita.cartaDef);
                     campoDaProcessare[i] = null; // Rimuovi

                     // Scorrimento
                     for (let j = i + 1; j < MAX_UNITA_CAMPO; j++) {
                         if (campoDaProcessare[j]) {
                             campoDaProcessare[j-1] = campoDaProcessare[j];
                             campoDaProcessare[j-1]!.slot = j - 1;
                             campoDaProcessare[j] = null;
                         }
                     }
                     reCheckNeeded = true;
                     break; // Ricomincia check
                 }
             }
        }
         if(logMortiGiocatore) logMortiTotale += `Morti G${idGiocatoreProcessato}: ${logMortiGiocatore}; `;
    }

    if(qualcosaDaLoggare) {
         logEvento(stato, `Sistema: Fase Morte & Scorrimento Completata.`);
         if(logMortiTotale) logEvento(stato, `- ${logMortiTotale.trim()}`);
    }

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
    const { attivo } = getGiocatori(stato); // Definisci 'attivo'

    if (attivo.mano.length > MAX_CARTE_MANO) {
        logEvento(stato, `G${attivo.id}: Mano piena (${attivo.mano.length} > ${MAX_CARTE_MANO}), scarto carte...`);
        const manoConIndice = attivo.mano.map((carta, index) => ({ carta, index }));
        manoConIndice.sort((a, b) => {
            if (b.carta.preparazioneAttuale !== a.carta.preparazioneAttuale) {
                return b.carta.preparazioneAttuale - a.carta.preparazioneAttuale;
            }
            return b.index - a.index;
        });

        const numeroCarteDaScartare = attivo.mano.length - MAX_CARTE_MANO;
        const idDaScartare = new Set<number>();
        let logScarto = "";
        for (let i = 0; i < numeroCarteDaScartare; i++) {
            const { carta } = manoConIndice[i];
             logScarto += `${carta.cartaDef.nome.substring(0,10)}(P${carta.preparazioneAttuale}) `;
            attivo.carteScartate.push(carta.cartaDef);
            idDaScartare.add(carta.idIstanzaUnica);
        }
        if(logScarto) logEvento(stato, ` > Scarta: ${logScarto}`);
        attivo.mano = attivo.mano.filter(c => !idDaScartare.has(c.idIstanzaUnica));
    }
     attivo.mano.forEach(carta => { if(carta.statoPotere === 'Bloccato') delete carta.statoPotere; });

    logEvento(stato, `Fine Turno G${attivo.id}. Mano: ${attivo.mano.length}`);
}

// --- Funzione Principale di Simulazione ---
export function avviaSimulazioneCompleta(params: SimulationParams): StatoPartita {
    const { mazzoDefG1, mazzoDefG2, hpInizialiEroe = HP_EROE_DEFAULT } = params;

    const statoIniziale: StatoPartita = {
        turnoAttuale: 0,
        idGiocatoreAttivo: Math.random() < 0.5 ? 1 : 2,
        faseTurno: "InizioPartita",
        giocatori: [
            { id: 1, eroe: { idGiocatore: 1, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe }, mano: [], mazzoRimanente: shuffleArray([...mazzoDefG1]), carteScartate: [], contatoreFatica: 0, },
            { id: 2, eroe: { idGiocatore: 2, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe }, mano: [], mazzoRimanente: shuffleArray([...mazzoDefG2]), carteScartate: [], contatoreFatica: 0, }
        ],
        campoG1: Array(MAX_UNITA_CAMPO).fill(null),
        campoG2: Array(MAX_UNITA_CAMPO).fill(null),
        eventiLog: [`--- Partita Iniziata (HP Eroi: ${hpInizialiEroe}) ---`],
        gameOver: false,
        vincitore: null,
        prossimoIdIstanzaUnica: 1,
        primoTurnoP1Saltato: false,
    };

    logEvento(statoIniziale, `Giocatore ${statoIniziale.idGiocatoreAttivo} inizia.`);
    const stato: StatoPartita = JSON.parse(JSON.stringify(statoIniziale)); // Copia profonda

    logEvento(stato, `Sistema: Fase Inizio Battaglia (TODO)`);

    while (!stato.gameOver && stato.turnoAttuale < MAX_TURNI) {
        stato.turnoAttuale++;

        faseInizioTurno(stato);
        fasePesca(stato);               if (stato.gameOver) break;
        fasePreparazione(stato);
        faseGiocoCarte(stato); // <-- Qui chiamiamo la versione debug forzata
        faseAttacco(stato);             if (stato.gameOver) break;
        faseMorteEScorrimento(stato);   if (stato.gameOver) break;
        faseFineTurno(stato);

        stato.idGiocatoreAttivo = stato.idGiocatoreAttivo === 1 ? 2 : 1;
    }

    if (!stato.gameOver && stato.turnoAttuale >= MAX_TURNI) {
        stato.gameOver = true;
        logEvento(stato, `!!! Limite Turni (${MAX_TURNI}) Raggiunto!`);
        const hpG1 = stato.giocatori[0].eroe.hpAttuali;
        const hpG2 = stato.giocatori[1].eroe.hpAttuali;
        stato.vincitore = hpG1 > hpG2 ? 1 : (hpG2 > hpG1 ? 2 : null);
        logEvento(stato, `Vincitore per HP: G${stato.vincitore ?? 'Pareggio'}`);
    }

     logEvento(stato, `--- PARTITA TERMINATA --- ${stato.vincitore ? `VINCITORE: Giocatore ${stato.vincitore}`: 'PAREGGIO'}`);
    return stato;
}