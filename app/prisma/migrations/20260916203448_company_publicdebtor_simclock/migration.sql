-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "behaviorNote" TEXT NOT NULL,
    "strategic" BOOLEAN NOT NULL DEFAULT false,
    "chronicLatePayer" BOOLEAN NOT NULL DEFAULT false,
    "isPublicDebtor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Client" ("behaviorNote", "chronicLatePayer", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "name", "sector", "strategic") SELECT "behaviorNote", "chronicLatePayer", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "name", "sector", "strategic" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "hitlAmountThreshold" INTEGER NOT NULL DEFAULT 100000,
    "earlyMaxDays" INTEGER NOT NULL DEFAULT 30,
    "standardMaxDays" INTEGER NOT NULL DEFAULT 60,
    "intensiveMaxDays" INTEGER NOT NULL DEFAULT 90,
    "preLegalMaxDays" INTEGER NOT NULL DEFAULT 120,
    "companyName" TEXT NOT NULL DEFAULT 'Anfa Distribution SARL',
    "companySector" TEXT NOT NULL DEFAULT 'Distribution B2B de fournitures industrielles',
    "simulatedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("earlyMaxDays", "hitlAmountThreshold", "id", "intensiveMaxDays", "preLegalMaxDays", "standardMaxDays", "updatedAt") SELECT "earlyMaxDays", "hitlAmountThreshold", "id", "intensiveMaxDays", "preLegalMaxDays", "standardMaxDays", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
