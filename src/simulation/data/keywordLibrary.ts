// src/simulation/data/keywordLibrary.ts
import { LibreriaKeywordEntry, KeywordTrigger, KeywordTarget, KeywordApplicata } from '../types.js';

// Oggetto che mappa ID Keyword a Definizione Base
export const LIBRERIA_KEYWORD: Record<string, LibreriaKeywordEntry> = {
    // Keyword per Statistiche Base
    "KW_PUNTI_FERITA_INIZIALI": {
        id: "KW_PUNTI_FERITA_INIZIALI",
        nomeVisualizzato: "Punti Ferita",
        descrizioneBase: "Definisce i Punti Ferita massimi iniziali dell'entità: {VALORE}.",
        triggerBase: "SempreAttiva",
        targetBase: "SéStesso",
        richiedeValore: true,
    },
    "KW_COMANDO_BASE": {
        id: "KW_COMANDO_BASE",
        nomeVisualizzato: "Comando",
        descrizioneBase: "Definisce la dimensione massima del mazzo: {VALORE}.",
        triggerBase: "SempreAttiva",
        targetBase: "SéStesso", // Si riferisce all'eroe
        richiedeValore: true,
    },

    // Keyword di Combattimento Comuni
    "KW_MISCHIA_UNITA": {
        id: "KW_MISCHIA_UNITA",
        nomeVisualizzato: "Mischia",
        descrizioneBase: "Infligge {VALORE} danno {TIPODANNO} all'unità nello slot opposto. Se lo slot è vuoto, attacca l'Eroe nemico.",
        triggerBase: "FaseAttacco",
        targetBase: "UnitàOpposta", // Il motore gestirà il fallback all'eroe
        richiedeValore: true,
        richiedeTipoDanno: true, // Es. "Fisico"
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

    // Keyword Difensive
    "KW_ARMATURA": {
        id: "KW_ARMATURA",
        nomeVisualizzato: "Armatura",
        descrizioneBase: "Riduce il danno {TIPODANNO} subito di {VALORE}.",
        triggerBase: "SempreAttiva", // O QuandoSubisceDanno
        targetBase: "SéStesso",
        richiedeValore: true,
        richiedeTipoDanno: true, // Es. "Fisico", "Qualsiasi"
    },

    // Keyword di Esempio da Screenshot
    "KW_BENEDIZIONE_CELESTIALE": {
        id: "KW_BENEDIZIONE_CELESTIALE",
        nomeVisualizzato: "Benedizione Celestiale",
        descrizioneBase: "All'inizio della battaglia, le unità {VALORETARGET} alleate diventano Ispirate per {DURATA} turni.",
        triggerBase: "InizioBattaglia",
        targetBase: "TutteUnitàAlleate",
        richiedeValoreTarget: true, // Es. "Celestiale"
        richiedeApplicaStatus: true, // Es. "Ispirato"
        richiedeDurata: true,
    },
    "KW_MALOCCHIO_DEBILITANTE": {
        id: "KW_MALOCCHIO_DEBILITANTE",
        nomeVisualizzato: "Malocchio Debilitante",
        descrizioneBase: "All'inizio del tuo turno, un'unità nemica casuale subisce -{VALORE} alle sue abilità {VALORETARGET} per {DURATA} turni.",
        triggerBase: "InizioTurnoGiocatore",
        targetBase: "UnitàNemicaCasuale",
        richiedeValore: true, // Quanto riduce
        richiedeValoreTarget: true, // A quale tipo di keyword (es. "MISCHIA")
        richiedeApplicaStatus: true, // Es. "Debilitato_Mischia"
        richiedeDurata: true,
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
    // ... Aggiungi qui le definizioni base per TUTTE le keyword che prevedi di usare
    // come PERFORA_SCUDI, LAMPO, BAGLIORE, PROTETTORE, BARRIERA, GUARIGIONE,
    // DANNO_AREA, APPLICA_STATUS, CONFERISCE_KEYWORD_STATICA, BONUS_PUNTI_FERITA, ecc.
};

// Funzione per "risolvere" una KeywordApplicata in un oggetto completo
// (unendo dati dalla libreria e quelli specifici della carta)
// Questa funzione sarà usata dal motore o quando si visualizzano i dettagli della carta.
export function risolviKeyword(keywordApp: KeywordApplicata): LibreriaKeywordEntry & KeywordApplicata {
    const keywordBase = LIBRERIA_KEYWORD[keywordApp.keywordId];
    if (!keywordBase) {
        console.error(`Errore: Definizione base per keyword ID "${keywordApp.keywordId}" non trovata nella libreria!`);
        // Restituisci qualcosa di gestibile o lancia un errore
        return {
            id: keywordApp.keywordId,
            nomeVisualizzato: `ERRORE_${keywordApp.keywordId}`,
            descrizioneBase: "Definizione mancante",
            triggerBase: "SempreAttiva", // Default di sicurezza
            targetBase: "Nessuno",    // Default di sicurezza
            ...keywordApp // Includi comunque i valori specifici
        };
    }
    // Combina la definizione base con i valori specifici dell'istanza applicata
    return {
        ...keywordBase, // Proprietà dalla libreria (id, nomeVisualizzato, descrizioneBase, triggerBase, targetBase, flag 'richiede...')
        ...keywordApp,  // Proprietà specifiche dell'istanza (keywordId, valore?, tipoDanno?, ecc.)
                        // Nota: i campi di keywordApp sovrascriveranno quelli di keywordBase se hanno lo stesso nome,
                        // il che è corretto per 'valore', 'tipoDanno', ecc.
                        // Ma 'id', 'nomeVisualizzato', 'descrizioneBase', 'triggerBase', 'targetBase' vengono da keywordBase.
    };
}