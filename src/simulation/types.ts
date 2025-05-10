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
  nome: string;
  valore?: number;
  tipoDanno?: string; // Per keyword offensive O per specificare da cosa protegge una keyword difensiva
  trigger?: KeywordTrigger;
  target?: KeywordTarget;
  valoreTarget?: any;
  durata?: number;
  applicaStatus?: string;
  condizioniAggiuntive?: string;
  descrizione: string; // <-- RESO OBBLIGATORIO: Descrizione funzionale della keyword
}

// --- Definizione Base Carta (come da DB/API) ---
export interface CartaDef {
  id: string;
  nome: string;
  tipo: 'Unità' | 'Potere' | 'Equipaggiamento' | 'Pozione' | 'Scenario' | 'EroeBase';
  punteggioPreparazioneIniziale: number;
  flavorText?: string; // <-- RINOMINATO da descrizioneAbilita, è opzionale
  abilitaKeywords: KeywordDefinition[];
  affiliazioni?: string[];
  slotEquipaggiamento?: 'ArmaPrincipale' | 'ArmaSecondaria' | 'Armatura' | 'Elmo' | 'Amuleto';
  // hpBaseLivello1 e comandoBaseLivello1 rimangono per EroeBase
  hpBaseLivello1?: number;
  comandoBaseLivello1?: number;
  // ATTACCO e VITA rimossi, gestiti da Keywords
}

// --- Entità in gioco o in mano ---

export interface CartaInMano {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  preparazioneAttuale: number;
  statoPotere?: 'Bloccato'; // Usato se un potere è a 0 Prep ma non può essere lanciato
}

// EroeInGioco: hpMax e altre stats deriveranno dalle KeywordDefinition
// in keywordBaseEroe e keywordDaEquip.
export interface EroeInGioco {
  idGiocatore: number;
  idDefEroe: string;
  nomeEroe: string;
  livello: number;
  hpAttuali: number;
  hpMax: number; // Calcolato dalle keyword PUNTI_FERITA
  comandoMax: number;
  keywordBaseEroe: KeywordDefinition[];
  keywordDaEquip: KeywordDefinition[];
  keywordTemporanee: KeywordDefinition[];
  equipIndossato: {
      ArmaPrincipale?: CartaDef;
      ArmaSecondaria?: CartaDef;
      Armatura?: CartaDef;
      Elmo?: CartaDef;
      Amuleto?: CartaDef;
  };
  affiliazioniEffettive: string[];
}

// UnitaInGioco: vitaAttuale e hpMax derivano da keyword PUNTI_FERITA
export interface UnitaInGioco {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  idGiocatore: number;
  slot: number;
  vitaAttuale: number; // HP correnti, modificati in gioco
  // hpMax è il valore della sua keyword PUNTI_FERITA
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