// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
// Importa i dati delle carte dal tuo file originale
// Attenzione al percorso relativo! Da prisma/ ci muoviamo indietro (..) a src/
import { carteBase } from '../src/simulation/data/cards';

// Istanzia il Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log(`Inizio seeding di ${carteBase.length} carte di esempio...`);

  // Itera su ogni carta definita in carteBase
  for (const carta of carteBase) {
    // Usa upsert: Cerca una carta con lo stesso dbId.
    // Se la trova, la aggiorna (con gli stessi dati, quindi nessun cambiamento reale).
    // Se NON la trova, la crea.
    const cardInDb = await prisma.card.upsert({
      where: { dbId: carta.id }, // Usa il campo 'id' dal tuo oggetto carta come 'dbId' univoco
      update: {
        // Dati da aggiornare se la carta viene trovata (la aggiorniamo con sé stessa)
        nome: carta.nome,
        attacco: carta.attacco,
        vita: carta.vita,
        tempoSchieramento: carta.tempoSchieramento,
        velocitaAttacco: carta.velocitaAttacco,
        // Non aggiorniamo createdAt
      },
      create: {
        // Dati da usare se la carta NON viene trovata
        dbId: carta.id, // L'id stringa della tua carta va nel campo dbId
        nome: carta.nome,
        attacco: carta.attacco,
        vita: carta.vita,
        tempoSchieramento: carta.tempoSchieramento,
        velocitaAttacco: carta.velocitaAttacco,
        // createdAt e updatedAt vengono gestiti automaticamente da Prisma
      },
    });
    console.log(`Carta creata/aggiornata: ${cardInDb.nome} (ID DB: ${cardInDb.id}, DBID: ${cardInDb.dbId})`);
  }

  console.log(`Seeding completato.`);
}

// Esegui la funzione main e gestisci eventuali errori
main()
  .catch((e) => {
    console.error('Errore durante il seeding:', e);
    process.exit(1); // Esci con errore
  })
  .finally(async () => {
    // Assicurati di disconnettere il Prisma Client alla fine
    await prisma.$disconnect();
    console.log('Disconnesso dal database.');
  });