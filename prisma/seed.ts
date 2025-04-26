// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { carteBase } from '../src/simulation/data/cards'; // Verifica il percorso relativo

const prisma = new PrismaClient();

async function main() {
  console.log(`Inizio seeding di ${carteBase.length} carte di esempio...`);

  for (const carta of carteBase) {
    // Tipo viene direttamente dalla stringa in carteBase,
    // purché corrisponda a "Unita" o "Potere" definiti nell'enum dello schema.
    // Prisma dovrebbe accettare la stringa se matcha un valore dell'enum.
    const tipoCartaDaSalvare = carta.tipo;

    // Verifica per sicurezza che il tipo sia valido prima di inviarlo
    if (tipoCartaDaSalvare !== 'Unità' && tipoCartaDaSalvare !== 'Potere') {
         console.warn(`Tipo carta non valido "${tipoCartaDaSalvare}" per la carta ${carta.id}. Salto.`);
         continue; // Salta questa carta
    }


    const cardInDb = await prisma.card.upsert({
      where: { dbId: carta.id },
      update: {
        nome: carta.nome,
        // Usa direttamente la stringa se matcha l'enum
        tipo: tipoCartaDaSalvare as ('Unita' | 'Potere'), // Cast per sicurezza TypeScript
        attacco: carta.attacco,
        vita: carta.vita,
        punteggioPreparazioneIniziale: carta.punteggioPreparazioneIniziale,
        descrizioneAbilita: carta.descrizioneAbilita ?? null,
      },
      create: {
        dbId: carta.id,
        nome: carta.nome,
        // Usa direttamente la stringa se matcha l'enum
        tipo: tipoCartaDaSalvare as ('Unita' | 'Potere'), // Cast per sicurezza TypeScript
        attacco: carta.attacco,
        vita: carta.vita,
        punteggioPreparazioneIniziale: carta.punteggioPreparazioneIniziale,
        descrizioneAbilita: carta.descrizioneAbilita ?? null,
      },
    });
    console.log(`Carta creata/aggiornata: ${cardInDb.nome} (ID DB: ${cardInDb.id}, Tipo: ${cardInDb.tipo})`);
  }

  console.log(`Seeding completato.`);
}

main()
  .catch((e) => {
    console.error('Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Disconnesso dal database.');
  });