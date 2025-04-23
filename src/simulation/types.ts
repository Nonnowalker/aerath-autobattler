// src/simulation/types.ts

export interface Carta {
    id: string;         // ID unico della carta
    nome: string;       // Nome visualizzato
    attacco: number;    // Danno base inflitto
    vita: number;       // Punti vita iniziali
    tempoSchieramento: number; // Tick necessari prima che possa essere schierata la prossima carta dopo questa
    velocitaAttacco: number;  // Tick tra un attacco e l'altro dell'unità
    // Aggiungeremo qui altre proprietà come abilità, tipo, ecc. in futuro
  }
  
  // Rappresenta una carta specifica sul campo di battaglia
  export interface UnitaInGioco {
    idIstanza: number;     // ID unico per questa specifica unità sul campo
    idGiocatore: number;   // ID del giocatore che la controlla (1 o 2)
    cartaOriginale: Carta; // Riferimento alla definizione base della carta
    vitaAttuale: number;   // Punti vita correnti
    tickProssimaAzione: number; // Tick in cui questa unità potrà agire di nuovo
  }
  
  // Rappresenta lo stato di un giocatore durante la simulazione
  export interface StatoGiocatore {
    id: number;
    hpBase: number;           // Punti vita della base/eroe
    mazzoRimanente: Carta[];  // Le carte ancora nel mazzo del giocatore
    tickProssimoDeploy: number; // Tick in cui il giocatore potrà schierare la prossima carta
  }
  
  // Stato globale della partita, aggiornato ad ogni tick
  export interface StatoPartita {
    tickAttuale: number;
    giocatori: [StatoGiocatore, StatoGiocatore]; // Array di due giocatori
    campoBattaglia: UnitaInGioco[]; // Tutte le unità attualmente in gioco
    log: string[];                 // Il log degli eventi della partita
    gameOver: boolean;
    vincitore: number | null;      // ID del giocatore vincitore (o null)
    prossimoIdIstanza: number;     // Contatore per generare ID unici per le UnitaInGioco
  }