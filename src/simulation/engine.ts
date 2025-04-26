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
const MAX_TURNI = 100; // Previene loop infiniti

// --- Funzioni Helper ---

// Funzione Shuffle (Fisher-Yates) - serve per i mazzi iniziali
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Funzione per ottenere lo stato del giocatore attivo/non attivo
function getGiocatori(stato: StatoPartita): { attivo: StatoGiocatore, passivo: StatoGiocatore } {
  const attivo = stato.giocatori.find(g => g.id === stato.idGiocatoreAttivo)!;
  const passivo = stato.giocatori.find(g => g.id !== stato.idGiocatoreAttivo)!;
  return { attivo, passivo };
}

// Funzione per ottenere i campi di battaglia attivo/passivo
function getCampi(stato: StatoPartita): { campoAttivo: (UnitaInGioco | null)[], campoPassivo: (UnitaInGioco | null)[] } {
   const campoAttivo = stato.idGiocatoreAttivo === 1 ? stato.campoG1 : stato.campoG2;
   const campoPassivo = stato.idGiocatoreAttivo === 1 ? stato.campoG2 : stato.campoG1;
   return { campoAttivo, campoPassivo };
}

// Funzione per aggiungere log
function logEvento(stato: StatoPartita, messaggio: string) {
  console.log(messaggio); // Log anche in console per debug
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
      // Non si pesca nulla
  } else {
      // Pesca una carta
      const cartaPescataDef = attivo.mazzoRimanente.shift()!;
      const nuovaCartaInMano: CartaInMano = {
          idIstanzaUnica: stato.prossimoIdIstanzaUnica++,
          cartaDef: cartaPescataDef,
          preparazioneAttuale: cartaPescataDef.punteggioPreparazioneIniziale,
          // statoPotere si imposta se serve
      };
      attivo.mano.push(nuovaCartaInMano);
      logEvento(stato, `G${attivo.id}: Pesca ${cartaPescataDef.nome} (Prep: ${nuovaCartaInMano.preparazioneAttuale})`);
  }
}

function fasePreparazione(stato: StatoPartita) {
  stato.faseTurno = "Preparazione";
  const { attivo } = getGiocatori(stato);
  logEvento(stato, `G${attivo.id}: Fase Preparazione.`);
  for (const carta of attivo.mano) {
      if (carta.preparazioneAttuale > 0) {
          carta.preparazioneAttuale--;
          // Reset stato potere bloccato se prep > 0
          if (carta.statoPotere === 'Bloccato') {
               delete carta.statoPotere;
          }
      }
       // Log dettaglio preparazione (può diventare verbose)
       // logEvento(stato, `- ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica}) -> Prep: ${carta.preparazioneAttuale}`);
  }
}

function faseGiocoCarte(stato: StatoPartita) {
  stato.faseTurno = "GiocoCarte";
  const { attivo } = getGiocatori(stato);
  const { campoAttivo } = getCampi(stato);
  logEvento(stato, `G${attivo.id}: Fase Gioco Carte.`);

  let indiceCarta = 0;
  while (indiceCarta < attivo.mano.length) {
      const carta = attivo.mano[indiceCarta];

      if (carta.preparazioneAttuale === 0) {
          logEvento(stato, `- Tentativo gioco: ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica})`);
          let cartaGiocata = false;

          if (carta.cartaDef.tipo === 'Unita') {
              const slotLibero = campoAttivo.findIndex(slot => slot === null); // Trova primo slot null da sinistra
              if (slotLibero !== -1 && slotLibero < MAX_UNITA_CAMPO) {
                  const nuovaUnita: UnitaInGioco = {
                      idIstanzaUnica: carta.idIstanzaUnica,
                      cartaDef: carta.cartaDef,
                      idGiocatore: attivo.id,
                      slot: slotLibero,
                      vitaAttuale: carta.cartaDef.vita!, // Assumi vita sia definita per unità
                      attaccoAttuale: carta.cartaDef.attacco!, // Assumi attacco sia definito
                  };
                  campoAttivo[slotLibero] = nuovaUnita; // Piazza nello slot
                  attivo.mano.splice(indiceCarta, 1); // Rimuove dalla mano
                  logEvento(stato, `  > G${attivo.id}: Schiera ${nuovaUnita.cartaDef.nome} (ID: ${nuovaUnita.idIstanzaUnica}) nello slot ${slotLibero}`);
                  cartaGiocata = true;
              } else {
                  logEvento(stato, `  > Fallito: Campo pieno per ${carta.cartaDef.nome}`);
                  // Lascia la carta in mano, incrementa indice
                  indiceCarta++;
              }
          } else if (carta.cartaDef.tipo === 'Potere') {
              // --- Logica Placeholder per Poteri ---
              // 1. Verifica Bersagli (implementazione base)
              const bersaglioValidoTrovato = true; // TODO: Implementa logica reale qui
              // Esempio: const bersaglioValidoTrovato = getCampi(stato).campoPassivo.some(u => u !== null);

              if (bersaglioValidoTrovato) {
                  logEvento(stato, `  > G${attivo.id}: Lancia ${carta.cartaDef.nome} (ID: ${carta.idIstanzaUnica})`);
                  // 2. Applica Effetto (placeholder)
                  logEvento(stato, `    - Effetto Placeholder applicato! (Es: ${carta.cartaDef.descrizioneAbilita})`);
                  // Esempio effetto: getGiocatori(stato).passivo.eroe.hpAttuali -= 3;
                  // 3. Rimuovi dalla mano
                  attivo.mano.splice(indiceCarta, 1);
                  cartaGiocata = true;
                  // Potrebbe andare negli scartati: attivo.carteScartate.push(carta.cartaDef);
              } else {
                  logEvento(stato, `  > Fallito: Nessun bersaglio valido per ${carta.cartaDef.nome}`);
                  carta.statoPotere = 'Bloccato'; // Marca come bloccato
                   // Lascia la carta in mano, incrementa indice
                  indiceCarta++;
              }
              // --- Fine Logica Placeholder Poteri ---
          }

          // Se la carta è stata giocata, NON incrementiamo l'indice,
          // perché l'array `mano` si è accorciato e il prossimo elemento
          // da controllare è ora all'indice corrente `indiceCarta`.
          // Se non è stata giocata (campo pieno, potere bloccato), incrementiamo.
          if (!cartaGiocata) {
             // indiceCarta++; // Lo incrementiamo sopra ora se la carta non viene giocata
          }

      } else {
          // Carta non pronta, passa alla successiva
          indiceCarta++;
      }
  } // Fine while mano
}

function faseAttacco(stato: StatoPartita) {
  stato.faseTurno = "Attacco";
  const { attivo, passivo } = getGiocatori(stato);
  const { campoAttivo, campoPassivo } = getCampi(stato);
  logEvento(stato, `G${attivo.id}: Fase Attacco.`);

  for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
      const attaccante = campoAttivo[i];
      if (attaccante && attaccante.vitaAttuale > 0) { // Assicurati che l'attaccante sia vivo
          const bersaglioUnita = campoPassivo[i];

          if (bersaglioUnita && bersaglioUnita.vitaAttuale > 0) {
              // Attacca unità opposta
              const danno = attaccante.attaccoAttuale;
               // Abilità pre-danno tipo "Divine Shield" potrebbero negare danno qui
              bersaglioUnita.vitaAttuale -= danno;
               // Abilità post-danno tipo "Rappresaglia" potrebbero attivarsi qui
              logEvento(stato, `> Slot ${i}: ${attaccante.cartaDef.nome}(G${attaccante.idGiocatore}) attacca ${bersaglioUnita.cartaDef.nome}(G${bersaglioUnita.idGiocatore}) per ${danno}. HP rim: ${bersaglioUnita.vitaAttuale}`);
          } else {
              // Attacca Eroe avversario
              const danno = attaccante.attaccoAttuale;
              passivo.eroe.hpAttuali -= danno;
              logEvento(stato, `> Slot ${i}: ${attaccante.cartaDef.nome}(G${attaccante.idGiocatore}) attacca Eroe G${passivo.id} per ${danno}. HP Eroe rim: ${passivo.eroe.hpAttuali}`);

              // Controlla VITTORIA subito dopo attacco a eroe
              if (passivo.eroe.hpAttuali <= 0) {
                  stato.gameOver = true;
                  stato.vincitore = attivo.id;
                  logEvento(stato, `!!! EROE G${passivo.id} SCONFITTO! G${attivo.id} VINCE !!!`);
                  return; // Esce subito dalla fase (e dal ciclo principale poi)
              }
          }
          // Aggiungere qui logica per attacchi multipli se esistono abilità ("Windfury")
      }
  }
}

function faseMorteEScorrimento(stato: StatoPartita) {
  stato.faseTurno = "Morte";
  logEvento(stato, `Sistema: Fase Morte e Scorrimento.`);

  // Processa prima G1 poi G2 per coerenza
  for (const idGiocatoreProcessato of [1, 2]) {
      const campoDaProcessare = idGiocatoreProcessato === 1 ? stato.campoG1 : stato.campoG2;
      let campoModificato = false; // Flag per sapere se serve riprocessare questo lato

      // Continua a controllare finché non ci sono più morti + scorrimenti su questo lato
      // Usiamo un while per gestire morti a catena/scorrimenti multipli nello stesso "macro-step"
      let reCheckNeeded = true;
      while (reCheckNeeded) {
           reCheckNeeded = false; // Assume non serva ricontrollare
           for (let i = 0; i < MAX_UNITA_CAMPO; i++) {
               const unita = campoDaProcessare[i];
               if (unita && unita.vitaAttuale <= 0) {
                   logEvento(stato, `-> Unità Morta: ${unita.cartaDef.nome} (ID: ${unita.idIstanzaUnica}) di G${idGiocatoreProcessato} in slot ${i}`);
                   // --- Attiva Effetto OnDeath (placeholder) ---
                   logEvento(stato, `   - Effetto OnDeath (Placeholder)`);
                   // Aggiungi carta morta al cimitero
                   stato.giocatori.find(g => g.id === idGiocatoreProcessato)!.carteScartate.push(unita.cartaDef);

                   // --- Rimuovi dal campo ---
                   campoDaProcessare[i] = null;

                   // --- SCORRIMENTO ---
                   for (let j = i + 1; j < MAX_UNITA_CAMPO; j++) {
                       if (campoDaProcessare[j]) {
                           logEvento(stato, `   - Scorrimento: ${campoDaProcessare[j]!.cartaDef.nome} da slot ${j} a ${j-1}`);
                           campoDaProcessare[j-1] = campoDaProcessare[j]; // Sposta a sinistra
                           campoDaProcessare[j-1]!.slot = j - 1; // Aggiorna slot interno unità
                           campoDaProcessare[j] = null; // Svuota slot originale
                       }
                   }
                   // Siccome abbiamo modificato l'array, è più sicuro ricontrollare dall'inizio
                   reCheckNeeded = true;
                   break; // Esce dal for interno per ricominciare il while check
               }
           } // Fine for slot i
      } // Fine while reCheckNeeded
  } // Fine for idGiocatoreProcessato

   // Controlla di nuovo vittoria in caso di effetti onDeath che danneggiano eroe
   if (stato.giocatori[0].eroe.hpAttuali <= 0) {
      stato.gameOver = true;
      stato.vincitore = 2;
       logEvento(stato, `!!! EROE G1 SCONFITTO (post-morte)! G2 VINCE !!!`);
   } else if (stato.giocatori[1].eroe.hpAttuali <= 0) {
       stato.gameOver = true;
       stato.vincitore = 1;
       logEvento(stato, `!!! EROE G2 SCONFITTO (post-morte)! G1 VINCE !!!`);
   }
}


function faseFineTurno(stato: StatoPartita) {
  stato.faseTurno = "FineTurno";
  const { attivo } = getGiocatori(stato);

  // Scarto carte in eccesso
  if (attivo.mano.length > MAX_CARTE_MANO) {
      logEvento(stato, `G${attivo.id}: Mano piena (${attivo.mano.length} > ${MAX_CARTE_MANO}). Scarto carte...`);
      // Ordina le carte da scartare: prima per preparazione (decrescente), poi per posizione (decrescente -> più a destra)
      const carteDaScartareOrdinate = [...attivo.mano].sort((a, b) => {
          if (b.preparazioneAttuale !== a.preparazioneAttuale) {
              return b.preparazioneAttuale - a.preparazioneAttuale; // Più alta prep prima
          }
          // A parità di preparazione, l'indice originale non è più affidabile.
          // Dobbiamo trovare l'indice *attuale* nella mano. Assumiamo per semplicità che la destra corrisponda a indice più alto.
          // Potrebbe essere necessario un meccanismo più robusto se l'ordine della mano cambia molto.
           return attivo.mano.indexOf(b) - attivo.mano.indexOf(a); // Indice più alto (destra) prima
      });

      const numeroCarteDaScartare = attivo.mano.length - MAX_CARTE_MANO;
      for (let i = 0; i < numeroCarteDaScartare; i++) {
          const cartaDaScartare = carteDaScartareOrdinate[i];
          logEvento(stato, ` > Scarta: ${cartaDaScartare.cartaDef.nome} (Prep: ${cartaDaScartare.preparazioneAttuale}, ID: ${cartaDaScartare.idIstanzaUnica})`);
          attivo.carteScartate.push(cartaDaScartare.cartaDef); // Aggiungi al cimitero
          // Rimuovi dalla mano effettiva
          attivo.mano = attivo.mano.filter(c => c.idIstanzaUnica !== cartaDaScartare.idIstanzaUnica);
      }
  }
  logEvento(stato, `Fine Turno G${attivo.id}.`);
}

// --- Funzione Principale di Simulazione ---
export function avviaSimulazioneCompleta(params: SimulationParams): StatoPartita {
  const { mazzoDefG1, mazzoDefG2, hpInizialiEroe = HP_EROE_DEFAULT } = params;

  // 1. Inizializzazione Stato Partita
  const statoIniziale: StatoPartita = {
      turnoAttuale: 0, // Inizia dal turno 0 o 1? Partiamo da 0, il primo "vero" turno sarà l'1
      idGiocatoreAttivo: Math.random() < 0.5 ? 1 : 2, // Determina casualmente chi inizia
      faseTurno: "InizioPartita",
      giocatori: [
          // Giocatore 1
          {
              id: 1,
              eroe: { idGiocatore: 1, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe },
              mano: [],
              mazzoRimanente: shuffleArray([...mazzoDefG1]),
              carteScartate: [],
              contatoreFatica: 0,
          },
          // Giocatore 2
          {
              id: 2,
              eroe: { idGiocatore: 2, hpAttuali: hpInizialiEroe, hpMax: hpInizialiEroe },
              mano: [],
              mazzoRimanente: shuffleArray([...mazzoDefG2]),
              carteScartate: [],
              contatoreFatica: 0,
          }
      ],
      campoG1: Array(MAX_UNITA_CAMPO).fill(null),
      campoG2: Array(MAX_UNITA_CAMPO).fill(null),
      eventiLog: [`--- Partita Iniziata (HP Eroi: ${hpInizialiEroe}) ---`],
      gameOver: false,
      vincitore: null,
      prossimoIdIstanzaUnica: 1,
      primoTurnoP1Saltato: false, // G1 deve saltare la prima pesca
  };

  logEvento(statoIniziale, `Giocatore ${statoIniziale.idGiocatoreAttivo} inizia il gioco.`);

  // Clona lo stato iniziale per la simulazione
  const stato = JSON.parse(JSON.stringify(statoIniziale));

  // Aggiungere qui logica per "Effetti Inizio Battaglia" di Eroi/Equip futuri

  // 2. Ciclo Principale dei Turni
  while (!stato.gameOver && stato.turnoAttuale < MAX_TURNI) {
      stato.turnoAttuale++; // Incrementa il numero del turno

      // --- Inizio Turno Attivo ---
      faseInizioTurno(stato);
      fasePesca(stato);
      if (stato.gameOver) break; // La fatica può uccidere

      fasePreparazione(stato);
      faseGiocoCarte(stato); // Può giocare unità/poteri

      // Prima gli attacchi, poi la gestione delle morti
      faseAttacco(stato);
       if (stato.gameOver) break; // Gli attacchi possono uccidere

      faseMorteEScorrimento(stato);
      if (stato.gameOver) break; // Effetti OnDeath potrebbero uccidere

      faseFineTurno(stato);
      // Il controllo vittoria generale è implicito negli step precedenti
      // (danno eroe o fine per limite turni gestito nel while)

      // Passaggio al prossimo giocatore
      stato.idGiocatoreAttivo = stato.idGiocatoreAttivo === 1 ? 2 : 1;

  } // Fine ciclo While

  // Controllo finale se il loop è finito per MAX_TURNI
  if (!stato.gameOver && stato.turnoAttuale >= MAX_TURNI) {
      stato.gameOver = true;
      logEvento(stato, `!!! Limite Turni (${MAX_TURNI}) Raggiunto!`);
      // Determina vincitore per HP Eroe o altra regola
      const hpG1 = stato.giocatori[0].eroe.hpAttuali;
      const hpG2 = stato.giocatori[1].eroe.hpAttuali;
      if (hpG1 > hpG2) stato.vincitore = 1;
      else if (hpG2 > hpG1) stato.vincitore = 2;
      else stato.vincitore = null; // Pareggio
       logEvento(stato, `Vincitore per HP ai punti: G${stato.vincitore ?? 'Pareggio'}`);
  }

   logEvento(stato, `--- PARTITA TERMINATA --- Vincitore: ${stato.vincitore ? `Giocatore ${stato.vincitore}`: 'Pareggio'}`);
  return stato;
}


// Esporta la funzione principale per poterla usare da App.tsx
// NOTA: Assicurati che l'import in App.tsx ora usi:
// import { avviaSimulazioneCompleta } from '../simulation/engine.js';
// e passi l'oggetto params { mazzoDefG1, mazzoDefG2 }