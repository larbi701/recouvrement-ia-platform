import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

const OUTCOME_LABELS: Record<string, string> = {
  PROMESSE_PAIEMENT: "Promesse de paiement",
  NE_REPOND_PAS: "Ne répond pas",
  CONTESTE: "Conteste",
  PAYE: "A payé pendant l'appel",
  AUTRE: "Autre",
};

// §12.09 Performance équipe — le miroir humain de l'Agent Hub : ce que l'équipe a traité
// elle-même (appels, validations), pas ce que Yas a fait seule. Vue agrégée pour
// l'instant — pas encore de suivi nominatif par collaborateur (pas de notion
// d'utilisateur/compte dans ce POC).
export default async function TeamPerformancePage() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));

  const humanReminders = items.flatMap((i) => i.reminders).filter((r) => r.createdBy === "HUMAIN");
  const completedCalls = items.flatMap((i) => i.callTasks).filter((c) => c.status === "FAIT");
  const allPromises = items.flatMap((i) => i.promises);
  const kept = allPromises.filter((p) => p.status === "TENUE");
  const broken = allPromises.filter((p) => p.status === "ROMPUE");
  const reliabilityRate = kept.length + broken.length > 0 ? Math.round((kept.length / (kept.length + broken.length)) * 100) : null;
  const securedMad = kept.reduce((sum, p) => sum + p.amountMad, 0);
  const pendingValidationMad = items
    .filter((i) => i.nextAction.kind === "LEGAL_TRANSFER" || ("requiresValidation" in i.nextAction && i.nextAction.requiresValidation))
    .reduce((sum, i) => sum + i.amountMad, 0);

  const outcomeCounts = new Map<string, number>();
  for (const c of completedCalls) {
    if (!c.outcome) continue;
    outcomeCounts.set(c.outcome, (outcomeCounts.get(c.outcome) ?? 0) + 1);
  }

  const kpis = [
    { label: "Actions humaines réalisées", value: (humanReminders.length + completedCalls.length).toString(), hint: "Relances envoyées manuellement + appels traités" },
    { label: "Appels traités", value: completedCalls.length.toString(), hint: "Fiches d'appel préparées par Yas, traitées par l'équipe" },
    { label: "Fiabilité des promesses obtenues", value: reliabilityRate !== null ? `${reliabilityRate}%` : "—", hint: `${kept.length} tenue(s) / ${broken.length} rompue(s)` },
    { label: "Montant sécurisé", value: `${securedMad.toLocaleString("fr-FR")} MAD`, hint: "Promesses de paiement tenues" },
    { label: "En attente de l'équipe", value: `${pendingValidationMad.toLocaleString("fr-FR")} MAD`, hint: "Dossiers qui attendent une validation humaine" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Performance équipe" }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <p className="mb-4 text-sm text-graphite/60">
          Le pendant humain de l&apos;Agent Hub — ce que l&apos;équipe a traité elle-même. Vue agrégée pour ce POC,
          pas encore de suivi nominatif par collaborateur.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-lavande-struct bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold text-indigo-deep">{kpi.value}</p>
              <p className="text-xs text-graphite/50">{kpi.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Résultats d&apos;appels
          </h2>
          {outcomeCounts.size === 0 ? (
            <p className="text-sm text-graphite/40">Aucun appel traité pour l&apos;instant.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {Array.from(outcomeCounts.entries()).map(([outcome, count]) => (
                <li key={outcome} className="flex items-center justify-between border-b border-lavande-struct/60 py-1.5 text-sm">
                  <span className="text-graphite">{OUTCOME_LABELS[outcome] ?? outcome}</span>
                  <span className="font-medium text-indigo-deep">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
