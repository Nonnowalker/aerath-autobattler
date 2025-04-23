-- CreateTable
CREATE TABLE "Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dbId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "attacco" INTEGER NOT NULL,
    "vita" INTEGER NOT NULL,
    "tempoSchieramento" INTEGER NOT NULL,
    "velocitaAttacco" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_dbId_key" ON "Card"("dbId");
