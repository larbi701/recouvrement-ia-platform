-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "hitlAmountThreshold" INTEGER NOT NULL DEFAULT 100000,
    "earlyMaxDays" INTEGER NOT NULL DEFAULT 30,
    "standardMaxDays" INTEGER NOT NULL DEFAULT 60,
    "intensiveMaxDays" INTEGER NOT NULL DEFAULT 90,
    "preLegalMaxDays" INTEGER NOT NULL DEFAULT 120,
    "updatedAt" DATETIME NOT NULL
);
