// src/frontend/App.tsx
import React, { useState, useEffect } from 'react';
import CombatLogDisplay from './components/CombatLogDisplay.js';
import CardList from './components/CardList.js';
import CardCreatorForm from './components/CardCreatorForm.js';
import { avviaSimulazioneCompleta, SimulationParams, StatoPartita } from '../simulation/engine.js'; // Importa con .js
import { CartaDef as SimulationCard } from '../simulation/types.js'; // Importa con .js e rinomina
import './styles/main.scss';

// Interfaccia per i dati delle carte come arrivano dall'API Backend
// Mettila qui o in un file types condiviso (es. src/types/api.ts)
export interface ApiCard {
    id: number; // ID numerico del DB
    dbId: string; // ID stringa logico univoco
    nome: string;
    tipo: 'Unità' | 'Potere';
    attacco: number | null; // Nullable se non applicabile (Poteri)
    vita: number | null; // Nullable se non applicabile (Poteri)
    punteggioPreparazioneIniziale: number;
    descrizioneAbilita: string | null; // Nullable
    createdAt?: string; // Opzionale
    updatedAt?: string; // Opzionale
}

// Funzione per mappare i dati API nel formato richiesto dal simulatore
const mapApiCardToSimulationCard = (apiCard: ApiCard): SimulationCard => {
    return {
        id: apiCard.dbId, // Simulatore usa dbId come id logico
        nome: apiCard.nome,
        tipo: apiCard.tipo,
        // Assicurati che il simulatore gestisca undefined/null se necessario, o assegna 0
        attacco: apiCard.attacco ?? undefined, // Usa undefined se null
        vita: apiCard.vita ?? undefined, // Usa undefined se null
        punteggioPreparazioneIniziale: apiCard.punteggioPreparazioneIniziale,
        descrizioneAbilita: apiCard.descrizioneAbilita ?? undefined,
    };
};

function App() {
    // Stati del componente
    const [simulazioneRisultato, setSimulazioneRisultato] = useState<StatoPartita | null>(null);
    const [availableCards, setAvailableCards] = useState<ApiCard[]>([]);
    const [isLoadingCards, setIsLoadingCards] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // --- Funzione per Caricare le Carte dall'API Backend ---
    const fetchCards = async () => {
        setIsLoadingCards(true);
        setErrorMessage(null);
        try {
            const response = await fetch('http://localhost:3001/api/cards'); // URL Backend
            if (!response.ok) {
                let errorMsg = `Errore HTTP: ${response.status}`;
                try { const errorBody = await response.json(); if (errorBody.error) errorMsg = errorBody.error; } catch (e) { /* ignore */ }
                throw new Error(errorMsg);
            }
            const data: ApiCard[] = await response.json();
            setAvailableCards(data);
        } catch (error: any) {
            console.error("Errore nel caricamento carte:", error);
            setErrorMessage(error.message || "Impossibile caricare le carte dal server.");
        } finally {
            setIsLoadingCards(false);
        }
    };

    // --- Effetto per Caricare le Carte all'Avvio ---
    useEffect(() => {
        fetchCards();
    }, []); // Esegui solo una volta

    // --- Funzione Helper per Creare Mazzi Casuali (dalle carte caricate) ---
    function creaMazzoCasuale(numeroCarte: number, carteDisponibili: ApiCard[]): SimulationCard[] {
        if (carteDisponibili.length === 0) return [];
        const mazzo: ApiCard[] = [];
        for (let i = 0; i < numeroCarte; i++) {
            const randomIndex = Math.floor(Math.random() * carteDisponibili.length);
            mazzo.push(carteDisponibili[randomIndex]);
        }
        // Mappa le carte dal formato API a quello del simulatore
        return mazzo.map(mapApiCardToSimulationCard);
    }

    // --- Funzione per Avviare la Simulazione ---
    // >> QUESTA È L'UNICA DEFINIZIONE DELLA FUNZIONE <<
    const avviaSimulazione = () => {
        setErrorMessage(null);
        if (availableCards.length === 0) {
            setErrorMessage("Nessuna carta disponibile nel DB per creare i mazzi.");
            return;
        }
        setSimulazioneRisultato(null); // Pulisce log precedente

        // Crea due mazzi casuali di 30 carte (esempio)
        const mazzoSimG1 = creaMazzoCasuale(30, availableCards);
        const mazzoSimG2 = creaMazzoCasuale(30, availableCards);

        if (mazzoSimG1.length > 0 && mazzoSimG2.length > 0) {
            // Prepara i parametri per la funzione del motore
            const params: SimulationParams = {
                mazzoDefG1: mazzoSimG1,
                mazzoDefG2: mazzoSimG2,
                // Puoi specificare hpInizialiEroe se vuoi sovrascrivere il default
                // hpInizialiEroe: 50
            };
            try {
                 // Chiama la funzione di simulazione aggiornata
                const risultato = avviaSimulazioneCompleta(params);
                setSimulazioneRisultato(risultato);
            } catch (error: any) {
                 console.error("Errore durante la simulazione:", error);
                 setErrorMessage(`Errore durante la simulazione: ${error.message}`);
                 setSimulazioneRisultato(null); // Assicura pulizia in caso di errore interno sim
            }
        } else {
            setErrorMessage("Impossibile creare mazzi validi (forse non ci sono carte caricate?).");
        }
    };

    // --- Rendering del Componente ---
    return (
        <div className="App">
            <h1>Undertow Auto Battler</h1> {/* Aggiornato nome! */}
            <hr />

            {/* --- Sezione Simulazione --- */}
            <h2>Simulatore</h2>
            {/* Mostra indicatori di caricamento ed errori */}
            {isLoadingCards && <p>Caricamento carte dal database...</p>}
            {errorMessage && <p style={{ color: 'red' }}>Errore: {errorMessage}</p>}

            <button onClick={avviaSimulazione} disabled={isLoadingCards || availableCards.length === 0}>
                Avvia Simulazione (Mazzi Casuali dal DB)
            </button>

            {/* Mostra il log di combattimento se la simulazione è avvenuta */}
            {simulazioneRisultato && (
                <div style={{ marginTop: '20px' }}>
                    <CombatLogDisplay logEntries={simulazioneRisultato.eventiLog} />
                    {/* Mostra il risultato finale al termine */}
                    {simulazioneRisultato.gameOver && (
                        <p style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '1.1em' }}>
                            Partita finita al Turno {simulazioneRisultato.turnoAttuale}! Vincitore: {
                                simulazioneRisultato.vincitore ? `Giocatore ${simulazioneRisultato.vincitore}` : 'Pareggio'
                            }
                        </p>
                    )}
                </div>
            )}

            {/* --- Sezione Gestione Carte --- */}
            <hr style={{ margin: '40px 0' }} />
            <h2>Gestione Carte Database</h2>
            {/* Layout a due colonne per lista e form */}
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* Colonna Sinistra: Lista Carte */}
                <div style={{ flex: 1, minWidth: '400px' }}>
                    <CardList cards={availableCards} isLoading={isLoadingCards} />
                    <button onClick={fetchCards} disabled={isLoadingCards} style={{ marginTop: '10px' }}>
                        {isLoadingCards ? 'Caricamento...' : 'Ricarica Lista Carte'}
                    </button>
                </div>
                {/* Colonna Destra: Form Creazione Carta */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                     {/* Passa fetchCards come callback per aggiornare la lista dopo la creazione */}
                    <CardCreatorForm onCardCreated={fetchCards} />
                </div>
            </div>
        </div>
    );
}

export default App;