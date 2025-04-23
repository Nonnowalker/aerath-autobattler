import express from 'express';
import cors from 'cors';
import { prisma } from './prismaClient'; // Usa l'istanza condivisa
import { Card } from '@prisma/client'; // Importa il tipo Card generato

const app = express();
const port = process.env.PORT || 3001; // Porta per il backend (diversa da Vite)

// === Middleware ===
app.use(cors()); // Abilita CORS per tutte le origini (ok per dev)
app.use(express.json()); // Per parsare body JSON nelle richieste POST/PUT

// === Routes API per le Carte ===

// GET /api/cards - Ottieni tutte le carte
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await prisma.card.findMany();
    res.json(cards);
  } catch (error) {
    console.error("Errore fetch carte:", error);
    res.status(500).json({ error: 'Impossibile recuperare le carte' });
  }
});

// POST /api/cards - Crea una nuova carta
app.post('/api/cards', async (req, res) => {
  // Recupera i dati dal corpo della richiesta
  // ! IMPORTANTE: Aggiungere validazione qui! (es. con Zod o Joi)
  const { dbId, nome, attacco, vita, tempoSchieramento, velocitaAttacco } = req.body;

  // Validazione base (migliorare!)
  if (!dbId || !nome || attacco == null || vita == null || tempoSchieramento == null || velocitaAttacco == null) {
      return res.status(400).json({ error: 'Dati carta mancanti o non validi' });
  }

  try {
    const nuovaCarta = await prisma.card.create({
      data: {
        dbId,
        nome,
        // Assicurati che i tipi numerici siano corretti
        attacco: parseInt(attacco, 10),
        vita: parseInt(vita, 10),
        tempoSchieramento: parseInt(tempoSchieramento, 10),
        velocitaAttacco: parseInt(velocitaAttacco, 10),
      },
    });
    res.status(201).json(nuovaCarta); // 201 Created
  } catch (error: any) {
     // Gestisci errore di dbId duplicato
     if (error.code === 'P2002' && error.meta?.target?.includes('dbId')) {
         return res.status(409).json({ error: `ID Carta "${dbId}" esiste già.` }); // 409 Conflict
     }
    console.error("Errore creazione carta:", error);
    res.status(500).json({ error: 'Impossibile creare la carta' });
  }
});

// --- Aggiungere qui altre routes (GET :id, PUT :id, DELETE :id) se necessario ---

// === Avvio Server ===
app.listen(port, () => {
  console.log(`🚀 Backend server pronto su http://localhost:${port}`);
});