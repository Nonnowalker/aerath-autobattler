// prisma/seed.ts
import { PrismaClient, CardType } from '@prisma/client'; // Importa anche CardType
import { carteBase } from '../src/simulation/data/cards';

const prisma = new PrismaClient();

async function main() {
  console.log(`Inizio seeding di ${carteBase.length} carte di esempio...`);

  for (const carta of carteBase) {
    // Determina il tipo corretto per Prisma Enum
    const prismaCardType: CardType = carta.tipo === 'Potere' ? CardType.Potere : CardType.Unita;

    const cardInDb = await prisma.card.upsert({
      where: { dbId: carta.id },
      update: { // Dati da aggiornare (assicurati che i campi corrispondano allo schema!)
        nome: carta.nome,
        tipo: prismaCardType, // Usa l'enum corretto
        attacco: carta.attacco, // Ora può essere null/undefined se opzionale nel DB
        vita: carta.vita,       // Ora può essere null/undefined se opzionale nel DB
        punteggioPreparazioneIniziale: carta.punteggioPreparazioneIniziale,
        descrizioneAbilita: carta.descrizioneAbilita ?? null, // Assegna null se undefined
        // Rimuovi o commenta campi non più presenti (es. velocitaAttacco)
        // velocitaAttacco: undefined, // o rimuovi la riga
      },
      create: { // Dati per la creazione (devono corrispondere!)
        dbId: carta.id,
        nome: carta.nome,
        tipo: prismaCardType, // Usa l'enum corretto
        attacco: carta.attacco,
        vita: carta.vita,
        punteggioPreparazioneIniziale: carta.punteggioPreparazioneIniziale,
        descrizioneAbilita: carta.descrizioneAbilita ?? null,
        // velocitaAttacco: undefined, // o rimuovi la riga
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