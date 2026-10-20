import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/AppHeader";
import { PortfolioTable } from "@/components/PortfolioTable";
import { QUEUE_KEYS, type QueueKey } from "@/components/WorkQueues";
import type { PlaybookKey } from "@/lib/workflow";

export const dynamic = "force-dynamic";

const PLAYBOOKS: PlaybookKey[] = ["PRE_DUE", "EARLY", "STANDARD", "INTENSIVE", "PRE_LEGAL", "LEGAL_TRANSFER"];

// Le portefeuille : UNE liste de toutes les factures, avec les catégories de lecture
// (urgent, gros montants, litiges, à valider…) en filtres, des actions groupées et un export.
export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string; playbook?: string }>;
}) {
  const { queue, playbook } = await searchParams;
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Portefeuille" }]} simulatedDate={settings.simulatedDate} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <h1 className="mb-1 text-xl font-bold text-indigo-deep">Portefeuille</h1>
        <p className="mb-5 text-sm text-graphite/60">
          Toutes les factures, filtrables par situation. Cochez des dossiers pour demander à Yas de préparer les relances
          en lot, ou exportez la vue en CSV.
        </p>
        <PortfolioTable
          items={items}
          hitlAmountThreshold={settings.hitlAmountThreshold}
          initialQueue={QUEUE_KEYS.includes(queue as QueueKey) ? (queue as QueueKey) : null}
          initialPlaybook={PLAYBOOKS.includes(playbook as PlaybookKey) ? (playbook as PlaybookKey) : null}
        />
      </main>
    </div>
  );
}
