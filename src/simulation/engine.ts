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
      // Solo se la mano non è già piena viene aggiunta (limite max è fine turno)
      // MA per logica peschiamo sempre, lo scarto avviene dopo
      attivo.mano.push(nuovaCartaInMano);
      logEvento(stato, `G${attivo.id}: Pesca ${cartaPescataDef.nome} (Prep: ${nuovaCartaInMano.preparazioneAttuale})`);
  }
}

function fasePreparazione(stato: StatoPartita) {
  stato.faseTurno = "Preparazione";
  const { attivo } = getGiocatori(stato);
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
  const { attivo } = getGiocatori(stato);
  const { campoAttivo } = getCampi(stato); // campoPassivo e passivo potrebbero servire per i poteri
  logEvento(stato, `G${attivo.id}: Fase Gioco Carte (Mano: ${attivo.mano.length})`);

  let indiceCarta = 0;
  // Usiamo un ciclo 'for' standard che è meno propenso a errori con splice,
  // resettando l'indice quando rimuoviamo un elemento.
  // Oppure iteriamo all'indietro. Proviamo il reset indice:
  while (indiceCarta < attivo.mano.length) {
      const carta = attivo.mano[indiceCarta];
      //console.log(`  [GiocoCarte DEBUG] Check Idx: ${indiceCarta}, Carta: ${carta?.cartaDef?.nome}, Prep: ${carta?.preparazioneAttuale}`);

      if (carta.preparazioneAttuale === 0 && carta.statoPotere !== 'Bloccato') { // Non riprovare a giocare poteri già marcati come bloccati in questo turno
          logEvento(stato, `- Tentativo gioco: ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica})`);
          let cartaGiocata = false; // Flag specifico per questa iterazione

          if (carta.cartaDef.tipo === 'Unita') {
              const slotLibero = campoAttivo.findIndex(slot => slot === null);
              if (slotLibero !== -1 && slotLibero < MAX_UNITA_CAMPO) {
                  // --- Piazza Unità ---
                  const nuovaUnita: UnitaInGioco = {
                      idIstanzaUnica: carta.idIstanzaUnica,
                      cartaDef: carta.cartaDef,
                      idGiocatore: attivo.id,
                      slot: slotLibero,
                      vitaAttuale: carta.cartaDef.vita!,
                      attaccoAttuale: carta.cartaDef.attacco!,
                  };
                  campoAttivo[slotLibero] = nuovaUnita;
                  attivo.mano.splice(indiceCarta, 1); // Rimuove dalla mano
                  logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} nello slot ${slotLibero}`);
                  cartaGiocata = true;
                  // Non incrementare indice, il prossimo elemento è ora a indiceCarta
                  continue; // Ricomincia il ciclo while con lo stesso indice
              } else {
                  logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                  // Non incrementare indice qui, lo fa dopo l'if(!cartaGiocata)
              }
          } else if (carta.cartaDef.tipo === 'Potere') {
              // --- Logica Potere ---
              // 1. Placeholder Bersagli / Condizioni
               let bersaglioValidoTrovato = false; // << --- DA IMPLEMENTARE LOGICA VERA
               // ESEMPIO LOGICA REALE (va adattata alla descrizione del potere specifico!)
               if (carta.cartaDef.id === 'fulmine_improvviso') {
                    // Trova nemico con meno HP, ma solo se ce n'è almeno uno vivo
                    const nemiciVivi = getCampi(stato).campoPassivo.filter(u => u !== null && u.vitaAttuale > 0) as UnitaInGioco[];
                    if(nemiciVivi.length > 0){
                        // Ordina per trovare quello con meno vita
                        nemiciVivi.sort((a, b) => a.vitaAttuale - b.vitaAttuale);
                        const target = nemiciVivi[0];
                        // In un sistema reale, l'azione di applicare effetto avverrebbe qui
                        logEvento(stato, `    (Target per Fulmine sarebbe: ${target.cartaDef.nome} con ${target.vitaAttuale} HP)`);
                        bersaglioValidoTrovato = true;
                        // --- Esempio Applicazione Effetto (Commentato) ---
                         // target.vitaAttuale -= 3; // Danno placeholder
                         // logEvento(stato, `    - ${target.cartaDef.nome} subisce 3 danni (HP: ${target.vitaAttuale})`);
                         // if (target.vitaAttuale <= 0) { /* ... gestisci morte */ }
                         // attivo.mano.splice(indiceCarta, 1); // Rimuovi dalla mano
                         // cartaGiocata = true;
                         // continue; // Ricomincia ciclo while
                    } else {
                        bersaglioValidoTrovato = false; // Nessun nemico vivo
                    }
               } else {
                   // Placeholder per altri poteri: assumi si possa lanciare se non specificato diversamente
                   bersaglioValidoTrovato = true;
               }

              // 2. Gestione in base al bersaglio trovato
              if (bersaglioValidoTrovato) {
                  logEvento(stato, `  > G${attivo.id}: Lancia ${carta.cartaDef.nome}`);
                  logEvento(stato, `    - Effetto Placeholder applicato! (TODO)`); // Qui applichi effetto reale
                  attivo.carteScartate.push(carta.cartaDef); // Potere usato va negli scarti
                  attivo.mano.splice(indiceCarta, 1); // Rimuove dalla mano
                  cartaGiocata = true;
                  continue; // Ricomincia ciclo while con lo stesso indice
              } else {
                  logEvento(stato, `  > Fallito: Nessun bersaglio valido per ${carta.cartaDef.nome}`);
                  carta.statoPotere = 'Bloccato'; // Marca per non riprovare questo turno
                  // Non incrementare indice qui, lo fa dopo l'if(!cartaGiocata)
              }
          } // Fine logica potere

      } // Fine if preparazione === 0

      // Se la carta non era pronta O se era pronta ma non è stata giocata
      // (campo pieno, potere bloccato o senza bersagli),
      // passiamo alla carta successiva nella mano.
      indiceCarta++;

  } // Fine while mano
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
               // Qui andrebbero check Rappresaglia o simili, dopo il danno
          } else {
              const danno = attaccante.attaccoAttuale;
              passivo.eroe.hpAttuali -= danno;
              logRiga += ` -> EROE(${danno}d, ${passivo.eroe.hpAttuali}HP); `;
              attacchiLog += logRiga;

              if (passivo.eroe.hpAttuali <= 0) {
                  stato.gameOver = true;
                  stato.vincitore = attivo.id;
                  logEvento(stato, attacchiLog); // Log attacchi fino a questo punto
                  logEvento(stato, `!!! EROE G${passivo.id} SCONFITTO! G${attivo.id} VINCE !!!`);
                  return;
              }
          }
      }
  }
  if(attacchiLog) logEvento(stato, `- Attacchi: ${attacchiLog}`); // Log compatto se ci sono stati attacchi
}

function faseMorteEScorrimento(stato: StatoPartita) {
  stato.faseTurno = "Morte";
  // Processa entrambi i lati del campo
  for (const idGiocatoreProcessato of [1, 2]) {
      const campoDaProcessare = idGiocatoreProcessato === 1 ? stato.campoG1 : stato.campoG2;
      let reCheckNeeded = true;
      let logMorti = "";

      while (reCheckNeeded) {
           reCheckNeeded = false;
           for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
               const unita = campoDaProcessare[i];
               if (unita && unita.vitaAttuale <= 0) {
                   logMorti += `${unita.cartaDef.nome.substring(0,10)}@S${i}(G${idGiocatoreProcessato}) `;
                   // Attiva Effetto OnDeath (Placeholder)
                   // console.log(`   - Effetto OnDeath ${unita.cartaDef.nome} (TODO)`);
                   stato.giocatori.find(g => g.id === idGiocatoreProcessato)!.carteScartate.push(unita.cartaDef);
                   campoDaProcessare[i] = null; // Rimuovi

                   // Scorrimento
                   for (let j = i + 1; j < MAX_UNITA_CAMPO; j++) {
                       if (campoDaProcessare[j]) {
                           // console.log(`   - Scorrimento: ${campoDaProcessare[j]!.cartaDef.nome} da slot ${j} a ${j-1}`);
                           campoDaProcessare[j-1] = campoDaProcessare[j];
                           campoDaProcessare[j-1]!.slot = j - 1;
                           campoDaProcessare[j] = null;
                       }
                   }
                   reCheckNeeded = true; // Serve ricontrollare il campo da capo
                   break; // Esce dal for per ricominciare il while check
               }
           } // Fine for i
      } // Fine while reCheckNeeded
       if(logMorti) logEvento(stato, `- Morti: ${logMorti}`);
  } // Fine for idGiocatoreProcessato

  // Controllo Vittoria post-morte (effetti OnDeath potrebbero aver inflitto danno fatale)
   if (!stato.gameOver) { // Solo se non già finita per attacco diretto
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

  // Scarto carte in eccesso
  if (attivo.mano.length > MAX_CARTE_MANO) {
      logEvento(stato, `G${attivo.id}: Mano piena (${attivo.mano.length} > ${MAX_CARTE_MANO}), scarto carte...`);
      // Crea un array di indici e oggetti carta
      const manoConIndice = attivo.mano.map((carta, index) => ({ carta, index }));
      // Ordina per scartare: prima preparazione più alta, poi indice più alto (destra)
      manoConIndice.sort((a, b) => {
          if (b.carta.preparazioneAttuale !== a.carta.preparazioneAttuale) {
              return b.carta.preparazioneAttuale - a.carta.preparazioneAttuale;
          }
          return b.index - a.index; // Indice più alto (più a destra) viene prima
      });

      const numeroCarteDaScartare = attivo.mano.length - MAX_CARTE_MANO;
      const idDaScartare = new Set<number>(); // Tiene traccia degli ID istanza da scartare
      let logScarto = "";
      for (let i = 0; i < numeroCarteDaScartare; i++) {
          const { carta } = manoConIndice[i];
           logScarto += `${carta.cartaDef.nome.substring(0,10)}(P${carta.preparazioneAttuale}) `;
          attivo.carteScartate.push(carta.cartaDef);
          idDaScartare.add(carta.idIstanzaUnica);
      }
      if(logScarto) logEvento(stato, ` > Scarta: ${logScarto}`);
      // Filtra la mano rimuovendo gli ID selezionati
      attivo.mano = attivo.mano.filter(c => !idDaScartare.has(c.idIstanzaUnica));
  }
   // Reset dello stato 'Bloccato' dei poteri rimasti in mano, verranno rivalutati al prossimo turno
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
  const stato = JSON.parse(JSON.stringify(statoIniziale));

  while (!stato.gameOver && stato.turnoAttuale < MAX_TURNI) {
      stato.turnoAttuale++;

      faseInizioTurno(stato);
      fasePesca(stato);       if (stato.gameOver) break;
      fasePreparazione(stato);
      faseGiocoCarte(stato);
      faseAttacco(stato);      if (stato.gameOver) break;
      faseMorteEScorrimento(stato); if (stato.gameOver) break; // Morte può uccidere eroe
      faseFineTurno(stato);

      stato.idGiocatoreAttivo = stato.idGiocatoreAttivo === 1 ? 2 : 1; // Passa il turno
  }

  // Gestione Fine Partita per Limite Turni
  if (!stato.gameOver && stato.turnoAttuale >= MAX_TURNI) {
      stato.gameOver = true;
      logEvento(stato, `!!! Limite Turni (${MAX_TURNI}) Raggiunto!`);
      const hpG1 = stato.giocatori[0].eroe.hpAttuali;
      const hpG2 = stato.giocatori[1].eroe.hpAttuali;
      stato.vincitore = hpG1 > hpG2 ? 1 : (hpG2 > hpG1 ? 2 : null);
      logEvento(stato, `Vincitore per HP: G${stato.vincitore ?? 'Pareggio'}`);
  }

   logEvento(stato, `--- PARTITA TERMINATA --- ${stato.vincitore ? `VINCITORE: Giocatore ${stato.vincitore}` : 'PAREGGIO'}`);
  return stato;
}