import React from 'react';
import { ApiCard } from '../App'; // Assumendo che ApiCard sia esportata o definita qui

interface CardListProps {
    cards: ApiCard[];
    isLoading: boolean;
}

const CardList: React.FC<CardListProps> = ({ cards, isLoading }) => {
    if (isLoading) return <p>Caricamento lista carte...</p>;
    if (cards.length === 0) return <p>Nessuna carta trovata nel database.</p>;

    return (
        <div>
            <h3>Carte Esistenti</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {cards.map((card) => (
                    <li key={card.id} style={{ border: '1px solid #eee', marginBottom: '5px', padding: '5px' }}>
                       ({card.dbId}) {card.nome} - A:{card.attacco} V:{card.vita} TS:{card.tempoSchieramento} VA:{card.velocitaAttacco}
                       {/* Aggiungere bottoni Edit/Delete in futuro */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CardList;