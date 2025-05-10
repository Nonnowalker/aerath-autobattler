// src/simulation/types.ts

// --- Tipi Enum per Keyword (già corretti nel repo, li includo per completezza) ---
export type KeywordTrigger =
    | "SempreAttiva" | "InizioBattaglia" | "InizioTurnoGiocatore" | "FineTurnoGiocatore"
    | "QuandoGiocata" | "FaseAttacco" | "QuandoAttacca" | "QuandoDifende"
    | "QuandoSubisceDanno" | "QuandoInfliggeDannoCombattimento" | "QuandoMuore"
    | "QuandoUnAlleatoMuore" | "QuandoUnNemicoMuore" | "QuandoPescaCarta";

export type KeywordTarget =
    | "Nessuno" | "SéStesso" | "UnitàOpposta" | "EroeNemico" | "EroeAlleato"
    | "UnitàAlleataCasuale" | "UnitàNemicaCasuale" | "TutteUnitàAlleate" | "TutteUnitàNemiche"
    | "TutteUnità" | "UnitàAlleataPiùASinistra" | "UnitàNemicaPiùASinistra"
    | "UnitàNemicaConMenoHP" | "UnitàNemicaConPiuHP" | "CartaNellaManoCasuale";

// --- Definizione BASE di una Keyword (per la Libreria Centrale) ---
export interface LibreriaKeywordEntry {
    id: string;                       // ID univoco della keyword (es. "KW_MISCHIA_UNITA")
    nomeVisualizzato: string;         // Nome amichevole per UI (es. "Mischia", "Armatura")
    descrizioneBase: string;          // Descrizione generica, può usare placeholder come {VALORE}
    triggerBase: KeywordTrigger;      // Quando la logica di questa keyword viene tipicamente valutata
    targetBase: KeywordTarget;        // Il target di default o tipico per questa keyword
    // Flag per l'UI di creazione/editing e per la validazione
    richiedeValore?: boolean;
    richiedeTipoDanno?: boolean;
    richiedeValoreTarget?: boolean;
    richiedeDurata?: boolean;
    richiedeApplicaStatus?: boolean;
}

// --- Keyword APPLICATA a una Carta Specifica ---
export interface KeywordApplicata {
    keywordId: string;  // ID che fa riferimento a LibreriaKeywordEntry.id
    valore?: number;    // Valore specifico per questa istanza (es. il '2' in MISCHIA(2))
    tipoDanno?: string; // Tipo danno specifico, sovrascrive/specifica quello base
    valoreTarget?: any;   // Es. affiliazione, nome di un'altra keyword, ecc.
    durata?: number;
    applicaStatus?: string;
    // La descrizione effettiva per la UI sarà composta dalla descrizioneBase + valori specifici.
    // Trigger e Target base vengono dalla LibreriaKeywordEntry.
}

// --- Definizione Base Carta (come da DB/API) ---
export interface CartaDef {
  id: string;                         // ID stringa logico univoco (es: goblin_esploratore)
  nome: string;                       // Nome visualizzato della carta
  tipo: 'Unità' | 'Potere' | 'Equipaggiamento' | 'Pozione' | 'Scenario' | 'EroeBase';
  punteggioPreparazioneIniziale: number; // Per Unità, Poteri; 0 per Equip/Eroe/Scenario/Pozioni non in mano
  flavorText?: string;                 // Testo di contorno opzionale
  abilitaKeywords: KeywordApplicata[];   // Array delle sue keyword (riferimenti + valori specifici)
  affiliazioni?: string[];                // Es. ["Eroe", "Guardiano", "Abissale", "Umano"]
  // Campi specifici per tipo di carta:
  slotEquipaggiamento?: 'ArmaPrincipale' | 'ArmaSecondaria' | 'Armatura' | 'Elmo' | 'Amuleto'; // Per Equip
  comandoBase?: number; // Per EroeBase (usato per inizializzare la keyword COMANDO_BASE dell'eroe)
}

// --- Entità in gioco o in mano ---

export interface CartaInMano {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  preparazioneAttuale: number;
  statoPotere?: 'Bloccato'; // Usato se un potere è a 0 Prep ma non può essere lanciato
}

export interface EroeInGioco {
    idGiocatore: number;
    idDefEroe: string;         // ID della CartaDef tipo 'EroeBase' da cui deriva
    nomeEroe: string;
    livello: number;           // Livello attuale dell'eroe
    hpAttuali: number;         // Punti Ferita correnti
    hpMax: number;             // Punti Ferita massimi (calcolati da keyword PUNTI_FERITA_INIZIALI + bonus)
    comandoMax: number;        // Dimensione max mazzo (calcolata da comandoBase + bonus keyword)
    // Keyword dell'eroe (base + da equip), già "risolte" e pronte per essere usate dal motore.
    // "Risolte" significa che l'oggetto contiene sia le info dalla LibreriaKeywordEntry sia i valori specifici.
    keywordEffettive: (LibreriaKeywordEntry & KeywordApplicata)[];
    keywordTemporanee: (LibreriaKeywordEntry & KeywordApplicata)[]; // Buff/debuff attivi
    equipIndossato: {
        ArmaPrincipale?: CartaDef;
        ArmaSecondaria?: CartaDef;
        Armatura?: CartaDef;
        Elmo?: CartaDef;
        Amuleto?: CartaDef;
    };
    affiliazioniEffettive: string[]; // Combinazione di base + quelle da equip (da definire la logica di unione)
}

export interface UnitaInGioco {
  idIstanzaUnica: number;
  cartaDef: CartaDef;     // Da cui leggere abilitaKeywords (che sono KeywordApplicata[])
  idGiocatore: number;
  slot: number;           // Posizione 0-6 specifica del giocatore
  hpAttuali: number;      // Punti Ferita correnti (uguale a vitaAttuale precedente)
  hpMax: number;          // Punti Ferita massimi (dalla keyword PUNTI_FERITA_INIZIALI della sua CartaDef)
  // Keyword dell'unità (dalla sua CartaDef), già "risolte" e pronte per essere usate.
  keywordEffettive: (LibreriaKeywordEntry & KeywordApplicata)[];
  keywordTemporanee: (LibreriaKeywordEntry & KeywordApplicata)[]; // Buff/debuff attivi sull'unità
}

// --- Stato del Gioco ---

export interface StatoGiocatore {
  id: number;
  eroe: EroeInGioco;
  mano: CartaInMano[];
  mazzoRimanente: CartaDef[]; // Array di definizioni carta (non istanze)
  carteScartate: CartaDef[];  // Array di definizioni carta
  contatoreFatica: number;
  pozioneEquipaggiata?: CartaDef; // La CartaDef della pozione scelta
}

export interface StatoPartita {
  idPartita?: string; // Opzionale
  turnoAttuale: number;
  idGiocatoreAttivo: number;
  faseTurno: string; // Es: "InizioTurno", "Pesca", "Preparazione", "GiocoCarte", "Attacco", "Morte", "FineTurno"
  giocatori: [StatoGiocatore, StatoGiocatore];
  campoG1: (UnitaInGioco | null)[];
  campoG2: (UnitaInGioco | null)[];
  scenarioAttivo?: CartaDef; // La CartaDef dello scenario
  eventiLog: string[];
  gameOver: boolean;
  vincitore: number | null;
  prossimoIdIstanzaUnica: number; // Per idIstanzaUnica di CartaInMano -> UnitaInGioco
  primoTurnoP1Saltato: boolean;
}

export interface SimulationParams {
    mazzoDefG1: CartaDef[];    // Array di CartaDef (già filtrate per Unità/Potere)
    mazzoDefG2: CartaDef[];    // Array di CartaDef
    eroeBaseG1: CartaDef;    // La CartaDef tipo 'EroeBase' per G1
    livelloEroeG1: number;
    equipEroeG1?: CartaDef[]; // Array di CartaDef di tipo 'Equipaggiamento'

    eroeBaseG2: CartaDef;    // La CartaDef tipo 'EroeBase' per G2
    livelloEroeG2: number;
    equipEroeG2?: CartaDef[];

    pozioneG1?: CartaDef;   // CartaDef di tipo 'Pozione'
    pozioneG2?: CartaDef;
    scenario?: CartaDef;    // CartaDef di tipo 'Scenario'
}