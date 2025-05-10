// src/simulation/types.ts

// --- Tipi Enum per Keyword ---

export type KeywordTrigger =
    | "SempreAttiva"         // Es. Armatura, Volare, PuntiFerita (passive costanti)
    | "InizioBattaglia"      // Effetti globali o dell'eroe all'inizio
    | "InizioTurnoGiocatore" // Es. Rigenerazione, effetti di mantenimento
    | "FineTurnoGiocatore"   // Es. Danno da Veleno, scadenza buff
    | "QuandoGiocata"        // Effetti all'entrata in gioco (Unità/Potere/Pozione)
    | "FaseAttacco"          // Per le azioni offensive standard (Mischia, Lampo)
    | "QuandoAttacca"        // Trigger specifico se l'unità dichiara un attacco
    | "QuandoDifende"        // Trigger specifico quando si viene scelti come bersaglio di un attacco
    | "QuandoSubisceDanno"   // Es. Rappresaglia
    | "QuandoInfliggeDannoCombattimento" // Se l'attacco (da keyword FaseAttacco) va a segno
    | "QuandoMuore"          // On Death
    | "QuandoUnAlleatoMuore"
    | "QuandoUnNemicoMuore"
    | "QuandoPescaCarta";
    // Aggiungere altri trigger specifici man mano che servono

export type KeywordTarget =
    | "Nessuno"                  // Per keyword come Armatura su sé stesso, o trigger senza target esplicito
    | "SéStesso"
    | "UnitàOpposta"             // Nello slot di fronte (per Unità)
    | "EroeNemico"
    | "EroeAlleato"
    | "UnitàAlleataCasuale"
    | "UnitàNemicaCasuale"
    | "TutteUnitàAlleate"        // Sul campo del possessore della keyword
    | "TutteUnitàNemiche"        // Sul campo avversario
    | "TutteUnità"               // Tutte le unità sul campo di entrambi i giocatori
    | "UnitàAlleataPiùASinistra"
    | "UnitàNemicaPiùASinistra"  // Usato dall'Eroe per Mischia
    | "UnitàNemicaConMenoHP"
    | "UnitàNemicaConPiuHP"
    | "CartaNellaManoCasuale"    // Per effetti sulla mano
    // Aggiungere altri target specifici man mano che servono

// --- Definizione Strutturata Keyword ---
export interface KeywordDefinition {
    nome: string;                 // Nome univoco e programmatico della keyword (es. "MISCHIA", "ARMATURA")
    valore?: number;              // Valore numerico associato (es. danno, cura, riduzione, % )
    tipoDanno?: string;           // Es. "Fisico", "Elettrico", "Veleno", "Ghiaccio", "Fuoco", "Puro"
    trigger?: KeywordTrigger;     // Quando si attiva questa keyword (Opzionale: default a "SempreAttiva" o "FaseAttacco"?)
    target?: KeywordTarget;       // A chi si applica l'effetto (Opzionale: default a "SéStesso" per passive?)
    valoreTarget?: any;           // Campo variabile, il cui significato dipende da 'target' o 'nome'
                                  // Es: se target è "UnitàConAffiliazione", valoreTarget potrebbe essere "Celestiale"
                                  // Es: se nome è "APPLICA_STATUS", valoreTarget potrebbe essere "Avvelenato"
    durata?: number;              // Per effetti temporanei (in numero di turni del giocatore bersaglio/proprietario)
    applicaStatus?: string;       // Es. "Avvelenato", "Stordito", "Silenzio", "Barriera"
    condizioniAggiuntive?: string; // Per logica condizionale complessa (es. "SoloSeNemicoHaMenoDi5HP") - Parsing complesso, da valutare
    descrizione?: string;         // Descrizione leggibile per UI/tooltip (molto importante)
}

// --- Definizione Base Carta (come da DB/API) ---
export interface CartaDef {
  id: string;         // ID stringa logico univoco (es: goblin_esploratore)
  nome: string;       // Nome visualizzato della carta
  tipo: 'Unità' | 'Potere' | 'Equipaggiamento' | 'Pozione' | 'Scenario';
  punteggioPreparazioneIniziale: number; // Per Unità, Poteri, forse Pozioni se in mano
  descrizioneAbilita?: string;         // Testo "flavor" generale della carta o descrizione principale
  abilitaKeywords: KeywordDefinition[];   // Array delle sue keyword strutturate
  affiliazioni?: string[];                // Es. ["Eroe", "Guardiano", "Abissale", "Umano"]
  // Campi specifici per tipo di carta:
  slotEquipaggiamento?: 'ArmaPrincipale' | 'ArmaSecondaria' | 'Armatura' | 'Elmo' | 'Amuleto'; // Per Equip
  // `attacco` e `vita` rimossi, ora gestiti da keyword (es. PUNTI_FERITA, MISCHIA)
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
    hpAttuali: number;
    hpMax: number; // Derivato dalla somma di keyword PUNTI_FERITA (base + equip)
    keywordBaseEroe: KeywordDefinition[]; // Keyword intrinseche dell'eroe (dal suo livello/definizione)
    keywordDaEquip: KeywordDefinition[];  // Keyword aggiunte dagli equipaggiamenti indossati
    keywordTemporanee: KeywordDefinition[]; // Buff/debuff attivi sull'eroe con durata
    // Futuro: equipaggiamentoIndossato (oggetti CartaDef)
}

export interface UnitaInGioco {
  idIstanzaUnica: number;
  cartaDef: CartaDef;     // Da cui leggere abilitaKeywords base
  idGiocatore: number;
  slot: number;           // Posizione 0-6 specifica del giocatore
  vitaAttuale: number;    // Gestita e modificata in gioco
  // L'attacco effettivo e gli HP max sono derivati dalle keyword
  keywordTemporanee: KeywordDefinition[]; // Buff/debuff attivi sull'unità con durata
}

// --- Stato del Gioco ---

export interface StatoGiocatore {
  id: number;
  eroe: EroeInGioco;
  mano: CartaInMano[];
  mazzoRimanente: CartaDef[];
  carteScartate: CartaDef[]; // Cimitero
  contatoreFatica: number;
  // Pozioni attive per questa battaglia (se ce ne sono)
  pozioneAttiva?: CartaDef; // Riferimento alla CartaDef della pozione equipaggiata
}

export interface StatoPartita {
  idPartita?: string;
  turnoAttuale: number;
  idGiocatoreAttivo: number;
  faseTurno: string; // Es: "InizioTurno", "Pesca", "Preparazione", "GiocoCarte", "Attacco", "Morte", "FineTurno"
  giocatori: [StatoGiocatore, StatoGiocatore];
  campoG1: (UnitaInGioco | null)[];
  campoG2: (UnitaInGioco | null)[];
  scenarioAttivo?: CartaDef; // Riferimento alla CartaDef dello scenario
  eventiLog: string[];
  gameOver: boolean;
  vincitore: number | null;
  prossimoIdIstanzaUnica: number;
  primoTurnoP1Saltato: boolean;
}

export interface SimulationParams {
    mazzoDefG1: CartaDef[];
    mazzoDefG2: CartaDef[];
    eroeDefG1?: CartaDef; // Definizione base dell'eroe G1 (con le sue keywordBaseEroe)
    eroeDefG2?: CartaDef; // Definizione base dell'eroe G2
    equipG1?: CartaDef[]; // Array di equipaggiamenti per G1
    equipG2?: CartaDef[]; // Array di equipaggiamenti per G2
    pozioneG1?: CartaDef; // Pozione scelta da G1
    pozioneG2?: CartaDef; // Pozione scelta da G2
    scenario?: CartaDef;  // Scenario della battaglia
    hpInizialiEroeOverride?: number; // Per sovrascrivere HP se non usi keyword PUNTI_FERITA
}