// src/simulation/data/keywordLibrary.ts
import { LibreriaKeywordEntry, KeywordTrigger, KeywordTarget } from '../types.js';

// Oggetto che mappa ID Keyword a Definizione Base
export const LIBRERIA_KEYWORD: Record<string, LibreriaKeywordEntry> = {
    // --- KEYWORD PER STATISTICHE BASE ---
    "KW_PUNTI_FERITA_INIZIALI": {
        id: "KW_PUNTI_FERITA_INIZIALI",
        nomeVisualizzato: "Punti Ferita Iniziali",
        descrizioneBase: "Definisce i Punti Ferita massimi iniziali dell'entità: {VALORE}.",
        triggerBase: "SempreAttiva",
        targetBase: "SéStesso",
        richiedeValore: true,
    },
    "KW_COMANDO_BASE": {
        id: "KW_COMANDO_BASE",
        nomeVisualizzato: "Comando Base",
        descrizioneBase: "Definisce la dimensione massima del mazzo consentita dall'eroe: {VALORE}.",
        triggerBase: "SempreAttiva",
        targetBase: "SéStesso", // Si riferisce all'eroe
        richiedeValore: true,
    },

    // --- KEYWORD DI COMBATTIMENTO (OFFENSIVE) ---
    "KW_MISCHIA_UNITA": {
        id: "KW_MISCHIA_UNITA",
        nomeVisualizzato: "Mischia",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} all'unità nello slot opposto. Se lo slot è vuoto, attacca l'Eroe nemico.",
        triggerBase: "FaseAttacco",
        targetBase: "UnitàOpposta",
        richiedeValore: true,
        richiedeTipoDanno: true,
    },
    "KW_MISCHIA_EROE": {
        id: "KW_MISCHIA_EROE",
        nomeVisualizzato: "Mischia (Eroe)",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} all'unità nemica più a sinistra.",
        triggerBase: "FaseAttacco",
        targetBase: "UnitàNemicaPiùASinistra",
        richiedeValore: true,
        richiedeTipoDanno: true,
    },
    "KW_TIRATORE_SCELTO": {
        id: "KW_TIRATORE_SCELTO",
        nomeVisualizzato: "Tiratore Scelto",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} all'unità nemica con meno HP.",
        triggerBase: "FaseAttacco",
        targetBase: "UnitàNemicaConMenoHP",
        richiedeValore: true,
        richiedeTipoDanno: true,
    },
    "KW_CECCHINO": { // Aggiunta basata sugli screenshot
        id: "KW_CECCHINO",
        nomeVisualizzato: "Cecchino",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} all'unità nemica con più HP.",
        triggerBase: "FaseAttacco",
        targetBase: "UnitàNemicaConPiùHP",
        richiedeValore: true,
        richiedeTipoDanno: true,
    },
    "KW_MISCHIA_PERFORANTE_UNITA": {
        id: "KW_MISCHIA_PERFORANTE_UNITA",
        nomeVisualizzato: "Mischia Perforante",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} all'unità nello slot opposto (o Eroe nemico), ignorando {VALORETARGET} ARMATURA.",
        triggerBase: "FaseAttacco",
        targetBase: "UnitàOpposta",
        richiedeValore: true, // Danno
        richiedeTipoDanno: true,
        richiedeValoreTarget: true, // Armatura ignorata
    },
    "KW_LAMPO": {
        id: "KW_LAMPO",
        nomeVisualizzato: "Lampo",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} a un'unità nemica casuale.",
        triggerBase: "FaseAttacco",
        targetBase: "UnitàNemicaCasuale",
        richiedeValore: true,
        richiedeTipoDanno: true, // Es. "Elettrico"
    },
    "KW_DANNO_AREA_NEMICI": { // Per Furia Divina
        id: "KW_DANNO_AREA_NEMICI",
        nomeVisualizzato: "Danno ad Area (Nemici)",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} a tutte le unità nemiche.",
        triggerBase: "QuandoGiocata", // O altro trigger se non è un Potere
        targetBase: "TutteUnitàNemiche",
        richiedeValore: true,
        richiedeTipoDanno: true,
    },
    "KW_BOMBARDAMENTO": { // Aggiunta basata sugli screenshot (Ala Messaggera)
        id: "KW_BOMBARDAMENTO",
        nomeVisualizzato: "Bombardamento",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} a tutte le unità nemiche alla fine del turno.",
        triggerBase: "FineTurnoGiocatore",
        targetBase: "TutteUnitàNemiche",
        richiedeValore: true,
        richiedeTipoDanno: true, // Es. "Fuoco" o "Esplosivo"
    },


    // --- KEYWORD DI CONTROLLO / STATUS ---
    "KW_BAGLIORE": {
        id: "KW_BAGLIORE",
        nomeVisualizzato: "Bagliore",
        descrizioneBase: "L'unità nemica bersaglio ({TARGET}) viene {APPLICASTATUS} per {DURATA} turno/i (salta la prossima Fase Attacco).",
        triggerBase: "FaseAttacco", // Si attiva come parte di un attacco
        targetBase: "UnitàOpposta", // Target di default, può essere sovrascritto
        richiedeApplicaStatus: true, // Es. "Accecato_Attacco"
        richiedeDurata: true,
    },
    "KW_APPLICA_STATUS_BERSAGLIO": { // Per Immagine Infranta
        id: "KW_APPLICA_STATUS_BERSAGLIO",
        nomeVisualizzato: "Applica Status a Bersaglio",
        descrizioneBase: "Applica lo status {APPLICASTATUS} al {TARGET} per {DURATA} turno/i.",
        triggerBase: "QuandoGiocata", // O altro trigger
        targetBase: "UnitàNemicaCasuale", // Default, può essere sovrascritto
        richiedeApplicaStatus: true,
        richiedeDurata: true,
    },

    // --- KEYWORD DIFENSIVE / STATICHE ---
    "KW_ARMATURA": {
        id: "KW_ARMATURA",
        nomeVisualizzato: "Armatura",
        descrizioneBase: "Riduce il danno {TIPODANNO} subito di {VALORE}.",
        triggerBase: "SempreAttiva", // Si applica quando si calcola il danno
        targetBase: "SéStesso",
        richiedeValore: true,
        richiedeTipoDanno: true, // Es. "Fisico", "Qualsiasi"
    },
    "KW_BARRIERA": { // Aggiunta basata sugli screenshot (Templare)
        id: "KW_BARRIERA",
        nomeVisualizzato: "Barriera",
        descrizioneBase: "Quando giocata o all'inizio della battaglia, ottiene una barriera che assorbe {VALORE} danni {TIPODANNO} dal prossimo colpo o effetto. Poi si dissolve.",
        triggerBase: "QuandoGiocata", // O "InizioBattaglia"
        targetBase: "SéStesso",
        richiedeValore: true, // HP della barriera
        richiedeTipoDanno: true, // Es. "Qualsiasi"
        richiedeApplicaStatus: true, // Es. "Barriera_Divina_Attiva"
    },

    // --- KEYWORD DI SUPPORTO / UTILITY ---
    "KW_GUARIGIONE": { // Aggiunta basata sugli screenshot (Cerimoniere)
        id: "KW_GUARIGIONE",
        nomeVisualizzato: "Guarigione",
        descrizioneBase: "Cura {VALORE} Punti Ferita al {TARGET}.",
        triggerBase: "FineTurnoGiocatore", // Esempio
        targetBase: "UnitàAlleataConMenoHP", // Esempio di target complesso
        richiedeValore: true,
    },
    "KW_BENEDIZIONE_CELESTIALE": { // Per Eroe Alytia
        id: "KW_BENEDIZIONE_CELESTIALE",
        nomeVisualizzato: "Benedizione Celestiale",
        descrizioneBase: "All'inizio della battaglia, le unità alleate con affiliazione '{VALORETARGET}' diventano {APPLICASTATUS} per {DURATA} turni.",
        triggerBase: "InizioBattaglia",
        targetBase: "TutteUnitàAlleate",
        richiedeValoreTarget: true, // L'affiliazione, es. "Celestiale"
        richiedeApplicaStatus: true, // Lo status, es. "Ispirato"
        richiedeDurata: true,
    },
    "KW_MALOCCHIO_DEBILITANTE": { // Per Eroe Botan
        id: "KW_MALOCCHIO_DEBILITANTE",
        nomeVisualizzato: "Malocchio Debilitante",
        descrizioneBase: "All'inizio del tuo turno, un'{TARGET} casuale subisce -{VALORE} alle sue abilità di tipo '{VALORETARGET}' per {DURATA} turni.",
        triggerBase: "InizioTurnoGiocatore",
        targetBase: "UnitàNemicaCasuale",
        richiedeValore: true, // Quanto riduce
        richiedeValoreTarget: true, // Il nome della keyword da depotenziare, es. "KW_MISCHIA_UNITA"
        richiedeApplicaStatus: true, // Lo status, es. "Debilitato_Mischia"
        richiedeDurata: true,
    },

    // --- KEYWORD PER EQUIPAGGIAMENTI (Esempi) ---
    "KW_CONFERISCE_POTENZIAMENTO_KEYWORD": {
        id: "KW_CONFERISCE_POTENZIAMENTO_KEYWORD",
        nomeVisualizzato: "Potenziamento Keyword",
        descrizioneBase: "Potenzia la keyword '{VALORETARGET}' dell'eroe, aumentandone il valore di +{VALORE}.",
        triggerBase: "SempreAttiva", // L'effetto è attivo finché l'equip è indossato
        targetBase: "SéStesso", // Si riferisce all'eroe che indossa l'equip
        richiedeValoreTarget: true, // L'ID della keyword da potenziare (es. "KW_MISCHIA_EROE")
        richiedeValore: true,       // Il bonus da aggiungere al valore della keyword potenziata
    },
    // Per equip che danno HP diretti, si può riutilizzare KW_PUNTI_FERITA_INIZIALI
    // e il motore sommerà i valori quando calcola gli HP Max dell'eroe.
    // In alternativa, una keyword specifica:
    "KW_BONUS_PUNTI_FERITA": {
        id: "KW_BONUS_PUNTI_FERITA",
        nomeVisualizzato: "Bonus Punti Ferita",
        descrizioneBase: "Aumenta i Punti Ferita massimi di {VALORE}.",
        triggerBase: "SempreAttiva",
        targetBase: "SéStesso",
        richiedeValore: true,
    },

    // --- KEYWORD SPECIALI / PLACEHOLDER ---
    "KW_SPAVENTOSO": { // Dal Flagellatore
        id: "KW_SPAVENTOSO",
        nomeVisualizzato: "Spaventoso",
        descrizioneBase: "Le unità nemiche con {VALORETARGET} inferiore a {VALORE} potrebbero saltare il loro attacco contro questa unità.",
        triggerBase: "QuandoDifende", // Si attiva quando sta per essere attaccato
        targetBase: "SéStesso", // L'effetto è su questa unità
        richiedeValore: true, // Valore di "coraggio" o statistica da confrontare
        richiedeValoreTarget: true, // La statistica nemica da confrontare (es. "PUNTI_FERITA_ATTUALI" o un futuro "CORAGGIO")
    },
    "KW_PROTETTORE": { // Dal Templare (Placeholder, logica complessa)
        id: "KW_PROTETTORE",
        nomeVisualizzato: "Protettore",
        descrizioneBase: "Finché questa unità è in campo, l'Eroe alleato non può essere bersagliato da attacchi diretti se ci sono altre unità alleate valide.",
        triggerBase: "SempreAttiva",
        targetBase: "EroeAlleato", // Protegge l'eroe
        // Non richiede valori specifici qui, la logica è nel motore
    },
    "KW_VELENO": { // Dall'Accoltellatore
        id: "KW_VELENO",
        nomeVisualizzato: "Veleno",
        descrizioneBase: "Quando infligge danno da combattimento, applica Veleno ({VALORE}) per {DURATA} turni.",
        triggerBase: "QuandoInfliggeDannoCombattimento",
        targetBase: "UnitàOpposta", // Si riferisce al bersaglio dell'attacco che ha triggerato questo
        richiedeValore: true, // Danno del veleno per turno
        richiedeDurata: true,
        richiedeApplicaStatus: true, // Es. "Avvelenato"
    },
};