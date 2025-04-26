// src/backend/server.ts
import express from 'express';
import cors from 'cors';
import { prisma } from './prismaClient.js'; // Assicurati che il path sia corretto
// Non abbiamo più bisogno di importare il tipo 'Card' specifico da qui se non facciamo casting particolari

const app = express();
const port = process.env.PORT || 3001;

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Routes API per le Carte ===

// GET /api/cards - Ottieni tutte le carte
app.get('/api/cards', async (req, res) => {
  try {
    // Prisma Client ora sa che Card ha i campi aggiornati
    const cards = await prisma.card.findMany({
      orderBy: { // Opzionale: ordina per nome o ID
        nome: 'asc'
      }
    });
    res.json(cards); // Restituisce l'array di carte come arriva dal DB
  } catch (error) {
    console.error("Errore fetch carte:", error);
    res.status(500).json({ error: 'Impossibile recuperare le carte' });
  }
});

// POST /api/cards - Crea una nuova carta
app.post('/api/cards', async (req, res) => {
  // Recupera i dati aggiornati dal corpo della richiesta
  const {
      dbId,
      nome,
      tipo, // Aspettati "Unita" o "Potere" come stringa
      attacco,
      vita,
      punteggioPreparazioneIniziale,
      descrizioneAbilita
    } = req.body;

  // --- Validazione Base (MOLTO IMPORTANTE da espandere!) ---
  // 1. Presenza Campi Obbligatori
  if (!dbId || !nome || !tipo || punteggioPreparazioneIniziale == null) {
      return res.status(400).json({ error: 'Campi obbligatori (dbId, nome, tipo, punteggioPreparazioneIniziale) mancanti.' });
  }
  // 2. Tipo Valido
  if (tipo !== 'Unita' && tipo !== 'Potere') {
     return res.status(400).json({ error: 'Il campo "tipo" deve essere "Unita" o "Potere".' });
  }
  // 3. Valori numerici
   const prep = parseInt(punteggioPreparazioneIniziale, 10);
   const atk = attacco !== undefined && attacco !== null ? parseInt(attacco, 10) : null; // Gestisce opzionalità
   const hp = vita !== undefined && vita !== null ? parseInt(vita, 10) : null;          // Gestisce opzionalità

  if (isNaN(prep) || prep <= 0) {
      return res.status(400).json({ error: 'punteggioPreparazioneIniziale non valido.' });
  }
  if (attacco !== undefined && attacco !== null && (isNaN(atk) || atk < 0)) {
     return res.status(400).json({ error: 'Attacco non valido.' });
  }
  if (vita !== undefined && vita !== null && (isNaN(hp) || hp <= 0)) {
     return res.status(400).json({ error: 'Vita non valida.' });
  }
  // 4. Logica specifica tipo (es. Unita DEVE avere vita/attacco?)
  if (tipo === 'Unita' && (atk === null || hp === null)) {
      return res.status(400).json({ error: 'Le Unità devono avere valori per attacco e vita.' });
  }

  // --- Creazione nel DB ---
  try {
    const nuovaCarta = await prisma.card.create({
      data: {
        dbId,
        nome,
        tipo,       // Passa la stringa validata
        attacco: atk, // Passa il valore parsato o null
        vita: hp,       // Passa il valore parsato o null
        punteggioPreparazioneIniziale: prep,
        descrizioneAbilita: descrizioneAbilita ?? null, // Usa null se non fornito
      },
    });
    res.status(201).json(nuovaCarta); // 201 Created
  } catch (error: any) {
     if (error.code === 'P2002' && error.meta?.target?.includes('dbId')) {
         return res.status(409).json({ error: `ID Carta "${dbId}" esiste già.` });
     }
    console.error("Errore creazione carta:", error);
    res.status(500).json({ error: 'Impossibile creare la carta' });
  }
});

// --- Futuro: Aggiungere PUT /api/cards/:id e DELETE /api/cards/:id ---

// === Avvio Server ===
app.listen(port, () => {
  console.log(`🚀 Backend server pronto su http://localhost:${port}`);
});