import type { WorklistItem } from "@/lib/types";
import type { PlaybookKey } from "@/lib/workflow";

// Cash Forecast Analyst — formule déterministe (§15/§3 des specs techniques) : pas de
// machine learning pour le MVP, une estimation basée sur les promesses de paiement en
// cours et un horizon de recouvrement typique par playbook, pondéré par la probabilité
// d'encaissement de chaque dossier.
const TYPICAL_HORIZON_DAYS: Record<PlaybookKey, number> = {
  PRE_DUE: 10,
  EARLY: 20,
  STANDARD: 35,
  INTENSIVE: 55,
  PRE_LEGAL: 80,
  LEGAL_TRANSFER: 150, // au-delà de l'horizon J+90 dans la quasi-totalité des cas
};

export type ForecastContribution = {
  invoiceId: string;
  clientName: string;
  expectedMad: number;
  expectedInDays: number;
  basis: "promesse" | "estimation";
};

export type ForecastResult = {
  horizons: { label: string; days: number; cumulativeMad: number }[];
  contributions: ForecastContribution[];
};

export function computeCashForecast(items: WorklistItem[]): ForecastResult {
  const contributions: ForecastContribution[] = items.map((item) => {
    const activePromise = item.promises.find((p) => p.status === "EN_COURS");
    if (activePromise) {
      const days = Math.max(
        0,
        Math.ceil((new Date(activePromise.promisedDate).getTime() - Date.now()) / 86_400_000)
      );
      return {
        invoiceId: item.invoiceId,
        clientName: item.clientName,
        expectedMad: activePromise.amountMad,
        expectedInDays: days,
        basis: "promesse",
      };
    }
    const horizon = TYPICAL_HORIZON_DAYS[item.playbook];
    const expectedMad = Math.round((item.amountMad * item.scores.paymentProbabilityScore) / 100);
    return {
      invoiceId: item.invoiceId,
      clientName: item.clientName,
      expectedMad,
      expectedInDays: horizon,
      basis: "estimation",
    };
  });

  const points = [
    { label: "J+7", days: 7 },
    { label: "J+30", days: 30 },
    { label: "J+60", days: 60 },
    { label: "J+90", days: 90 },
  ];

  const horizons = points.map(({ label, days }) => ({
    label,
    days,
    cumulativeMad: contributions
      .filter((c) => c.expectedInDays <= days)
      .reduce((sum, c) => sum + c.expectedMad, 0),
  }));

  return { horizons, contributions: contributions.sort((a, b) => a.expectedInDays - b.expectedInDays) };
}
