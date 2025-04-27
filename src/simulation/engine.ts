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

function faseGiocoCarte(stato: StatoPartita) {
    stato.faseTurno = "GiocoCarte";
    const { attivo } = getGiocatori(stato);
    const { campoAttivo } = getCampi(stato);
    logEvento(stato, `G${attivo.id}: Fase Gioco Carte (Mano: ${attivo.mano.length})`);

    let indiceCarta = 0;
    while (indiceCarta < attivo.mano.length) {
        const carta = attivo.mano[indiceCarta];
        let cartaGiocataEUscitaDallaMano = false;

        if (carta.preparazioneAttuale === 0 && carta.statoPotere !== 'Bloccato') {
            logEvento(stato, `- Tentativo gioco: ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica})`);

            if (carta.cartaDef.tipo === 'Unita') {
                
                console.log(`>>> FGC Check Unità: ${carta.cartaDef.nome} Prep 0. Ispeziono campoAttivo...`);
                console.log(`>>> Contenuto campoAttivo: [${campoAttivo.map(s => `${JSON.stringify(s)}(${typeof s})`).join(', ')}]`); // Logga valore e tipo di ogni slot
                console.log(`>>> ID Giocatore Attivo: ${attivo.id}, Array Referenziato: ${attivo.id === 1 ? 'stato.campoG1' : 'stato.campoG2'}`) // Verifica quale array stiamo guardando

                const slotLibero = campoAttivo.findIndex(slot => slot === null); // Torniamo al check stretto
                console.log(`>>> Risultato findIndex(slot => slot === null): slotLibero = ${slotLibero}`);

                if (slotLibero !== -1) {
                    console.log(">>> CONDIZIONE if (slotLibero !== -1) SODDISFATTA! Procedo a schierare.") // <-- VEDIAMO QUESTO?
                    const nuovaUnita: UnitaInGioco = { /* ... */ };
                    campoAttivo[slotLibero] = nuovaUnita;
                    attivo.mano.splice(indiceCarta, 1);
                    logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} nello slot ${slotLibero}`);
                    cartaGiocataEUscitaDallaMano = true;
                    continue;
                } else {
                    console.log(">>> CONDIZIONE if (slotLibero !== -1) FALLITA.") // <-- O VEDIAMO QUESTO?
                    logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                }

                if (slotLibero !== -1) {
                    const nuovaUnita: UnitaInGioco = {
                         idIstanzaUnica: carta.idIstanzaUnica, cartaDef: carta.cartaDef,
                         idGiocatore: attivo.id, slot: slotLibero,
                         vitaAttuale: carta.cartaDef.vita!, attaccoAttuale: carta.cartaDef.attacco!,
                     };
                    campoAttivo[slotLibero] = nuovaUnita;
                    attivo.mano.splice(indiceCarta, 1);
                    logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} nello slot ${slotLibero}`);
                    cartaGiocataEUscitaDallaMano = true;
                    continue;
                } else {
                    logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                }
            }
            else if (carta.cartaDef.tipo === 'Potere') {
                 let bersaglioValidoTrovato = false;
                  if (carta.cartaDef.id === 'fulmine_improvviso') {
                     const nemiciVivi = getCampi(stato).campoPassivo.filter(u => u !== null && u.vitaAttuale > 0);
                     if (nemiciVivi.length > 0) bersaglioValidoTrovato = true;
                 } else { bersaglioValidoTrovato = true; }

                if (bersaglioValidoTrovato) {
                    logEvento(stato, `  > G${attivo.id}: Lancia ${carta.cartaDef.nome}`);
                    if (carta.cartaDef.id === 'fulmine_improvviso') {
                         const nemiciViviOrdinati = (getCampi(stato).campoPassivo.filter(u => u && u.vitaAttuale > 0) as UnitaInGioco[]).sort((a,b)=> a.vitaAttuale - b.vitaAttuale);
                          if(nemiciViviOrdinati.length > 0){
                              const target = nemiciViviOrdinati[0];
                              const danno = 3;
                              target.vitaAttuale -= danno;
                              logEvento(stato, `    - Colpisce ${target.cartaDef.nome} per ${danno} (HP: ${target.vitaAttuale})`);
                          } else {
                              logEvento(stato, `    - Effetto Fulmine fallito (nessun nemico vivo trovato?)`); // Log di sicurezza
                          }
                    } else { logEvento(stato, `    - Effetto di ${carta.cartaDef.nome} non implementato!`); }
                    attivo.carteScartate.push(carta.cartaDef);
                    attivo.mano.splice(indiceCarta, 1);
                    cartaGiocataEUscitaDallaMano = true;
                    continue;
                } else {
                    logEvento(stato, `  > Fallito: Nessun bersaglio valido per ${carta.cartaDef.nome}`);
                    carta.statoPotere = 'Bloccato';
                }
            }
        }

        if (!cartaGiocataEUscitaDallaMano) {
            indiceCarta++;
        }
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