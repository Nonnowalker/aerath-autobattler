-- CreateTable
CREATE TABLE "KeywordBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeVisualizzato" TEXT NOT NULL,
    "descrizioneBase" TEXT NOT NULL,
    "triggerBase" TEXT NOT NULL,
    "targetBase" TEXT NOT NULL,
    "richiedeValore" BOOLEAN NOT NULL DEFAULT false,
    "richiedeTipoDanno" BOOLEAN NOT NULL DEFAULT false,
    "richiedeValoreTarget" BOOLEAN NOT NULL DEFAULT false,
    "richiedeDurata" BOOLEAN NOT NULL DEFAULT false,
    "richiedeApplicaStatus" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "punteggioPreparazioneIniziale" INTEGER NOT NULL,
    "flavorText" TEXT,
    "affiliazioniJSON" TEXT,
    "slotEquipaggiamento" TEXT,
    "comandoBase" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CardKeywordApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cardId" TEXT NOT NULL,
    "keywordBaseId" TEXT NOT NULL,
    "valore" INTEGER,
    "tipoDanno" TEXT,
    "valoreTarget" TEXT,
    "durata" INTEGER,
    "applicaStatus" TEXT,
    CONSTRAINT "CardKeywordApplication_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardKeywordApplication_keywordBaseId_fkey" FOREIGN KEY ("keywordBaseId") REFERENCES "KeywordBase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
