import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppHeader } from "@/components/AppHeader";
import { PLAYBOOK_LABELS } from "@/lib/workflow";

export const dynamic = "force-dynamic";

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-corail/10 text-indigo-deep ring-corail/40",
  A_TRAITER: "bg-sky/15 text-azur ring-sky/40",
  SURVEILLANCE: "bg-lavande-struct text-graphite/70 ring-lavande-struct",
};

// §12.05 Customer 360 — vision complète du client : toutes ses factures, son
// historique d'interactions, sa santé relationnelle. Pas juste une facture isolée.
export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [client, settings] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        invoices: { include: { client: true, reminders: true, replies: true, callTasks: true, promises: true } },
      },
    }),
    getSettings(),
  ]);

  if (!client) notFound();

  const items = client.invoices.map((invoice) => buildWorklistItem(invoice, settings)).sort((a, b) => b.score - a.score);
  const totalOutstanding = items.reduce((sum, i) => sum + i.amountMad, 0);
  const avgHealth =
    items.length > 0 ? Math.round(items.reduce((s, i) => s + i.scores.customerHealthScore, 0) / items.length) : 100;
  const avgPaymentProbability =
    items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.scores.paymentProbabilityScore, 0) / items.length)
      : 100;
  const activity = buildActivityFeed(items, 30);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Vue client 360", href: "/customers" }, { label: client.name }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <div className="rounded-xl border border-lavande-struct bg-white p-5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-indigo-deep">{client.name}</h1>
            {client.strategic && <span className="text-violet-velos">★ Stratégique</span>}
            {client.chronicLatePayer && (
              <span className="rounded-full bg-corail/10 px-2 py-0.5 text-[11px] font-medium text-indigo-deep ring-1 ring-corail/30">
                Retardataire chronique
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-graphite/60">
            {client.sector} · {client.contactName} · {client.contactEmail || "email non renseigné"} ·{" "}
            {client.contactPhone || "téléphone non renseigné"}
          </p>
          <div className="mt-3 rounded-lg bg-perle p-3 text-sm text-graphite">{client.behaviorNote}</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-lavande-struct bg-white p-4 text-center">
            <p className="text-2xl font-bold text-indigo-deep">{totalOutstanding.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-graphite/50">MAD en cours ({items.length} facture(s))</p>
          </div>
          <div className="rounded-xl border border-lavande-struct bg-white p-4 text-center">
            <p className="text-2xl font-bold text-violet-velos">{avgHealth}%</p>
            <p className="text-xs text-graphite/50">Customer Health Score</p>
          </div>
          <div className="rounded-xl border border-lavande-struct bg-white p-4 text-center">
            <p className="text-2xl font-bold text-violet-velos">{avgPaymentProbability}%</p>
            <p className="text-xs text-graphite/50">Payment Probability</p>
          </div>
          <div className="rounded-xl border border-lavande-struct bg-white p-4 text-center">
            <p className="text-2xl font-bold text-indigo-deep">
              {items.filter((i) => i.promises.some((p) => p.status === "EN_COURS")).length}
            </p>
            <p className="text-xs text-graphite/50">Promesse(s) en cours</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Factures ({items.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.invoiceId}>
                <Link
                  href={`/dossiers/${item.invoiceId}`}
                  className="flex items-center justify-between rounded-lg border border-lavande-struct p-3 text-sm transition hover:border-violet-velos/40"
                >
                  <div>
                    <span className="font-medium text-indigo-deep">{item.reference}</span>
                    <span className="ml-2 text-xs text-graphite/50">{PLAYBOOK_LABELS[item.playbook]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-indigo-deep">{item.amountMad.toLocaleString("fr-FR")} MAD</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${PRIORITY_STYLES[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {items.length === 0 && <li className="text-sm text-graphite/40">Aucune facture pour ce client.</li>}
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Historique complet
          </h2>
          <p className="mb-2 text-xs text-graphite/50">Toutes les interactions, toutes factures confondues.</p>
          <ActivityFeed events={activity} />
        </div>
      </main>
    </div>
  );
}
