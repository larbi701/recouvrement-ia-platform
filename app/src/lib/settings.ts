import { prisma } from "@/lib/prisma";

export type PlatformSettings = {
  hitlAmountThreshold: number;
  earlyMaxDays: number;
  standardMaxDays: number;
  intensiveMaxDays: number;
  preLegalMaxDays: number;
};

const DEFAULTS: PlatformSettings = {
  hitlAmountThreshold: 100_000,
  earlyMaxDays: 30,
  standardMaxDays: 60,
  intensiveMaxDays: 90,
  preLegalMaxDays: 120,
};

// §10 Administration — seuils réellement lus par le moteur de décision, pas un affichage
// figé. upsert : la première lecture crée l'enregistrement singleton avec les valeurs par
// défaut si personne n'a encore rien réglé.
export async function getSettings(): Promise<PlatformSettings> {
  const row = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", ...DEFAULTS },
  });
  return {
    hitlAmountThreshold: row.hitlAmountThreshold,
    earlyMaxDays: row.earlyMaxDays,
    standardMaxDays: row.standardMaxDays,
    intensiveMaxDays: row.intensiveMaxDays,
    preLegalMaxDays: row.preLegalMaxDays,
  };
}
