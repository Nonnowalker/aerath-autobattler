// src/simulation/data/cards.ts
import { CartaDef, KeywordApplicata } from '../types.js'; // Importa solo ciò che serve

// Array delle definizioni base delle carte, ora usa KeywordApplicata
export const carteEsempioDef: CartaDef[] = [

  // === EROI BASE ===
  {
    id: 'alytia_celestiale_base',
    nome: 'Alytia, Delegata Celestiale',
    tipo: 'EroeBase',
    punteggioPreparazioneIniziale: 0,
    comandoBase: 25,
    flavorText: "Una luce guida nelle ore più buie, la sua presenza ispira coraggio.",
    affiliazioni: ["Eroe", "Supporto", "Celestiale", "Umano"],
    abilitaKeywords: [
      { keywordId: "KW_PUNTI_FERITA_INIZIALI", valore: 20 },
      { keywordId: "KW_COMANDO_BASE", valore: 25 },
      { keywordId: "KW_MISCHIA_EROE", valore: 1, tipoDanno: "Fisico" },
      { keywordId: "KW_ARMATURA", valore: 1, tipoDanno: "Fisico" },
      { keywordId: "KW_BENEDIZIONE_CELESTIALE", valoreTarget: "Celestiale", applicaStatus: "Ispirato", durata: 3 }
    ]
  },
  {
    id: 'botan_abissale_base',
    nome: 'Botan, Reggente Abissale',
    tipo: 'EroeBase',
    punteggioPreparazioneIniziale: 0,
    comandoBase: 20,
    flavorText: "La sua ombra cela un potere antico e terribile, temuto da nemici e alleati.",
    affiliazioni: ["Eroe", "Guardiano", "Abissale", "Umano"],
    abilitaKeywords: [
      { keywordId: "KW_PUNTI_FERITA_INIZIALI", valore: 25 },
      { keywordId: "KW_COMANDO_BASE", valore: 20 },
      { keywordId: "KW_MISCHIA_EROE", valore: 1, tipoDanno: "Fisico" },
      { keywordId: "KW_ARMATURA", valore: 1, tipoDanno: "Fisico" },
      { keywordId: "KW_MALOCCHIO_DEBILITANTE", valore: 1, valoreTarget: "MISCHIA_UNITA", applicaStatus: "Debilitato_Mischia", durata: 1 }
      // Nota: valoreTarget qui è il nome della keyword bersaglio dell'effetto di riduzione
    ]
  },

  // === UNITA' ===
  {
    id: 'arciere_celestiale',
    nome: 'Arciere Celestiale',
    tipo: 'Unità',
    punteggioPreparazioneIniziale: 3,
    flavorText: "Occhio infallibile, freccia implacabile.",
    affiliazioni: ["Assaltatore", "Celestiale", "Umano"],
    abilitaKeywords: [
      { keywordId: "KW_PUNTI_FERITA_INIZIALI", valore: 4 },
      { keywordId: "KW_TIRATORE_SCELTO", valore: 2, tipoDanno: "Fisico" }
    ]
  },
  {
    id: 'guardia_cittadella',
    nome: 'Guardia della Cittadella',
    tipo: 'Unità',
    punteggioPreparazioneIniziale: 4,
    flavorText: "Lo scudo della civiltà contro le tenebre che avanzano.",
    affiliazioni: ["Guardiano", "Celestiale", "Umano"],
    abilitaKeywords: [
      { keywordId: "KW_PUNTI_FERITA_INIZIALI", valore: 5 },
      { keywordId: "KW_MISCHIA_UNITA", valore: 2, tipoDanno: "Fisico" },
      { keywordId: "KW_ARMATURA", valore: 1, tipoDanno: "Fisico" }
    ]
  },
  {
    id: 'lanciere_celestiale',
    nome: 'Lanciere Celestiale',
    tipo: 'Unità',
    punteggioPreparazioneIniziale: 2,
    flavorText: "La sua lancia perfora le difese nemiche con luce divina.",
    affiliazioni: ["Assaltatore", "Celestiale", "Umano"],
    abilitaKeywords: [
      { keywordId: "KW_PUNTI_FERITA_INIZIALI", valore: 3 },
      // Per "Perfora Scudi", potremmo creare una keyword "MISCHIA_PERFORANTE" nella libreria
      // o aggiungere un parametro alla KeywordApplicata. Per ora, ipotizziamo una keyword dedicata.
      // Se non esiste in libreria, darà errore.
      { keywordId: "KW_MISCHIA_PERFORANTE_UNITA", valore: 3, tipoDanno: "Fisico", valoreTarget: 1 } // valoreTarget = armatura ignorata
    ]
  },
  {
    id: 'luminante_guerriero',
    nome: 'Luminante Guerriero',
    tipo: 'Unità',
    punteggioPreparazioneIniziale: 5,
    flavorText: "Incarna la furia della tempesta e la luce accecante.",
    affiliazioni: ["Assaltatore", "Celestiale", "Umano"],
    abilitaKeywords: [
      { keywordId: "KW_PUNTI_FERITA_INIZIALI", valore: 4 },
      // Per avere due attacchi Lampo, semplicemente aggiungiamo due istanze della keyword
      { keywordId: "KW_LAMPO", valore: 1, tipoDanno: "Elettrico" }, // Assumendo che KW_LAMPO esista in libreria
      { keywordId: "KW_LAMPO", valore: 1, tipoDanno: "Elettrico" },
      { keywordId: "KW_BAGLIORE", applicaStatus: "Accecato_Attacco", durata: 1 } // Assumendo KW_BAGLIORE esista
    ]
  },
  // ... (Aggiungi le altre unità come Templare e Cerimoniere Novizio,
  //      creando prima le loro keyword base in keywordLibrary.ts se necessario) ...

  // === POTERI ===
  {
    id: 'furia_divina_potere',
    nome: 'Furia Divina',
    tipo: 'Potere',
    punteggioPreparazioneIniziale: 2,
    flavorText: "L'ira celeste si scatena.",
    abilitaKeywords: [
      { keywordId: "KW_DANNO_AREA_NEMICI", valore: 1, tipoDanno: "Divino" } // Assumendo KW_DANNO_AREA_NEMICI esista
    ]
  },
  {
    id: 'immagine_infranta_potere',
    nome: 'Immagine Infranta',
    tipo: 'Potere',
    punteggioPreparazioneIniziale: 3,
    flavorText: "Visioni distorte confondono il nemico.",
    abilitaKeywords: [
      { keywordId: "KW_APPLICA_STATUS_BERSAGLIO", applicaStatus: "Confuso", durata: 1 } // Assumendo KW_APPLICA_STATUS_BERSAGLIO esista
    ]
  },

  // === EQUIPAGGIAMENTI ===
  {
    id: 'lancia_semplice_equip',
    nome: 'Lancia Semplice',
    tipo: 'Equipaggiamento',
    slotEquipaggiamento: 'ArmaPrincipale',
    punteggioPreparazioneIniziale: 0,
    flavorText: "Un'arma affidabile per ogni guerriero.",
    abilitaKeywords: [
      // Questa keyword indicherà al motore di modificare la keyword MISCHIA_EROE dell'eroe.
      { keywordId: "KW_CONFERISCE_POTENZIAMENTO_KEYWORD", valoreTarget: "KW_MISCHIA_EROE", valore: 1 }
      // Oppure, se l'equip conferisce direttamente una keyword che si somma:
      // { keywordId: "KW_MISCHIA_EROE", valore: 1, tipoDanno: "Fisico" } // Questo si sommerà
    ]
  },
  {
    id: 'armatura_cuoio_equip',
    nome: 'Armatura di Cuoio',
    tipo: 'Equipaggiamento',
    slotEquipaggiamento: 'Armatura',
    punteggioPreparazioneIniziale: 0,
    flavorText: "Meglio di niente.",
    abilitaKeywords: [
      { keywordId: "KW_PUNTI_FERITA_INIZIALI", valore: 5 }, // Questo si sommerà agli HP base dell'eroe
      { keywordId: "KW_ARMATURA", valore: 1, tipoDanno: "Fisico" } // Si sommerà all'armatura base
    ]
  }
];

// Funzione helper (invariata, ma ora meno utile per il motore)
export function getCartaDefById(id: string): CartaDef | undefined {
  return carteEsempioDef.find(carta => carta.id === id);
}