import { prisma } from "@/lib/prisma";

export type PlatformSettings = {
  hitlAmountThreshold: number;
  earlyMaxDays: number;
  standardMaxDays: number;
  intensiveMaxDays: number;
  preLegalMaxDays: number;
  companyName: string;
  companySector: string;
  simulatedDate: Date;
};

const DEFAULTS = {
  hitlAmountThreshold: 100_000,
  earlyMaxDays: 30,
  standardMaxDays: 60,
  intensiveMaxDays: 90,
  preLegalMaxDays: 120,
  companyName: "Anfa Distribution SARL",
  companySector: "Distribution B2B de fournitures industrielles",
};

// §10 Administration — seuils réellement lus par le moteur de décision, pas un affichage
// figé. upsert : la première lecture crée l'enregistrement singleton avec les valeurs par
// défaut si personne n'a encore rien réglé. simulatedDate est initialisée à la date réelle
// à la création puis pilotée uniquement par /api/clock/advance — jamais réécrite ici.
export async function getSettings(): Promise<PlatformSettings> {
  const row = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", ...DEFAULTS, simulatedDate: new Date() },
  });
  return {
    hitlAmountThreshold: row.hitlAmountThreshold,
    earlyMaxDays: row.earlyMaxDays,
    standardMaxDays: row.standardMaxDays,
    intensiveMaxDays: row.intensiveMaxDays,
    preLegalMaxDays: row.preLegalMaxDays,
    companyName: row.companyName,
    companySector: row.companySector,
    simulatedDate: row.simulatedDate,
  };
}
