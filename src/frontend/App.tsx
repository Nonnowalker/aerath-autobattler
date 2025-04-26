// src/frontend/App.tsx
import { avviaSimulazioneCompleta, SimulationParams } from '../simulation/engine.js'; // <-- IMPORTANTE .js e nuovo nome

import React, { useState, useEffect } from 'react';
import CombatLogDisplay from './components/CombatLogDisplay';
import { simulaPartita, StatoPartita } from '../simulation';
// Assicurati che l'interfaccia 'Carta' sia esportata o definita come necessaria nel simulatore
import { Carta as SimulationCard } from '../simulation/types'; // Rinomino per chiarezza
import CardList from './components/CardList'; // Importa il componente lista
import CardCreatorForm from './components/CardCreatorForm'; // Importa il componente form
import './styles/main.scss';

// Interfaccia per la carta come ci aspettiamo che arrivi dall'API backend
// Idealmente, questa potrebbe venire da un file `types.ts` condiviso o specifico per l'API
export interface ApiCard {
    id: number; // ID numerico del DB
    dbId: string; // ID stringa logico univoco (es. goblin_base)
    nome: string;
    attacco: number;
    vita: number;
    tempoSchieramento: number;
    velocitaAttacco: number;
    // Potremmo aggiungere createdAt, updatedAt se utili nel frontend
}

// Funzione di mappatura per convertire il formato API a quello atteso dal simulatore
// Utile se le strutture dovessero divergere in futuro
const mapApiCardToSimulationCard = (apiCard: ApiCard): SimulationCard => {
    // Costruisce l'oggetto SimulationCard basato sull'ApiCard
    return {
        id: apiCard.dbId, // Usa il dbId come 'id' per la logica del simulatore
        nome: apiCard.nome,
        attacco: apiCard.attacco,
        vita: apiCard.vita,
        tempoSchieramento: apiCard.tempoSchieramento,
        velocitaAttacco: apiCard.velocitaAttacco,
        // Assicurati che tutti i campi richiesti da SimulationCard siano qui
    };
}


function App() {
    const [simulazioneRisultato, setSimulazioneRisultato] = useState<StatoPartita | null>(null);
    const [availableCards, setAvailableCards] = useState<ApiCard[]>([]); // Stato per le carte dal DB
    const [isLoadingCards, setIsLoadingCards] = useState<boolean>(true); // Stato per indicare il caricamento
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // Stato per messaggi di errore (fetch, simulazione, ecc.)
    const avviaSimulazione = () => {
        setErrorMessage(null);
        if (availableCards.length === 0) {
            setErrorMessage("Nessuna carta disponibile...");
            return;
        }
        setSimulazioneRisultato(null);
  
        // Crea i mazzi usando le carte disponibili (già mappate nel formato giusto da mapApi...)
         const mazzoSimG1 = creaMazzoCasuale(30, availableCards); // Es: mazzi da 30 carte
         const mazzoSimG2 = creaMazzoCasuale(30, availableCards);
  
         if (mazzoSimG1.length > 0 && mazzoSimG2.length > 0) {
              // Crea l'oggetto parametri
              const params: SimulationParams = {
                  mazzoDefG1: mazzoSimG1,
                  mazzoDefG2: mazzoSimG2,
                  // hpInizialiEroe: 50 // Puoi passare HP diversi se vuoi
              };
              // Chiama la NUOVA funzione di simulazione
              const risultato = avviaSimulazioneCompleta(params);
              setSimulazioneRisultato(risultato);
         } else {
             setErrorMessage("Impossibile creare mazzi.");
         }
    };


    // --- Funzione per caricare le carte dall'API ---
    const fetchCards = async () => {
        setIsLoadingCards(true);
        setErrorMessage(null); // Pulisce errori precedenti
        try {
            // Assicurati che l'URL e la porta siano quelli del tuo backend
            const response = await fetch('http://localhost:3001/api/cards');
            if (!response.ok) {
                 // Prova a leggere un messaggio di errore specifico dal corpo JSON
                 let errorMsg = `Errore HTTP: ${response.status}`;
                 try {
                     const errorBody = await response.json();
                     if (errorBody.error) errorMsg = errorBody.error;
                 } catch(e) { /* Ignora se il body non è JSON valido */ }
                 throw new Error(errorMsg);
            }
            const data: ApiCard[] = await response.json();
            setAvailableCards(data); // Aggiorna lo stato con le carte caricate
        } catch (error: any) {
            console.error("Errore nel caricamento delle carte:", error);
            // Mostra un messaggio di errore generico o quello specifico catturato
            setErrorMessage(error.message || "Impossibile caricare le definizioni delle carte dal server.");
        } finally {
            setIsLoadingCards(false); // Caricamento terminato (successo o fallimento)
        }
    };

    // --- Carica le carte iniziali al montaggio del componente ---
    useEffect(() => {
        fetchCards();
    }, []); // L'array vuoto [] significa che questo effect viene eseguito solo una volta, al montaggio del componente


    // Funzione helper per creare mazzi casuali di N carte, prendendole da quelle disponibili
    // Permette la ripetizione delle carte nel mazzo risultante
    function creaMazzoCasuale(numeroCarte: number, carteDisponibili: ApiCard[]): SimulationCard[] {
        if (carteDisponibili.length === 0) return []; // Ritorna vuoto se non ci sono carte base
        const mazzo: ApiCard[] = [];
        for (let i = 0; i < numeroCarte; i++) {
            // Sceglie un indice casuale tra quelli disponibili
            const randomIndex = Math.floor(Math.random() * carteDisponibili.length);
            mazzo.push(carteDisponibili[randomIndex]); // Aggiunge la carta pescata casualmente
        }
        // Mappa le carte selezionate (formato API) nel formato atteso dal simulatore
        return mazzo.map(mapApiCardToSimulationCard);
    }


    // --- Funzione per avviare la simulazione ---
    const avviaSimulazione = () => {
        setErrorMessage(null); // Pulisce eventuali messaggi di errore precedenti
        if (availableCards.length === 0) {
            setErrorMessage("Nessuna carta disponibile nel DB per creare i mazzi.");
            return;
        }
        setSimulazioneRisultato(null); // Pulisce il log della simulazione precedente

        // Crea due mazzi casuali di 10 carte ciascuno (puoi cambiare il numero)
        const mazzoSimulazioneG1 = creaMazzoCasuale(10, availableCards);
        const mazzoSimulazioneG2 = creaMazzoCasuale(10, availableCards);

        // Assicurati che i mazzi siano stati creati correttamente prima di simulare
        if (mazzoSimulazioneG1.length > 0 && mazzoSimulazioneG2.length > 0) {
            // Passa i mazzi (che sono già nel formato corretto grazie a mapApi...) al simulatore
            const risultato = simulaPartita(mazzoSimulazioneG1, mazzoSimulazioneG2);
            setSimulazioneRisultato(risultato); // Aggiorna lo stato con il risultato della simulazione
        } else {
             setErrorMessage("Impossibile creare mazzi validi (forse non ci sono carte?).");
        }
    };

    return (
        <div className="App">
            <h1>Aerath Auto Battler</h1>
             <hr />

            {/* --- Sezione Simulazione --- */}
            <h2>Simulatore</h2>
            {isLoadingCards && <p>Caricamento carte dal database...</p>}
            {/* Mostra errore generale se presente */}
            {errorMessage && <p style={{ color: 'red' }}>Errore: {errorMessage}</p>}

            <button onClick={avviaSimulazione} disabled={isLoadingCards || availableCards.length === 0}>
                Avvia Simulazione (Mazzi Casuali dal DB)
            </button>

            {/* Mostra il log della simulazione se esiste */}
            {simulazioneRisultato && (
               <div style={{ marginTop: '20px'}}>
                  <CombatLogDisplay logEntries={simulazioneRisultato.log} />
                  {/* Mostra il risultato finale quando la partita termina */}
                  {simulazioneRisultato.gameOver && (
                     <p style={{marginTop: '10px', fontWeight: 'bold', fontSize: '1.1em'}}>
                         Partita finita al Tick {simulazioneRisultato.tickAttuale}! Vincitore: {
                             simulazioneRisultato.vincitore ? `Giocatore ${simulazioneRisultato.vincitore}` : 'Pareggio'
                         }
                     </p>
                  )}
               </div>
            )}

             {/* --- Sezione Gestione Carte --- */}
             <hr style={{ margin: '40px 0'}} />
             <h2>Gestione Carte Database</h2>
             {/* Layout a due colonne per lista e form */}
             <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
                 {/* Colonna Sinistra: Lista Carte */}
                 <div style={{ flex: 1, minWidth: '400px' }}>
                     {/* Passiamo le carte caricate e lo stato di caricamento */}
                     <CardList cards={availableCards} isLoading={isLoadingCards} />
                      {/* Pulsante per ricaricare manualmente la lista (utile dopo aggiunte/modifiche) */}
                     <button onClick={fetchCards} disabled={isLoadingCards} style={{marginTop: '10px'}}>
                         {isLoadingCards ? 'Caricamento...' : 'Ricarica Lista Carte'}
                     </button>
                 </div>
                  {/* Colonna Destra: Form Creazione Carta */}
                  <div style={{ flex: 1, minWidth: '300px' }}>
                      {/* Passiamo fetchCards come callback da eseguire dopo la creazione */}
                      {/* Al momento CardCreatorForm non la usa, ma è una buona pratica averla */}
                      <CardCreatorForm onCardCreated={fetchCards}/>
                  </div>
             </div>
        </div>
    );
}

export default App;