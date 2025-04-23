// src/frontend/App.tsx
import React, { useState } from 'react'; // Rimuovi useEffect se non serve più all'avvio
import CombatLogDisplay from './components/CombatLogDisplay';
import { simulaPartita, StatoPartita } from '../simulation'; // Importa dalla cartella giusta
import { Carta } from '../simulation/types'; // Importa anche Carta
import { getCartaById } from '../simulation/data/cards'; // Importa carte e helper
import './styles/main.scss';

// Helper per creare mazzi di esempio (mettilo fuori dal componente o in un file helpers)
function creaMazzo(idsCarte: string[]): Carta[] {
    const mazzo: Carta[] = [];
    for (const id of idsCarte) {
        const carta = getCartaById(id);
        if (carta) {
            mazzo.push(carta);
        } else {
            console.warn(`Carta con ID "${id}" non trovata!`);
        }
    }
    // Puoi aggiungere logica per mescolare il mazzo qui se vuoi
    // return mazzo.sort(() => Math.random() - 0.5);
    return mazzo;
}


function App() {
  const [simulazioneRisultato, setSimulazioneRisultato] = useState<StatoPartita | null>(null);

  // Definisci qui i mazzi usando gli ID delle carte che abbiamo creato
  const mazzoTestG1 = creaMazzo([
    'goblin_base',
    'scheletro_fragile',
    'guardia_citta',
    'goblin_base', // Puoi mettere copie
    'arciere_elfo',
    'orco_bruto',
  ]);

  const mazzoTestG2 = creaMazzo([
    'scheletro_fragile',
    'scheletro_fragile',
    'guardia_citta',
    'arciere_elfo',
    'orco_bruto',
    'goblin_base',
  ]);


  const avviaSimulazione = () => {
    // Pulisci il risultato precedente se c'è
    setSimulazioneRisultato(null);
    // Chiamiamo la vera funzione di simulazione!
    // È buona norma fare copie dei mazzi per non passare riferimenti che potrebbero essere modificati
    const risultato = simulaPartita([...mazzoTestG1], [...mazzoTestG2]);
    setSimulazioneRisultato(risultato);
  };

  return (
    <div className="App">
      <h1>Aerath Auto Battler (Simulatore Base)</h1>
      <button onClick={avviaSimulazione} disabled={!mazzoTestG1.length || !mazzoTestG2.length}>Avvia Simulazione</button>

      {/* Mostra il log solo se c'è un risultato */}
      {simulazioneRisultato && (
        <>
            <CombatLogDisplay logEntries={simulazioneRisultato.log} />
            {simulazioneRisultato.gameOver && (
                 <p style={{marginTop: '20px', fontWeight: 'bold'}}>
                     Partita finita al Tick {simulazioneRisultato.tickAttuale}! Vincitore: {
                         simulazioneRisultato.vincitore ? `Giocatore ${simulazioneRisultato.vincitore}` : 'Pareggio'
                     }
                 </p>
            )}
        </>
      )}
    </div>
  );
}

export default App;