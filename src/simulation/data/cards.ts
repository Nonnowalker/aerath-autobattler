// src/simulation/data/cards.ts
import { Carta } from '../types';

// Definiamo un set di carte molto basilari per i test
export const carteBase: Carta[] = [
  // --- Carte Comuni ---
  {
    id: 'goblin_base',
    nome: 'Goblin Esploratore',
    attacco: 2,
    vita: 3,
    tempoSchieramento: 2, // Schiera la prossima carta dopo 2 tick
    velocitaAttacco: 3    // Attacca ogni 3 tick
  },
  {
    id: 'scheletro_fragile',
    nome: 'Scheletro Fragile',
    attacco: 1,
    vita: 1,
    tempoSchieramento: 1, // Molto veloce da ciclare
    velocitaAttacco: 2    // Attacca velocemente
  },
  {
    id: 'guardia_citta',
    nome: 'Guardia Cittadina',
    attacco: 3,
    vita: 5,
    tempoSchieramento: 3,
    velocitaAttacco: 4
  },

  // --- Carte Non Comuni ---
  {
    id: 'orco_bruto',
    nome: 'Orco Bruto',
    attacco: 5,
    vita: 7,
    tempoSchieramento: 4, // Piu' lento a schierare
    velocitaAttacco: 5    // Attacco potente ma lento
  },
  {
    id: 'arciere_elfo',
    nome: 'Arciere Elfo',
    attacco: 3,
    vita: 3,
    tempoSchieramento: 3,
    velocitaAttacco: 3    // Buon bilanciamento
  },
];

// Funzione helper per trovare una carta per ID (utile per creare i mazzi)
export function getCartaById(id: string): Carta | undefined {
  return carteBase.find(carta => carta.id === id);
}