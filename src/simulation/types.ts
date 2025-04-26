// src/simulation/types.ts

// Definizione Base (come da DB/API, non la cambiamo ora)
export interface CartaDef {
  id: string;
  nome: string;
  tipo: 'Unita' | 'Potere';
  attacco?: number;
  vita?: number;
  punteggioPreparazioneIniziale: number;
  descrizioneAbilita?: string;
}

// Istanza di Carta in Mano
export interface CartaInMano {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  preparazioneAttuale: number;
  // 'Bloccato' usato se un potere è a 0 ma non può essere lanciato
  statoPotere?: 'Pronto' | 'Bloccato';
}

// Istanza di Unità sul Campo
export interface UnitaInGioco {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  idGiocatore: number;
  slot: number; // Posizione 0-6 specifica del giocatore
  vitaAttuale: number;
  attaccoAttuale: number; // Base, modificabile in futuro
  // Futuro: puoAttaccareQuestoTurno, effettiStatus[]
}

// Eroe in Gioco
export interface EroeInGioco {
    idGiocatore: number;
    hpAttuali: number;
    hpMax: number;
    // Futuro: equipaggiamenti, abilitaPassiva
}

// Stato di un Giocatore
export interface StatoGiocatore {
  id: number; // 1 o 2
  eroe: EroeInGioco;
  mano: CartaInMano[]; // Max 7 a fine turno
  mazzoRimanente: CartaDef[];
  carteScartate: CartaDef[]; // Cimitero
  contatoreFatica: number;
}

// Stato Globale della Partita
export interface StatoPartita {
  // Identificativi partita (opzionale)
  idPartita?: string;
  // Stato attuale
  turnoAttuale: number; // Numero del turno (1, 2, ...)
  idGiocatoreAttivo: number; // 1 o 2
  faseTurno: string; // Es: "InizioTurno", "Pesca", "Preparazione", "Gioco", "Attacco", "Morte", "FineTurno"
  // Componenti gioco
  giocatori: [StatoGiocatore, StatoGiocatore];
  // Campo battaglia: Array[7] per ogni giocatore (null se slot vuoto)
  campoG1: (UnitaInGioco | null)[];
  campoG2: (UnitaInGioco | null)[];
  // Log e stato finale
  eventiLog: string[];
  gameOver: boolean;
  vincitore: number | null; // ID del vincitore o null
  // Contatori e flag interni
  prossimoIdIstanzaUnica: number; // Per carte in mano -> unità in gioco
  primoTurnoP1Saltato: boolean;   // Flag per gestire regola prima pesca G1
}

// Tipo Helper per i parametri iniziali della simulazione
export interface SimulationParams {
    mazzoDefG1: CartaDef[]; // Le definizioni carta per il mazzo G1
    mazzoDefG2: CartaDef[]; // Le definizioni carta per il mazzo G2
    hpInizialiEroe?: number; // Opzionale, default a 40
}