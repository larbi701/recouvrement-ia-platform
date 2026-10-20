-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN "note" TEXT;

-- CreateTable
CREATE TABLE "AgentConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autonomy" TEXT NOT NULL DEFAULT 'AUTO',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClientReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "classifiedIntent" TEXT,
    "agentSummary" TEXT,
    "proposedAction" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientReply_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClientReply" ("agentSummary", "classifiedIntent", "content", "id", "invoiceId", "proposedAction", "receivedAt") SELECT "agentSummary", "classifiedIntent", "content", "id", "invoiceId", "proposedAction", "receivedAt" FROM "ClientReply";
DROP TABLE "ClientReply";
ALTER TABLE "new_ClientReply" RENAME TO "ClientReply";
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
    "channelEmail" BOOLEAN NOT NULL DEFAULT true,
    "channelWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "extraForbiddenTerms" TEXT NOT NULL DEFAULT '',
    "styleGuidelines" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("companyName", "companySector", "earlyMaxDays", "hitlAmountThreshold", "id", "intensiveMaxDays", "preLegalMaxDays", "simulatedDate", "standardMaxDays", "updatedAt") SELECT "companyName", "companySector", "earlyMaxDays", "hitlAmountThreshold", "id", "intensiveMaxDays", "preLegalMaxDays", "simulatedDate", "standardMaxDays", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
