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
  id: string;
  nome: string;
  tipo: 'Unità' | 'Potere' | 'Equipaggiamento' | 'Pozione' | 'Scenario' | 'EroeBase'; // Aggiunto EroeBase
  punteggioPreparazioneIniziale: number; // 0 per EroeBase, Equip, Scenario, Pozione (se non in mano)
  abilitaKeywords: KeywordDefinition[];
  affiliazioni?: string[]; // ["Eroe", "Ruolo", "Etnia", "Razza"] o ["Campione", "Ruolo", "Etnia", "Razza"] o ["Ruolo", "Etnia", "Razza"]
  slotEquipaggiamento?: 'ArmaPrincipale' | 'ArmaSecondaria' | 'Armatura' | 'Elmo' | 'Amuleto';
  // Campi specifici per EroeBase (se non gestiti solo da keyword)
  hpBaseLivello1?: number;      // HP dell'eroe al livello 1
  comandoBaseLivello1?: number; // Comando dell'eroe al livello 1
  // progressioneLivelli?: []; // In futuro, struttura per definire come cambiano stat/keyword per livello
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
  idDefEroe: string; // Riferimento all'id della CartaDef dell'EroeBase
  nomeEroe: string;
  livello: number; // Livello attuale dell'eroe
  hpAttuali: number;
  hpMax: number;     // Calcolati in base a livello e keyword
  comandoMax: number; // Dimensione massima mazzo, da livello
  keywordEffettive: KeywordDefinition[]; // Combinazione di base + equip + temporanee
  // Equipaggiamento (da definire meglio come oggetto o array di CartaDef)
  equipIndossato: {
      ArmaPrincipale?: CartaDef;
      ArmaSecondaria?: CartaDef;
      Armatura?: CartaDef;
      Elmo?: CartaDef;
      Amuleto?: CartaDef;
  };
  // Affiliazioni effettive (base + quelle da equip?)
  affiliazioniEffettive: string[];
}

// UnitaInGioco rimane simile, ma HP Max deriverà da keyword PUNTI_FERITA
export interface UnitaInGioco {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  idGiocatore: number;
  slot: number;
  vitaAttuale: number;
  // hpMax è implicitamente il valore di PUNTI_FERITA dalla cartaDef
  keywordTemporanee: KeywordDefinition[];
}

// --- Stato del Gioco ---

// StatoGiocatore ora contiene EroeInGioco e pozioneEquipaggiata
export interface StatoGiocatore {
  id: number;
  eroe: EroeInGioco; // Oggetto Eroe più dettagliato
  mano: CartaInMano[];
  mazzoRimanente: CartaDef[];
  carteScartate: CartaDef[];
  contatoreFatica: number;
  pozioneEquipaggiata?: CartaDef; // La pozione scelta per la battaglia
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
  // Definizione EroeBase per ogni giocatore e il loro livello per la simulazione
  eroeBaseG1: CartaDef; // La CartaDef dell'eroe
  livelloEroeG1: number;
  equipEroeG1?: CartaDef[]; // Array di CartaDef degli equip indossati

  eroeBaseG2: CartaDef;
  livelloEroeG2: number;
  equipEroeG2?: CartaDef[];

  pozioneG1?: CartaDef;
  pozioneG2?: CartaDef;
  scenario?: CartaDef;
}