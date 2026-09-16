import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { AppHeader } from "@/components/AppHeader";
import { KpiHeader } from "@/components/KpiHeader";
import { PLAYBOOK_LABELS, type PlaybookKey } from "@/lib/workflow";

export const dynamic = "force-dynamic";

const PLAYBOOK_ORDER: PlaybookKey[] = ["PRE_DUE", "EARLY", "STANDARD", "INTENSIVE", "PRE_LEGAL", "LEGAL_TRANSFER"];

// §12.01 Executive Dashboard — "Comment se porte mon cash ?" Vision globale pour CEO/DAF,
// séparée de l'Action Center (qui reste une to-do list, pas un écran analytique).
export default async function ExecutiveDashboard() {
  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    orderBy: { dueDate: "asc" },
  });
  const items = invoices.map(buildWorklistItem);
  const totalOverdueMad = items.reduce((sum, i) => sum + i.amountMad, 0);

  const byPlaybook = PLAYBOOK_ORDER.map((key) => {
    const matched = items.filter((i) => i.playbook === key);
    return {
      key,
      label: PLAYBOOK_LABELS[key],
      count: matched.length,
      totalMad: matched.reduce((sum, i) => sum + i.amountMad, 0),
    };
  });

  const avgCustomerHealth =
    items.length > 0 ? Math.round(items.reduce((sum, i) => sum + i.scores.customerHealthScore, 0) / items.length) : 0;
  const avgPaymentProbability =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.scores.paymentProbabilityScore, 0) / items.length)
      : 0;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Executive Dashboard" }]} />
      <KpiHeader totalOverdueMad={totalOverdueMad} dossierCount={items.length} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <div className="mb-6 flex gap-3 text-sm">
          <Link href="/cockpit" className="text-azur hover:underline">
            ← Action Center
          </Link>
          <Link href="/forecast" className="text-azur hover:underline">
            Cash Forecast →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-lavande-struct bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">
              Probabilité d&apos;encaissement moyenne
            </p>
            <p className="mt-1 text-3xl font-bold text-violet-velos">{avgPaymentProbability}%</p>
            <p className="text-xs text-graphite/50">Payment Probability Score, moyenne du portefeuille</p>
          </div>
          <div className="rounded-xl border border-lavande-struct bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">Santé client moyenne</p>
            <p className="mt-1 text-3xl font-bold text-violet-velos">{avgCustomerHealth}%</p>
            <p className="text-xs text-graphite/50">Customer Health Score, moyenne du portefeuille</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Portefeuille par playbook
          </h2>
          <p className="mb-3 text-xs text-graphite/50">
            Où se trouvent vos dossiers dans le parcours de recouvrement (§10 des specs).
          </p>
          <table className="w-full text-sm">
            <tbody>
              {byPlaybook.map((row) => (
                <tr key={row.key} className="border-t border-lavande-struct">
                  <td className="py-2 text-graphite">{row.label}</td>
                  <td className="py-2 text-right font-medium text-indigo-deep">{row.count} dossier(s)</td>
                  <td className="py-2 pl-4 text-right text-graphite/60">{row.totalMad.toLocaleString("fr-FR")} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
