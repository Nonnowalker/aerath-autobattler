// src/simulation/engine.ts
import { StatoPartita, Carta, StatoGiocatore, UnitaInGioco } from './types';

const HP_INIZIALI_BASE = 20;
const MAX_TICKS = 100; // Limite per evitare loop infiniti

export function simulaPartita(mazzoInputG1: Carta[], mazzoInputG2: Carta[]): StatoPartita {
  // Creiamo copie dei mazzi per non modificare gli originali
  const mazzoG1 = [...mazzoInputG1];
  const mazzoG2 = [...mazzoInputG2];

  // Inizializza lo stato della partita
  const statoIniziale: StatoPartita = {
    tickAttuale: 0,
    giocatori: [
      { id: 1, hpBase: HP_INIZIALI_BASE, mazzoRimanente: mazzoG1, tickProssimoDeploy: 1 },
      { id: 2, hpBase: HP_INIZIALI_BASE, mazzoRimanente: mazzoG2, tickProssimoDeploy: 1 },
    ],
    campoBattaglia: [],
    log: [`--- Partita Iniziata (HP Base: ${HP_INIZIALI_BASE}) ---`],
    gameOver: false,
    vincitore: null,
    prossimoIdIstanza: 1, // Contatore per ID unità
  };

  // Copia profonda dello stato per modificarlo durante la simulazione
  const stato: StatoPartita = JSON.parse(JSON.stringify(statoIniziale));

  // ----- CICLO PRINCIPALE DELLA SIMULAZIONE -----
  while (!stato.gameOver && stato.tickAttuale < MAX_TICKS) {
    stato.tickAttuale++;
    stato.log.push(`\n--- TICK ${stato.tickAttuale} ---`);

    const nuoveUnitaSchierate: UnitaInGioco[] = []; // Tieni traccia delle unità appena entrate

    // 1. FASE SCHIERAMENTO (Deployment)
    for (const giocatore of stato.giocatori) {
      if (stato.tickAttuale >= giocatore.tickProssimoDeploy && giocatore.mazzoRimanente.length > 0) {
        const cartaDaSchierare = giocatore.mazzoRimanente.shift(); // Prende e rimuove la prima carta

        if (cartaDaSchierare) {
          const nuovaUnita: UnitaInGioco = {
            idIstanza: stato.prossimoIdIstanza++,
            idGiocatore: giocatore.id,
            cartaOriginale: cartaDaSchierare,
            vitaAttuale: cartaDaSchierare.vita,
            // L'unità può agire dal tick successivo allo schieramento
            tickProssimaAzione: stato.tickAttuale + 1,
          };
          stato.campoBattaglia.push(nuovaUnita);
          nuoveUnitaSchierate.push(nuovaUnita); // Aggiungi alla lista temporanea

          // Imposta quando il giocatore potrà schierare la prossima carta
          giocatore.tickProssimoDeploy = stato.tickAttuale + cartaDaSchierare.tempoSchieramento;

          stato.log.push(`G${giocatore.id}: Schiera ${cartaDaSchierare.nome} (ID: ${nuovaUnita.idIstanza})`);
        }
      }
    }

    // 2. FASE AZIONI (Attacchi) - Molto Semplificata
    const attaccantiOrdinati = [...stato.campoBattaglia].sort((a,b) => a.idIstanza - b.idIstanza); // Ordine consistente
    const unitaDistrutteInQuestoTick: number[] = []; // ID Istanze

    for (const unita of attaccantiOrdinati) {
        // Salta se unità appena schierata o morta o in cooldown
        if (unita.vitaAttuale <= 0 ||
            nuoveUnitaSchierate.some(u => u.idIstanza === unita.idIstanza) ||
            stato.tickAttuale < unita.tickProssimaAzione) {
            continue;
        }

        const idAvversario = unita.idGiocatore === 1 ? 2 : 1;
        const giocatoreAvversario = stato.giocatori.find(g => g.id === idAvversario)!;

        // Trova un bersaglio: prima unità nemica sul campo, altrimenti la base
        let targetUnita: UnitaInGioco | undefined = stato.campoBattaglia.find(
            u => u.idGiocatore === idAvversario && u.vitaAttuale > 0
        );

        if (targetUnita) {
            // Attacca l'unità nemica
            const danno = unita.cartaOriginale.attacco;
            targetUnita.vitaAttuale -= danno;
            stato.log.push(`G${unita.idGiocatore}: ${unita.cartaOriginale.nome} (ID:${unita.idIstanza}, HP:${unita.vitaAttuale}) attacca ${targetUnita.cartaOriginale.nome} (ID:${targetUnita.idIstanza}, HP:${targetUnita.vitaAttuale + danno}) per ${danno} danni. HP rimanenti: ${targetUnita.vitaAttuale}`);

            if (targetUnita.vitaAttuale <= 0) {
                stato.log.push(`>> ${targetUnita.cartaOriginale.nome} (ID:${targetUnita.idIstanza}) è distrutta!`);
                unitaDistrutteInQuestoTick.push(targetUnita.idIstanza);
            }
        } else {
            // Attacca la base nemica
            const danno = unita.cartaOriginale.attacco;
            giocatoreAvversario.hpBase -= danno;
            stato.log.push(`G${unita.idGiocatore}: ${unita.cartaOriginale.nome} (ID:${unita.idIstanza}) attacca la Base G${idAvversario} per ${danno} danni. HP Base rimanenti: ${giocatoreAvversario.hpBase}`);
        }

        // Imposta il cooldown per il prossimo attacco
        unita.tickProssimaAzione = stato.tickAttuale + unita.cartaOriginale.velocitaAttacco;

        // Controlla vittoria IMMEDIATAMENTE dopo danno alla base
        if (giocatoreAvversario.hpBase <= 0) {
            stato.gameOver = true;
            stato.vincitore = unita.idGiocatore;
            stato.log.push(`!!! G${unita.idGiocatore} VINCE DISTRUGGENDO LA BASE NEMICA !!!`);
            break; // Esce dal ciclo degli attaccanti
        }
    }
     if (stato.gameOver) break; // Esce dal ciclo principale dei tick se la partita è finita


    // 3. FASE PULIZIA (Rimozione Morti)
    // Rimuoviamo le unità morte dal campoBattaglia alla FINE del tick
     const campoBattagliaVivo = stato.campoBattaglia.filter(
       u => u.vitaAttuale > 0 && !unitaDistrutteInQuestoTick.includes(u.idIstanza)
     );
     stato.campoBattaglia = campoBattagliaVivo;


    // 4. CONTROLLO FINE PARTITA (Se non già avvenuta per danno base)
    // A) Esaurimento Mazzi e Campo Vuoto (Pareggio?)
    if (stato.giocatori.every(g => g.mazzoRimanente.length === 0) && stato.campoBattaglia.length === 0) {
        stato.log.push("--- PAREGGIO? Entrambi i mazzi esauriti e campo vuoto ---");
        stato.gameOver = true;
        stato.vincitore = null; // O un ID speciale per pareggio
        break;
    }
    // B) Limite Tick raggiunto
    if (stato.tickAttuale >= MAX_TICKS) {
      stato.log.push(`--- FINE PARTITA: Limite di ${MAX_TICKS} tick raggiunto ---`);
      stato.gameOver = true;
      // Determina vincitore in base a HP base o altre regole
      if (stato.giocatori[0].hpBase > stato.giocatori[1].hpBase) {
        stato.vincitore = 1;
      } else if (stato.giocatori[1].hpBase > stato.giocatori[0].hpBase) {
        stato.vincitore = 2;
      } else {
        stato.vincitore = null; // Pareggio
      }
      stato.log.push(`Vincitore ai punti: G${stato.vincitore ?? 'Pareggio'}`);
    }
  } // Fine while(!gameOver)

  console.log("Simulazione terminata.", stato); // Debug nel browser console
  return stato;
}