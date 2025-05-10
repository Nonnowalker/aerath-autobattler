// src/simulation/types.ts

// Enum KeywordTrigger (come definito in KW_IMPL_008)
export type KeywordTrigger =
    | "SempreAttiva"
    | "InizioBattaglia"
    | "InizioTurnoGiocatore"
    | "FineTurnoGiocatore"
    | "QuandoGiocata"
    | "FaseAttacco"
    | "QuandoAttacca"
    | "QuandoDifende"
    | "QuandoSubisceDanno"
    | "QuandoInfliggeDannoCombattimento"
    | "QuandoMuore"
    | "QuandoUnAlleatoMuore"
    | "QuandoUnNemicoMuore"
    | "QuandoPescaCarta";

// Enum KeywordTarget (come definito in KW_IMPL_008, con "Nessuno" e "SéStesso")
export type KeywordTarget =
    | "Nessuno" // Per effetti globali o che non bersagliano entità specifiche
    | "SéStesso" // L'entità che possiede la keyword
    | "UnitàOpposta"
    | "EroeNemico"
    | "EroeAlleato"
    | "UnitàAlleataCasuale"
    | "UnitàNemicaCasuale"
    | "TutteUnitàAlleate"
    | "TutteUnitàNemiche"
    | "TutteUnità"
    | "UnitàAlleataPiùASinistra"
    | "UnitàNemicaPiùASinistra"
    | "UnitàNemicaConMenoHP"
    | "UnitàNemicaConPiuHP"
    | "CartaNellaManoCasuale";

// --- Definizione BASE di una Keyword (per la Libreria Centrale) ---
// Questa era la nostra precedente KeywordDefinition
export interface LibreriaKeywordEntry {
  id: string;                       // ID univoco della keyword (es. "KW_MISCHIA_UNITA")
  nomeVisualizzato: string;         // Nome amichevole per UI (es. "Mischia", "Armatura")
  descrizioneBase: string;          // Descrizione generica, può usare placeholder come {VALORE} o {TIPODANNO}
                                    // Es: "Infligge {VALORE} danno {TIPODANNO}."
  triggerBase: KeywordTrigger;
  targetBase: KeywordTarget;
  // Flag per indicare se la keyword si aspetta certi parametri specifici sulla carta
  richiedeValore?: boolean;         // Default: false
  richiedeTipoDanno?: boolean;      // Default: false
  richiedeValoreTarget?: boolean;   // Default: false
  richiedeDurata?: boolean;         // Default: false
  richiedeApplicaStatus?: boolean;  // Default: false
  // tipoDannoDefault?: string;     // Se non specificato sulla carta, usa questo
}

// --- Keyword APPLICATA a una Carta Specifica ---
// Contiene il riferimento alla keyword base e i valori specifici per quella carta.
export interface KeywordApplicata {
  keywordId: string;  // ID che fa riferimento a LibreriaKeywordEntry.id
  valore?: number;    // Valore specifico per questa istanza (es. il '2' in MISCHIA(2))
  tipoDanno?: string; // Tipo danno specifico, sovrascrive/specifica quello base
  valoreTarget?: any;
  durata?: number;
  applicaStatus?: string;
  // Non ripetiamo trigger, target base, descrizione base qui.
  // Vengono presi dalla LibreriaKeywordEntry.
  // La descrizione effettiva per la UI verrà composta.
}

// --- Definizione Base Carta (Aggiornata) ---
export interface CartaDef {
id: string;
nome: string;
tipo: 'Unità' | 'Potere' | 'Equipaggiamento' | 'Pozione' | 'Scenario' | 'EroeBase';
punteggioPreparazioneIniziale: number;
flavorText?: string;
abilitaKeywords: KeywordApplicata[]; // Ora un array di KeywordApplicata
affiliazioni?: string[];
slotEquipaggiamento?: 'ArmaPrincipale' | 'ArmaSecondaria' | 'Armatura' | 'Elmo' | 'Amuleto';
comandoBase?: number;
}

// --- Entità in gioco o in mano ---

export interface CartaInMano {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  preparazioneAttuale: number;
  statoPotere?: 'Bloccato';
}

// EroeInGioco, UnitaInGioco, StatoGiocatore, StatoPartita, SimulationParams
// rimangono strutturalmente come in KW_IMPL_015, ma ora le keyword che contengono
// (keywordBaseEroe, keywordDaEquip, keywordTemporanee) saranno di tipo KeywordApplicata[]
// o faranno riferimento a keywordId per poi essere "risolte" dal motore con la libreria.
// Per semplicità iniziale, potremmo far sì che EroeInGioco e UnitaInGioco abbiano
// un array di OGGETTI KeywordDefinition già "risolti" (combinando Libreria + Applicata).
// Oppure, il motore fa questa risoluzione al volo.

// Per ora, modifichiamo EroeInGioco e UnitaInGioco per usare KeywordApplicata
// per le keyword che *derivano* direttamente dalle carte (base eroe, equip, definizione unità)
// Le keywordTemporanee potrebbero essere già oggetti KeywordDefinition "risolti".

export interface EroeInGioco {
  idGiocatore: number;
  idDefEroe: string;
  nomeEroe: string;
  livello: number;
  hpAttuali: number;
  hpMax: number;
  comandoMax: number;
  // Queste sono le keyword come definite sulla CartaDef dell'eroe e sugli equip
  keywordBaseEroeDef: KeywordApplicata[]; // Dalla CartaDef dell'EroeBase
  keywordDaEquipDef: KeywordApplicata[];  // Dalle CartaDef degli Equip
  // Queste sono keyword attive/temporanee sull'eroe, già "risolte"
  keywordTemporaneeEffettive: LibreriaKeywordEntry & KeywordApplicata[]; // Oggetto combinato
  equipIndossato: { /* ... */ };
  affiliazioniEffettive: string[];
}

export interface UnitaInGioco {
idIstanzaUnica: number;
cartaDef: CartaDef; // Da qui si leggono le abilitaKeywords (KeywordApplicata[])
idGiocatore: number;
slot: number;
hpAttuali: number;
hpMax: number;
// Queste sono keyword attive/temporanee sull'unità, già "risolte"
keywordTemporaneeEffettive: LibreriaKeywordEntry & KeywordApplicata[]; // Oggetto combinato
}

// --- Stato del Gioco ---

export interface StatoGiocatore {
  id: number;
  eroe: EroeInGioco;
  mano: CartaInMano[];
  mazzoRimanente: CartaDef[];
  carteScartate: CartaDef[];
  contatoreFatica: number;
  pozioneEquipaggiata?: CartaDef; // La pozione scelta per la battaglia (se presente)
}

export interface StatoPartita {
  idPartita?: string; // Opzionale
  turnoAttuale: number;
  idGiocatoreAttivo: number;
  faseTurno: string;
  giocatori: [StatoGiocatore, StatoGiocatore];
  campoG1: (UnitaInGioco | null)[];
  campoG2: (UnitaInGioco | null)[];
  scenarioAttivo?: CartaDef;
  eventiLog: string[];
  gameOver: boolean;
  vincitore: number | null;
  prossimoIdIstanzaUnica: number;
  primoTurnoP1Saltato: boolean;
}

export interface SimulationParams {
    mazzoDefG1: CartaDef[];
    mazzoDefG2: CartaDef[];
    eroeBaseG1: CartaDef;    // La CartaDef 'EroeBase' per G1
    livelloEroeG1: number;
    equipEroeG1?: CartaDef[]; // Array di CartaDef di tipo 'Equipaggiamento'

    eroeBaseG2: CartaDef;    // La CartaDef 'EroeBase' per G2
    livelloEroeG2: number;
    equipEroeG2?: CartaDef[];

    pozioneG1?: CartaDef;   // CartaDef di tipo 'Pozione'
    pozioneG2?: CartaDef;
    scenario?: CartaDef;    // CartaDef di tipo 'Scenario'
}