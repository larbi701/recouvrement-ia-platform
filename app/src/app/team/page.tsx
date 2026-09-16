import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

const OUTCOME_LABELS: Record<string, string> = {
  PROMESSE_PAIEMENT: "Promesse de paiement",
  NE_REPOND_PAS: "Ne répond pas",
  CONTESTE: "Conteste",
  PAYE: "A payé pendant l'appel",
  AUTRE: "Autre",
};

// §12.09 Interventions humaines — volontairement pas un tableau de bord "performance
// équipe" façon RH : le produit vise à automatiser la grande majorité du recouvrement,
// donc cet écran documente l'exception (appels, validations obligatoires, litiges), pas
// une activité qu'on cherche à maximiser. Le taux d'automatisation en tête de page est
// la preuve chiffrée que l'essentiel du travail est fait par Yas, pas par l'équipe.
export default async function HumanInterventionsPage() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));

  const activity = buildActivityFeed(items, 1000);
  const agentActionCount = activity.filter((e) => e.actor === "AGENT").length;
  const humanActionCount = activity.filter((e) => e.actor === "HUMAIN").length;
  const totalActionCount = agentActionCount + humanActionCount;
  const automationRate = totalActionCount > 0 ? Math.round((agentActionCount / totalActionCount) * 100) : null;

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
    { label: "Appels traités", value: completedCalls.length.toString(), hint: "Fiches d'appel préparées par Yas, traitées par l'équipe" },
    { label: "Fiabilité des promesses obtenues", value: reliabilityRate !== null ? `${reliabilityRate}%` : "—", hint: `${kept.length} tenue(s) / ${broken.length} rompue(s)` },
    { label: "Montant sécurisé", value: `${securedMad.toLocaleString("fr-FR")} MAD`, hint: "Promesses de paiement tenues" },
    { label: "En attente de l'équipe", value: `${pendingValidationMad.toLocaleString("fr-FR")} MAD`, hint: "Dossiers qui attendent une validation humaine" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Interventions humaines" }]} simulatedDate={settings.simulatedDate} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <p className="mb-4 text-sm text-graphite/60">
          L&apos;objectif du produit est que Yas traite la grande majorité du portefeuille seule. L&apos;équipe
          n&apos;intervient que sur les exceptions prévues par les règles de validation (
          <a href="/settings" className="text-azur hover:underline">
            Paramètres
          </a>
          ) : appels, comptes stratégiques, litiges, dossiers pré-contentieux. Cette page mesure donc volontairement
          une activité restreinte, pas une performance à maximiser.
        </p>

        {automationRate !== null && (
          <div className="mb-6 rounded-xl border border-lavande-struct bg-white p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">
                Part du travail traitée par Yas sans intervention humaine
              </p>
              <p className="text-2xl font-bold text-violet-velos">{automationRate}%</p>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-lavande-struct">
              <div className="bg-violet-velos" style={{ width: `${automationRate}%` }} />
              <div className="bg-azur" style={{ width: `${100 - automationRate}%` }} />
            </div>
            <p className="mt-2 text-xs text-graphite/50">
              {agentActionCount} action(s) menées par les agents IA · {humanActionCount} intervention(s) humaine(s)
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
