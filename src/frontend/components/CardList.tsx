// src/frontend/components/CardList.tsx
import React from 'react';
// Importa l'interfaccia ApiCard corretta (come definita in App.tsx o types)
// Assicurati che contenga: tipo, attacco?, vita?, punteggioPreparazioneIniziale, descrizioneAbilita?
import { ApiCard } from '../App.js';

interface CardListProps {
    cards: ApiCard[];
    isLoading: boolean;
}

const CardList: React.FC<CardListProps> = ({ cards, isLoading }) => {
    // Gestione dello stato di caricamento
    if (isLoading) return <p>Caricamento lista carte dal database...</p>;
    // Messaggio se non ci sono carte nel DB
    if (cards.length === 0) return <p>Nessuna carta trovata nel database.</p>;

    return (
        <div>
            <h3>Carte Esistenti nel DB</h3>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '600px', overflowY: 'auto' }}>
                {/* Ordina opzionalmente le carte per nome o ID per una visualizzazione consistente */}
                {[...cards].sort((a, b) => a.nome.localeCompare(b.nome)).map((card) => (
                    // Renderizza un elemento per ogni carta
                    <li key={card.id} style={{
                        border: '1px solid #ddd', // Bordo più leggero
                        marginBottom: '10px',      // Spaziatura maggiore
                        padding: '10px',          // Padding interno
                        borderRadius: '5px',      // Bordi arrotondati
                    }}>
                        {/* Nome e ID (DB e Logico) */}
                        <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '5px' }}>
                            {card.nome} <span style={{ fontWeight: 'normal', fontSize: '0.9em', color: '#666' }}>({card.dbId})</span>
                        </div>
                        {/* Tipo e Preparazione */}
                        <div>
                           Tipo: <strong style={{textTransform: 'capitalize'}}>{card.tipo}</strong> | Prep: <strong>{card.punteggioPreparazioneIniziale}</strong>
                        </div>
                        {/* Mostra Attacco e Vita solo per le Unità */}
                        {card.tipo === 'Unità' && (
                            <div>
                                Att: <strong>{card.attacco ?? 'N/A'}</strong> | Vita: <strong>{card.vita ?? 'N/A'}</strong>
                            </div>
                        )}
                         {/* Mostra Descrizione Abilità se presente */}
                         {card.descrizioneAbilita && (
                            <div style={{ fontSize: '0.9em', color: '#555', marginTop: '5px', fontStyle: 'italic' }}>
                                {card.descrizioneAbilita}
                            </div>
                         )}
                         {/* Placeholder per futuri bottoni Edit/Delete */}
                         {/*
                         <div style={{marginTop: '8px'}}>
                            <button disabled>Modifica</button>
                            <button disabled style={{marginLeft: '5px'}}>Elimina</button>
                         </div>
                         */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CardList;