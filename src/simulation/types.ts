// src/simulation/types.ts
// Versione Revisionata per Uniformità HP e Rimozione Attacco Base

// KeywordTrigger e KeywordTarget rimangono invariati come da KW_IMPL_024 / KW_IMPL_031
export type KeywordTrigger =
    | "SempreAttiva" | "InizioBattaglia" | "InizioTurnoGiocatore" | "FineTurnoGiocatore"
    | "QuandoGiocata" | "FaseAttacco" | "QuandoAttacca" | "QuandoDifende"
    | "QuandoSubisceDanno" | "QuandoInfliggeDannoCombattimento" | "QuandoMuore"
    | "QuandoUnAlleatoMuore" | "QuandoUnNemicoMuore" | "QuandoPescaCarta";

export type KeywordTarget =
    | "Nessuno" | "SéStesso" | "UnitàOpposta" | "EroeNemico" | "EroeAlleato"
    | "UnitàAlleataCasuale" | "UnitàNemicaCasuale" | "TutteUnitàAlleate" | "TutteUnitàNemiche"
    | "TutteUnità" | "UnitàAlleataPiùASinistra" | "UnitàNemicaPiùASinistra"
    | "UnitàAlleataConMenoHP" | "UnitàAlleataConPiuHP" | "UnitàNemicaConMenoHP" | "UnitàNemicaConPiuHP"
    | "CartaNellaManoCasuale";

// Definizione BASE di una Keyword (per la Libreria Centrale)
export interface LibreriaKeywordEntry {
    id: string;
    nomeVisualizzato: string;
    descrizioneBase: string;
    triggerBase: KeywordTrigger;
    targetBase: KeywordTarget;
    richiedeValore?: boolean;
    richiedeTipoDanno?: boolean;
    richiedeValoreTarget?: boolean;
    richiedeDurata?: boolean;
    richiedeApplicaStatus?: boolean;
}

// Keyword APPLICATA a una Carta Specifica
export interface KeywordApplicata {
    keywordId: string;
    valore?: number;
    tipoDanno?: string;
    valoreTarget?: any;
    durata?: number;
    applicaStatus?: string;
}

// Definizione Base Carta
export interface CartaDef {
  id: string;
  nome: string;
  tipo: 'Unità' | 'Potere' | 'Equipaggiamento' | 'Pozione' | 'Scenario' | 'EroeBase';
  punteggioPreparazioneIniziale: number;
  flavorText?: string;
  abilitaKeywords: KeywordApplicata[]; // HP e capacità offensive definite qui
  affiliazioni?: string[];
  slotEquipaggiamento?: 'ArmaPrincipale' | 'ArmaSecondaria' | 'Armatura' | 'Elmo' | 'Amuleto';
  comandoBase?: number; // Per EroeBase, per la keyword KW_COMANDO_BASE
}

// Entità in gioco o in mano

export interface CartaInMano {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  preparazioneAttuale: number;
  statoPotere?: 'Bloccato';
}

export interface EroeInGioco {
    idGiocatore: number;
    idDefEroe: string;
    nomeEroe: string;
    livello: number;
    hpAttuali: number;         // PUNTI_FERITA_ATTUALI
    hpMax: number;             // PUNTI_FERITA_MAX (calcolati)
    comandoMax: number;        // Calcolato
    // Keyword "risolte" e pronte all'uso (combinazione di base + equip)
    keywordEffettive: (LibreriaKeywordEntry & KeywordApplicata)[];
    keywordTemporanee: (LibreriaKeywordEntry & KeywordApplicata)[]; // Buff/debuff
    equipIndossato: {
        ArmaPrincipale?: CartaDef;
        ArmaSecondaria?: CartaDef;
        Armatura?: CartaDef;
        Elmo?: CartaDef;
        Amuleto?: CartaDef;
    };
    affiliazioniEffettive: string[];
}

export interface UnitaInGioco {
  idIstanzaUnica: number;
  cartaDef: CartaDef;
  idGiocatore: number;
  slot: number;
  hpAttuali: number;      // PUNTI_FERITA_ATTUALI (rinominato da vitaAttuale)
  hpMax: number;          // PUNTI_FERITA_MAX (calcolati dalla keyword PUNTI_FERITA_INIZIALI)
  // Keyword "risolte" e pronte all'uso (dalla sua CartaDef)
  keywordEffettive: (LibreriaKeywordEntry & KeywordApplicata)[];
  keywordTemporanee: (LibreriaKeywordEntry & KeywordApplicata)[]; // Buff/debuff
}

// Stato del Gioco

export interface StatoGiocatore {
  id: number;
  eroe: EroeInGioco;
  mano: CartaInMano[];
  mazzoRimanente: CartaDef[];
  carteScartate: CartaDef[];
  contatoreFatica: number;
  pozioneEquipaggiata?: CartaDef;
}

export interface StatoPartita {
  idPartita?: string;
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
    eroeBaseG1: CartaDef;
    livelloEroeG1: number;
    equipEroeG1?: CartaDef[];
    eroeBaseG2: CartaDef;
    livelloEroeG2: number;
    equipEroeG2?: CartaDef[];
    pozioneG1?: CartaDef;
    pozioneG2?: CartaDef;
    scenario?: CartaDef;
}