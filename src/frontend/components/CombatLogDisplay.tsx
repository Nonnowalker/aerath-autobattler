// src/frontend/components/CombatLogDisplay.tsx
import React, { useRef, useEffect } from 'react';

interface CombatLogDisplayProps {
  logEntries: string[]; // Array di stringhe del log
}

const CombatLogDisplay: React.FC<CombatLogDisplayProps> = ({ logEntries }) => {
  // Usiamo un riferimento all'elemento div per poter controllare lo scroll
  const logEndRef = useRef<HTMLDivElement>(null);

  // Funzione per scrollare alla fine del log
  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" }); // O "auto" per scroll istantaneo
  }

  // Scrolla alla fine ogni volta che logEntries viene aggiornato
  useEffect(() => {
    scrollToBottom();
  }, [logEntries]); // Dipendenza: esegui quando logEntries cambia

  return (
    <div
      className="combat-log"
      // IMPORTANTISSIMO per accessibilità!
      // Leggerà le nuove entry man mano che vengono aggiunte
      aria-live="polite"
      aria-atomic="false" // Legge solo le nuove aggiunte (di solito preferibile a true)
      tabIndex={0} // Rende il div focusabile via tastiera per scrollare manualmente se necessario
      aria-label="Combat Log - aggiornamenti automatici della battaglia"
    >
      <h2 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.1em', borderBottom: '1px solid #ddd', paddingBottom: '5px'}}>
          Combat Log
      </h2>
      {logEntries.map((entry, index) => (
        // Usare l'indice come key è ok qui se il log è solo append-only e non riordinabile/modificabile
        // Aggiungiamo uno span per permettere stili specifici per riga se necessario
        <p key={index} style={{ margin: '0 0 4px 0' }}>{entry}</p>
      ))}
      {/* Elemento invisibile alla fine per lo scroll automatico */}
      <div ref={logEndRef} />
    </div>
  );
};

// Questa è la riga cruciale per l'export default
export default CombatLogDisplay;