// src/simulation/data/cards.ts
// Assumiamo che l'interfaccia Carta qui venga aggiornata per coerenza
// Ma per ora modifichiamo solo i dati nell'array:
export const carteBase = [ // Ora assumiamo che tutti questi siano 'Unità' per esempio
  {
    id: 'goblin_base',
    nome: 'Goblin Esploratore',
    tipo: 'Unità', // <--- AGGIUNGI TIPO
    attacco: 2,
    vita: 3,
    // Rinominato 'tempoSchieramento' in 'punteggioPreparazioneIniziale'
    punteggioPreparazioneIniziale: 2, // <--- RINOMINATO/AGGIUNTO
    // 'velocitaAttacco' probabilmente non serve più qui, commenta o rimuovi
    // velocitaAttacco: 3
    descrizioneAbilita: "Una fastidiosa piccola creatura.", // <--- OPZIONALE
  },
  {
    id: 'scheletro_fragile',
    nome: 'Scheletro Fragile',
    tipo: 'Unità',
    attacco: 1,
    vita: 1,
    punteggioPreparazioneIniziale: 1,
    descrizioneAbilita: "Si rompe facilmente.",
  },
  {
    id: 'guardia_citta',
    nome: 'Guardia Cittadina',
    tipo: 'Unità',
    attacco: 3,
    vita: 5,
    punteggioPreparazioneIniziale: 3,
    descrizioneAbilita: "Difensore standard.",
  },
  {
    id: 'orco_bruto',
    nome: 'Orco Bruto',
    tipo: 'Unità',
    attacco: 5,
    vita: 7,
    punteggioPreparazioneIniziale: 4,
    descrizioneAbilita: "Grande e grosso.",
  },
  {
    id: 'arciere_elfo',
    nome: 'Arciere Elfo',
    tipo: 'Unità',
    attacco: 3,
    vita: 3,
    punteggioPreparazioneIniziale: 3,
    descrizioneAbilita: "Colpisce dalla distanza (nota: abilità non ancora implementata!).",
  },
  // --- Aggiungiamo un POTERE di esempio ---
  {
      id: 'fulmine_improvviso',
      nome: 'Fulmine Improvviso',
      tipo: 'Potere', // <--- TIPO POTERE
      // Attacco e Vita sono null o 0 per i poteri nel nostro schema
      attacco: undefined, // O null se il campo è opzionale nel DB
      vita: undefined,    // O null
      punteggioPreparazioneIniziale: 2,
      descrizioneAbilita: "Infligge 3 danni all'unità nemica con la vita più bassa.", // Descrizione effetto
  },
];

// Funzione helper (invariata per ora, ma assicurati usi 'id')
export function getCartaById(id: string): any | undefined { // Il tipo 'any' qui è temporaneo
  return carteBase.find(carta => carta.id === id);
}