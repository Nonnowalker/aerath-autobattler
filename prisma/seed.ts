// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { LIBRERIA_KEYWORD } from '../src/simulation/data/keywordLibrary.js';
import { carteEsempioDef } from '../src/simulation/data/cards.js';

const prisma = new PrismaClient();

async function main() {
  console.log(`Inizio seeding delle definizioni base delle Keyword...`);
  for (const kwId in LIBRERIA_KEYWORD) { // kwId è la chiave, es. "KW_MISCHIA_UNITA"
    const kwBaseDefinition = LIBRERIA_KEYWORD[kwId]; // Questo è l'oggetto LibreriaKeywordEntry

    await prisma.keywordBase.upsert({
      where: { id: kwBaseDefinition.id }, // Usa l'id dalla definizione della libreria
      update: { // Usa i campi da kwBaseDefinition
        nomeVisualizzato: kwBaseDefinition.nomeVisualizzato,
        descrizioneBase: kwBaseDefinition.descrizioneBase,
        triggerBase: kwBaseDefinition.triggerBase,
        targetBase: kwBaseDefinition.targetBase,
        richiedeValore: kwBaseDefinition.richiedeValore ?? false,
        richiedeTipoDanno: kwBaseDefinition.richiedeTipoDanno ?? false,
        richiedeValoreTarget: kwBaseDefinition.richiedeValoreTarget ?? false,
        richiedeDurata: kwBaseDefinition.richiedeDurata ?? false,
        richiedeApplicaStatus: kwBaseDefinition.richiedeApplicaStatus ?? false,
      },
      create: { // Usa i campi da kwBaseDefinition
        id: kwBaseDefinition.id,
        nomeVisualizzato: kwBaseDefinition.nomeVisualizzato,
        descrizioneBase: kwBaseDefinition.descrizioneBase,
        triggerBase: kwBaseDefinition.triggerBase,
        targetBase: kwBaseDefinition.targetBase,
        richiedeValore: kwBaseDefinition.richiedeValore ?? false,
        richiedeTipoDanno: kwBaseDefinition.richiedeTipoDanno ?? false,
        richiedeValoreTarget: kwBaseDefinition.richiedeValoreTarget ?? false,
        richiedeDurata: kwBaseDefinition.richiedeDurata ?? false,
        richiedeApplicaStatus: kwBaseDefinition.richiedeApplicaStatus ?? false,
      },
    });
    console.log(`Keyword base creata/aggiornata: ${kwBaseDefinition.nomeVisualizzato} (ID: ${kwBaseDefinition.id})`);
  }
  console.log(`Seeding definizioni Keyword completato.`);

  console.log(`\nInizio seeding di ${carteEsempioDef.length} carte di esempio...`);
  for (const cartaDefinition of carteEsempioDef) { // Ora usiamo cartaDefinition per iterare le carte
    const { abilitaKeywords, ...cardDataToCreate } = cartaDefinition;

    // Prima crea o aggiorna la carta base
    const cardInDb = await prisma.card.upsert({
      where: { id: cardDataToCreate.id },
      update: {
        nome: cardDataToCreate.nome,
        tipo: cardDataToCreate.tipo,
        punteggioPreparazioneIniziale: cardDataToCreate.punteggioPreparazioneIniziale,
        flavorText: cardDataToCreate.flavorText ?? null,
        affiliazioniJSON: JSON.stringify(cardDataToCreate.affiliazioni ?? []),
        slotEquipaggiamento: cardDataToCreate.slotEquipaggiamento ?? null,
        comandoBase: cardDataToCreate.comandoBase ?? null,
      },
      create: {
        id: cardDataToCreate.id,
        nome: cardDataToCreate.nome,
        tipo: cardDataToCreate.tipo,
        punteggioPreparazioneIniziale: cardDataToCreate.punteggioPreparazioneIniziale,
        flavorText: cardDataToCreate.flavorText ?? null,
        affiliazioniJSON: JSON.stringify(cardDataToCreate.affiliazioni ?? []),
        slotEquipaggiamento: cardDataToCreate.slotEquipaggiamento ?? null,
        comandoBase: cardDataToCreate.comandoBase ?? null,
      },
    });
    console.log(`Carta creata/aggiornata: ${cardInDb.nome} (ID: ${cardInDb.id})`);

    // Poi, crea le relazioni CardKeywordApplication
    if (abilitaKeywords && abilitaKeywords.length > 0) {
      // Opzionale: cancella le applicazioni esistenti per questa carta per evitare duplicati se lo script viene modificato ed eseguito più volte
      await prisma.cardKeywordApplication.deleteMany({ where: { cardId: cardInDb.id }});

      console.log(`  Aggiungendo ${abilitaKeywords.length} keyword applicate per ${cardInDb.nome}...`);
      for (const kwApp of abilitaKeywords) { // kwApp è un oggetto KeywordApplicata
        await prisma.cardKeywordApplication.create({
          data: {
            cardId: cardInDb.id,
            keywordBaseId: kwApp.keywordId, // Riferimento all'ID della KeywordBase
            // Valori specifici dell'applicazione
            valore: kwApp.valore,
            tipoDanno: kwApp.tipoDanno,
            valoreTarget: kwApp.valoreTarget ? String(kwApp.valoreTarget) : null,
            durata: kwApp.durata,
            applicaStatus: kwApp.applicaStatus,
          },
        });
        console.log(`    - Keyword ${kwApp.keywordId} applicata con valore ${kwApp.valore ?? 'N/A'}`);
      }
    }
  }
  console.log(`Seeding carte completato.`);
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