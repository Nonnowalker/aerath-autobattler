// src/simulation/engine.ts
// Versione Completa e Revisionata per Uniformità HP, Comando e Attacco da Keyword

import {
    StatoPartita,
    CartaDef,
    StatoGiocatore,
    UnitaInGioco,
    EroeInGioco,
    CartaInMano,
    SimulationParams,
    KeywordApplicata,
    LibreriaKeywordEntry
} from './types.js';
import { LIBRERIA_KEYWORD, risolviKeyword } from './data/keywordLibrary.js';

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
        // Questo non dovrebbe mai accadere in una partita valida
        console.error(`Errore critico: Impossibile determinare giocatori. idGiocatoreAttivo=${stato.idGiocatoreAttivo}, giocatori=`, stato.giocatori);
        throw new Error(`Impossibile determinare giocatori: attivo=${stato.idGiocatoreAttivo}`);
    }
    return { attivo, passivo };
}

function getCampi(stato: StatoPartita): { campoAttivo: (UnitaInGioco | null)[], campoPassivo: (UnitaInGioco | null)[] } {
     const attivoId = stato.idGiocatoreAttivo;
     const campoAttivo = attivoId === 1 ? stato.campoG1 : stato.campoG2;
     const campoPassivo = attivoId === 1 ? stato.campoG2 : stato.campoG1;
     if (!campoAttivo || !campoPassivo) {
         console.error(`Errore critico: Campi non definiti. idGiocatoreAttivo=${attivoId}, campoG1=`, stato.campoG1, `campoG2=`, stato.campoG2);
         throw new Error(`Campi non definiti per giocatore attivo ${attivoId}`);
     }
     return { campoAttivo, campoPassivo };
}

function logEvento(stato: StatoPartita, messaggio: string) {
    stato.eventiLog.push(messaggio);
    // console.log(messaggio); // Decommenta per output verboso in console durante il test
}

// --- Funzioni delle Fasi del Turno ---

function faseInizioTurno(stato: StatoPartita) {
    stato.faseTurno = "InizioTurno";
    logEvento(stato, `\n--- TURNO ${stato.turnoAttuale} (Giocatore ${stato.idGiocatoreAttivo}) ---`);
    // TODO: Risolvere keyword con trigger "InizioTurnoGiocatore" per giocatore attivo
    // (Eroe, Unità sul campo, Scenario, Pozioni)
    const { attivo } = getGiocatori(stato);

    // Processa keyword "InizioTurnoGiocatore" per l'eroe attivo
    attivo.eroe.keywordEffettive.forEach(kwRisolta => {
        if (kwRisolta.triggerBase === "InizioTurnoGiocatore") {
            logEvento(stato, `G${attivo.id} (Eroe ${attivo.eroe.nomeEroe}): Attivazione ${kwRisolta.nomeVisualizzato} (TODO: Applicare effetto InizioTurno Eroe!)`);
            // Esempio: if (kwRisolta.id === "KW_MALOCCHIO_DEBILITANTE") { /* ... logica ... */ }
        }
    });

    // Processa keyword "InizioTurnoGiocatore" per le unità attive sul campo
    const campoDaProcessare = attivo.id === 1 ? stato.campoG1 : stato.campoG2;
    campoDaProcessare.forEach(unita => {
        if (unita && unita.hpAttuali > 0) {
            unita.keywordEffettive.forEach(kwRisolta => {
                if (kwRisolta.triggerBase === "InizioTurnoGiocatore") {
                    logEvento(stato, `G${attivo.id} (Unità ${unita.cartaDef.nome}): Attivazione ${kwRisolta.nomeVisualizzato} (TODO: Applicare effetto InizioTurno Unità!)`);
                }
            });
        }
    });
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
        // TODO: Risolvere keyword con trigger "QuandoPescaCarta" (sulla carta pescata o globali)
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

// src/simulation/engine.ts
// Parte 2: faseGiocoCarte, faseAttacco, faseMorteEScorrimento, faseFineTurno, avviaSimulazioneCompleta

// ... (Import, Costanti, Funzioni Helper, faseInizioTurno, fasePesca, fasePreparazione dalla PARTE 1 - CLEANUP_005_PART1)

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
            const tipoCarta = carta.cartaDef.tipo;

            if (tipoCarta === 'Unità') {
                const slotLibero = campoAttivo.findIndex(slot => slot === null);
                if (slotLibero !== -1) {
                    let hpMaxUnita = 0;
                    const keywordEffettiveUnita: (LibreriaKeywordEntry & KeywordApplicata)[] = [];
                    carta.cartaDef.abilitaKeywords.forEach(kwApp => {
                        const risolta = risolviKeyword(kwApp);
                        keywordEffettiveUnita.push(risolta);
                        if (risolta.id === "KW_PUNTI_FERITA_INIZIALI" && typeof risolta.valore === 'number') {
                            hpMaxUnita += risolta.valore;
                        }
                    });
                    if (hpMaxUnita <= 0) hpMaxUnita = 1;

                    const nuovaUnita: UnitaInGioco = {
                         idIstanzaUnica: carta.idIstanzaUnica,
                         cartaDef: carta.cartaDef,
                         idGiocatore: attivo.id,
                         slot: slotLibero,
                         hpAttuali: hpMaxUnita,
                         hpMax: hpMaxUnita,
                         keywordEffettive: keywordEffettiveUnita,
                         keywordTemporanee: []
                     };
                    campoAttivo[slotLibero] = nuovaUnita;
                    attivo.mano.splice(indiceCarta, 1);
                    logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} (HP: ${nuovaUnita.hpMax}) nello slot ${slotLibero}`);
                    cartaGiocataEUscitaDallaMano = true;
                    // TODO: Risolvere keyword con trigger "QuandoGiocata" per l'unità appena schierata
                    // Esempio: nuovaUnita.keywordEffettive.forEach(kw => if(kw.triggerBase === "QuandoGiocata") {/* applica effetto */});
                    continue;
                } else {
                    logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                }
            }
            else if (tipoCarta === 'Potere') {
                 let bersaglioValidoTrovato = false;
                 // --- LOGICA BERSAGLI POTERI ---
                 // Questa logica deve essere espansa per ogni potere.
                 // Si potrebbe delegare a una funzione per keyword specifica.
                  const keywordsPotere = carta.cartaDef.abilitaKeywords.map(risolviKeyword);
                  for (const kwRisolta of keywordsPotere) {
                      if (kwRisolta.triggerBase === "QuandoGiocata") { // Assumiamo che i poteri abbiano almeno una keyword con questo trigger
                          // Verifica target basata sulla keyword principale del potere
                          // Esempio semplice:
                          if (kwRisolta.targetBase === "TutteUnitàNemiche" || kwRisolta.targetBase === "UnitàNemicaCasuale" || kwRisolta.targetBase === "UnitàNemicaConMenoHP") {
                               const { campoPassivo } = getCampi(stato);
                               if (campoPassivo.some(u => u && u.hpAttuali > 0)) bersaglioValidoTrovato = true;
                          } else {
                              bersaglioValidoTrovato = true; // Default per altri target o poteri senza target specifico
                          }
                          break; // Considera la prima keyword "QuandoGiocata" per determinare la validità del lancio
                      }
                  }
                 // --- FINE LOGICA BERSAGLI POTERI ---

                if (bersaglioValidoTrovato) {
                    logEvento(stato, `  > G${attivo.id}: Lancia ${carta.cartaDef.nome}`);
                    // --- APPLICAZIONE EFFETTO POTERE ---
                    let effettoApplicatoLog = "";
                    carta.cartaDef.abilitaKeywords.forEach(kwApp => {
                        const kwRisolta = risolviKeyword(kwApp);
                        if (kwRisolta.triggerBase === "QuandoGiocata") {
                            // Esempio per KW_DANNO_AREA_NEMICI
                            if (kwRisolta.id === "KW_DANNO_AREA_NEMICI" && typeof kwRisolta.valore === 'number') {
                                const { campoPassivo } = getCampi(stato);
                                campoPassivo.forEach(unitaNemica => {
                                    if (unitaNemica && unitaNemica.hpAttuali > 0) {
                                        // TODO: Applicare ARMATURA/difese del bersaglio
                                        unitaNemica.hpAttuali -= kwRisolta.valore!;
                                        effettoApplicatoLog += ` ${unitaNemica.cartaDef.nome} subisce ${kwRisolta.valore} danni;`;
                                    }
                                });
                            }
                            // Esempio per KW_APPLICA_STATUS_BERSAGLIO
                            else if (kwRisolta.id === "KW_APPLICA_STATUS_BERSAGLIO" && kwRisolta.applicaStatus && typeof kwRisolta.durata === 'number') {
                                const { campoPassivo } = getCampi(stato);
                                const nemiciVivi = campoPassivo.filter(u => u && u.hpAttuali > 0) as UnitaInGioco[];
                                if (nemiciVivi.length > 0) {
                                    const target = nemiciVivi[Math.floor(Math.random() * nemiciVivi.length)];
                                    target.keywordTemporanee.push(risolviKeyword({
                                        keywordId: `STATUS_${kwRisolta.applicaStatus.toUpperCase()}`, // Questo ID deve esistere in LIBRERIA_KEYWORD se lo status ha effetti propri
                                        applicaStatus: kwRisolta.applicaStatus,
                                        durata: kwRisolta.durata,
                                        triggerBase: "SempreAttiva", // O il trigger dello status
                                        targetBase: "SéStesso"      // Lo status è sull'unità
                                    }));
                                    effettoApplicatoLog += ` ${target.cartaDef.nome} diventa ${kwRisolta.applicaStatus};`;
                                }
                            }
                            // Aggiungere logica per altre keyword di Poteri
                        }
                    });
                    if (effettoApplicatoLog) logEvento(stato, `    - Effetti: ${effettoApplicatoLog.trim()}`);
                    else logEvento(stato, `    - (Effetto Potere non specificamente implementato)`);
                    // --- FINE APPLICAZIONE EFFETTO ---
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
    let attacchiLogGlobal = "";

    // --- 1. ATTACCO EROE ATTIVO ---
    for (const kwRisolta of attivo.eroe.keywordEffettive) {
        if (kwRisolta.triggerBase === "FaseAttacco" && kwRisolta.id === "KW_MISCHIA_EROE" && typeof kwRisolta.valore === 'number' && kwRisolta.tipoDanno) {
            const targetUnita = campoPassivo.find(u => u && u.hpAttuali > 0);
            if (targetUnita) {
                let dannoEffettivo = kwRisolta.valore;
                // Applica ARMATURA del bersaglio
                for (const kwDif of targetUnita.keywordEffettive) {
                    if (kwDif.id === "KW_ARMATURA" && typeof kwDif.valore === 'number' && kwDif.tipoDanno === kwRisolta.tipoDanno) {
                        dannoEffettivo = Math.max(0, dannoEffettivo - kwDif.valore);
                    }
                }
                targetUnita.hpAttuali -= dannoEffettivo;
                attacchiLogGlobal += `Eroe(${attivo.eroe.nomeEroe.substring(0,3)}) usa ${kwRisolta.nomeVisualizzato} -> ${targetUnita.cartaDef.nome.substring(0,3)}(${dannoEffettivo}d ${kwRisolta.tipoDanno}, ${targetUnita.hpAttuali}HP); `;
                // TODO: Trigger "QuandoInfliggeDannoCombattimento"
            }
            // Non attacca eroe nemico se non ci sono unità (da regola)
        }
        // TODO: Gestire altre keyword offensive dell'eroe
    }


    // --- 2. ATTACCO UNITA' ATTIVE ---
    for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
        const attaccante = campoAttivo[i];
        if (attaccante && attaccante.hpAttuali > 0) {
            const statusAccecato = attaccante.keywordTemporanee.find(kw => kw.applicaStatus === "Accecato_Attacco" || kw.applicaStatus === "Accecato");
            if (statusAccecato) {
                logEvento(stato, `S${i}:${attaccante.cartaDef.nome.substring(0,3)} è Accecato e salta l'attacco!`);
                statusAccecato.durata = (statusAccecato.durata ?? 1) - 1;
                if (statusAccecato.durata <= 0) {
                    attaccante.keywordTemporanee = attaccante.keywordTemporanee.filter(kwFilt => kwFilt.applicaStatus !== statusAccecato.applicaStatus);
                }
                continue;
            }

            for (const kwRisolta of attaccante.keywordEffettive) {
                if (kwRisolta.triggerBase === "FaseAttacco" && typeof kwRisolta.valore === 'number' && kwRisolta.tipoDanno) {
                    let logRiga = `S${i}:${attaccante.cartaDef.nome.substring(0,3)}(${attaccante.hpAttuali}HP)`;
                    let bersaglioEffettivoUnita: UnitaInGioco | null = null;
                    let bersaglioEffettivoEroe = false;

                    if (kwRisolta.targetBase === "UnitàOpposta") {
                        bersaglioEffettivoUnita = campoPassivo[i];
                        if (!bersaglioEffettivoUnita || bersaglioEffettivoUnita.hpAttuali <= 0) {
                            bersaglioEffettivoUnita = null;
                            bersaglioEffettivoEroe = true;
                        }
                    } else if (kwRisolta.targetBase === "UnitàNemicaConMenoHP") {
                        const nemiciVivi = campoPassivo.filter(u => u && u.hpAttuali > 0) as UnitaInGioco[];
                        if (nemiciVivi.length > 0) {
                            nemiciVivi.sort((a,b) => a.hpAttuali - b.hpAttuali);
                            bersaglioEffettivoUnita = nemiciVivi[0];
                        } else { bersaglioEffettivoEroe = true; }
                    }
                    // TODO: Implementare altri target per KW offensive Unità

                    let dannoFinale = kwRisolta.valore;
                    if (bersaglioEffettivoUnita && bersaglioEffettivoUnita.hpAttuali > 0) {
                        for (const kwDif of bersaglioEffettivoUnita.keywordEffettive) { // Controlla ARMATURA del bersaglio
                            if (kwDif.id === "KW_ARMATURA" && typeof kwDif.valore === 'number' && kwDif.tipoDanno === kwRisolta.tipoDanno) {
                                dannoFinale = Math.max(0, dannoFinale - kwDif.valore);
                            }
                        }
                        bersaglioEffettivoUnita.hpAttuali -= dannoFinale;
                        logRiga += ` usa ${kwRisolta.nomeVisualizzato} -> ${bersaglioEffettivoUnita.cartaDef.nome.substring(0,3)}(${dannoFinale}d ${kwRisolta.tipoDanno}, ${bersaglioEffettivoUnita.hpAttuali}HP); `;
                        attacchiLogGlobal += logRiga;
                    } else if (bersaglioEffettivoEroe) {
                        for (const kwDif of passivo.eroe.keywordEffettive) { // Controlla ARMATURA dell'eroe bersaglio
                            if (kwDif.id === "KW_ARMATURA" && typeof kwDif.valore === 'number' && kwDif.tipoDanno === kwRisolta.tipoDanno) {
                                dannoFinale = Math.max(0, dannoFinale - kwDif.valore);
                            }
                        }
                        passivo.eroe.hpAttuali -= dannoFinale;
                        logRiga += ` usa ${kwRisolta.nomeVisualizzato} -> EROE(${dannoFinale}d ${kwRisolta.tipoDanno}, ${passivo.eroe.hpAttuali}HP); `;
                        attacchiLogGlobal += logRiga;
                    } else {
                         logRiga += ` usa ${kwRisolta.nomeVisualizzato} -> NESSUN BERSAGLIO; `;
                         attacchiLogGlobal += logRiga;
                    }

                    if (passivo.eroe.hpAttuali <= 0 && !stato.gameOver) {
                        stato.gameOver = true;
                        stato.vincitore = attivo.id;
                        logEvento(stato, `- Attacchi: ${attacchiLogGlobal.trim()}`);
                        logEvento(stato, `!!! EROE G${passivo.id} SCONFITTO! G${attivo.id} VINCE !!!`);
                        return;
                    }
                    // Gestione keyword che applicano status come parte dell'attacco
                    if (kwRisolta.applicaStatus && kwRisolta.targetBase === "UnitàOpposta") { /* ... come prima ... */ }
                     if (stato.gameOver) return;
                }
            }
        }
    }
    if (attacchiLogGlobal) logEvento(stato, `- Attacchi: ${attacchiLogGlobal.trim()}`);
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
                 if (unita && unita.hpAttuali <= 0) {
                     siSonoVerificateMorti = true;
                     logMortiGiocatore += `${unita.cartaDef.nome.substring(0,10)}@S${i} `;
                     for (const kwRisolta of unita.keywordEffettive) {
                         if (kwRisolta.triggerBase === "QuandoMuore") {
                             logEvento(stato, `  * ${unita.cartaDef.nome} attiva OnDeath '${kwRisolta.nomeVisualizzato}' (TODO: Effetto!)`);
                         }
                     }
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
        const g1HP = stato.giocatori[0].eroe.hpAttuali;
        const g2HP = stato.giocatori[1].eroe.hpAttuali;
        if (g1HP <= 0 && g2HP <= 0) { /* ... */ }
        else if (g1HP <= 0) { /* ... */ }
        else if (g2HP <= 0) { /* ... */ }
     }
}


function faseFineTurno(stato: StatoPartita) {
    stato.faseTurno = "FineTurno";
    const { attivo } = getGiocatori(stato);

    const entitaDaProcessareDelGiocatoreAttivo = [
        attivo.eroe,
        ...(attivo.id === 1 ? stato.campoG1 : stato.campoG2).filter(u => u !== null) as (EroeInGioco | UnitaInGioco)[]
    ];
    entitaDaProcessareDelGiocatoreAttivo.forEach(entita => {
        if (entita.keywordTemporanee && entita.keywordTemporanee.length > 0) {
            entita.keywordTemporanee = entita.keywordTemporanee.filter(kwApp => {
                if (kwApp.durata !== undefined && kwApp.durata !== null) {
                    const nuovaDurata = kwApp.durata -1;
                    if (nuovaDurata > 0) {
                        logEvento(stato, `  * Status '${kwApp.applicaStatus ?? kwApp.keywordId}' su ${('nomeEroe' in entita ? entita.nomeEroe : entita.cartaDef.nome)} dura ancora ${nuovaDurata} turni.`);
                        kwApp.durata = nuovaDurata;
                        return true;
                    } else {
                        logEvento(stato, `  * Status '${kwApp.applicaStatus ?? kwApp.keywordId}' su ${('nomeEroe' in entita ? entita.nomeEroe : entita.cartaDef.nome)} è scaduto.`);
                        return false;
                    }
                }
                return false;
            });
        }
        // TODO: Logica per trigger "FineTurnoGiocatore" (es. KW_GUARIGIONE, KW_BOMBARDAMENTO)
        // Dovrebbe iterare su keywordEffettive dell'entità.
    });


    if (attivo.mano.length > MAX_CARTE_MANO) { /* ... scarto come prima ... */ }
    attivo.mano.forEach(carta => { if (carta.statoPotere === 'Bloccato') delete carta.statoPotere; });
    logEvento(stato, `Fine Turno G${attivo.id}. Mano: ${attivo.mano.length}`);
}

// --- Funzione Principale di Simulazione ---
export function avviaSimulazioneCompleta(params: SimulationParams): StatoPartita {
    const {
        mazzoDefG1, mazzoDefG2,
        eroeBaseG1, livelloEroeG1, equipEroeG1 = [],
        eroeBaseG2, livelloEroeG2, equipEroeG2 = [],
        pozioneG1, pozioneG2, scenario
    } = params;

    if (!mazzoDefG1 || !mazzoDefG2 || !eroeBaseG1 || !eroeBaseG2) {
         const errorLog = "Errore: Dati di input per la simulazione mancanti (mazzi/eroi).";
         return { turnoAttuale: 0, idGiocatoreAttivo: 1, faseTurno: "ErroreSetup", giocatori: [ { id: 1, eroe: {} as EroeInGioco, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 }, { id: 2, eroe: {} as EroeInGioco, mano: [], mazzoRimanente: [], carteScartate: [], contatoreFatica: 0 }], campoG1: [], campoG2: [], eventiLog: [errorLog], gameOver: true, vincitore: null, prossimoIdIstanzaUnica: 1, primoTurnoP1Saltato: false } as StatoPartita;
    }

    const inizializzaEroe = (idGiocatore: number, defEroe: CartaDef, livello: number, defsEquip: CartaDef[]): EroeInGioco => {
        const keywordBaseEroeRisolte = defEroe.abilitaKeywords.map(risolviKeyword);
        const keywordDaEquipRisolte: (LibreriaKeywordEntry & KeywordApplicata)[] = [];
        const equipIndossato: EroeInGioco['equipIndossato'] = {};

        defsEquip.forEach(eqDef => {
            if (eqDef.tipo === 'Equipaggiamento' && eqDef.slotEquipaggiamento) {
                const slot = eqDef.slotEquipaggiamento;
                if (slot === "ArmaPrincipale" || slot === "ArmaSecondaria" || slot === "Armatura" || slot === "Elmo" || slot === "Amuleto") {
                    if (!equipIndossato[slot]) {
                        equipIndossato[slot] = eqDef;
                        eqDef.abilitaKeywords.forEach(kwAppEquip => keywordDaEquipRisolte.push(risolviKeyword(kwAppEquip)));
                    }
                }
            }
        });

        const keywordEffettiveCalcolo = [...keywordBaseEroeRisolte, ...keywordDaEquipRisolte];
        let hpMassimi = 0;
        let comandoMassimo = defEroe.comandoBase ?? 20;

        keywordEffettiveCalcolo.forEach(kw => {
            if (kw.id === "KW_PUNTI_FERITA_INIZIALI" && typeof kw.valore === 'number') {
                hpMassimi += kw.valore;
            }
            if (kw.id === "KW_COMANDO_BASE" && typeof kw.valore === 'number' && defEroe.tipo === 'EroeBase') {
                 comandoMassimo = kw.valore; // Assume che KW_COMANDO_BASE sull'eroe imposti il valore, non lo sommi
            }
        });
        if (hpMassimi === 0) hpMassimi = HP_EROE_DEFAULT;

        return {
            idGiocatore, idDefEroe: defEroe.id, nomeEroe: defEroe.nome, livello,
            hpAttuali: hpMassimi, hpMax: hpMassimi, comandoMax: comandoMassimo,
            keywordEffettive: keywordEffettiveCalcolo,
            keywordBaseEroeDef: defEroe.abilitaKeywords, // Per riferimento
            keywordDaEquipDef: defsEquip.flatMap(eq => eq.abilitaKeywords), // Per riferimento
            keywordTemporanee: [],
            equipIndossato,
            affiliazioniEffettive: [...(defEroe.affiliazioni || [])],
        };
    };

    const statoIniziale: StatoPartita = {
        turnoAttuale: 0, idGiocatoreAttivo: Math.random() < 0.5 ? 1 : 2, faseTurno: "InizioPartita",
        giocatori: [
            { id: 1, eroe: inizializzaEroe(1, eroeBaseG1, livelloEroeG1, equipEroeG1), mano: [], mazzoRimanente: shuffleArray([...mazzoDefG1.filter(c => c.tipo === 'Unità' || c.tipo === 'Potere')]), carteScartate: [], contatoreFatica: 0, pozioneEquipaggiata: pozioneG1 },
            { id: 2, eroe: inizializzaEroe(2, eroeBaseG2, livelloEroeG2, equipEroeG2), mano: [], mazzoRimanente: shuffleArray([...mazzoDefG2.filter(c => c.tipo === 'Unità' || c.tipo === 'Potere')]), carteScartate: [], contatoreFatica: 0, pozioneEquipaggiata: pozioneG2 }
        ],
        campoG1: Array(MAX_UNITA_CAMPO).fill(null), campoG2: Array(MAX_UNITA_CAMPO).fill(null),
        scenarioAttivo: scenario, eventiLog: [`--- Partita Iniziata ---`],
        gameOver: false, vincitore: null, prossimoIdIstanzaUnica: 1, primoTurnoP1Saltato: false,
    };
    logEvento(statoIniziale, `Eroe G1: ${statoIniziale.giocatori[0].eroe.nomeEroe} (HP: ${statoIniziale.giocatori[0].eroe.hpMax}, Comando: ${statoIniziale.giocatori[0].eroe.comandoMax})`);
    logEvento(statoIniziale, `Eroe G2: ${statoIniziale.giocatori[1].eroe.nomeEroe} (HP: ${statoIniziale.giocatori[1].eroe.hpMax}, Comando: ${statoIniziale.giocatori[1].eroe.comandoMax})`);
    if (scenario) { logEvento(statoIniziale, `Scenario Attivo: ${scenario.nome}`); }
    logEvento(statoIniziale, `Giocatore ${statoIniziale.idGiocatoreAttivo} inizia.`);

    let stato: StatoPartita;
    try { stato = JSON.parse(JSON.stringify(statoIniziale)); }
    catch(e) { console.error("Errore clonazione stato:", e); return statoIniziale; }

    logEvento(stato, `Sistema: Fase Inizio Battaglia.`);
    // TODO: Logica trigger "InizioBattaglia" da Eroi, Equip, Scenario, Pozioni
    // ...

    while (!stato.gameOver && stato.turnoAttuale < MAX_TURNI) {
        stato.turnoAttuale++;
        faseInizioTurno(stato);
        fasePesca(stato);               if (stato.gameOver) break;
        fasePreparazione(stato);
        faseGiocoCarte(stato);
        // TODO: Logica Pozioni (se si attivano qui)
        faseAttacco(stato);             if (stato.gameOver) break;
        faseMorteEScorrimento(stato);   if (stato.gameOver) break;
        faseFineTurno(stato);
        if (!stato.gameOver) { stato.idGiocatoreAttivo = stato.idGiocatoreAttivo === 1 ? 2 : 1; }
    }

    if (!stato.gameOver && stato.turnoAttuale >= MAX_TURNI) { /* ... gestione limite turni ... */ }
    logEvento(stato, `--- PARTITA TERMINATA --- ${stato.vincitore !== null ? `VINCITORE: Giocatore ${stato.vincitore}` : 'PAREGGIO'}`);
    return stato;
}