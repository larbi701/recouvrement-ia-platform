import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppHeader } from "@/components/AppHeader";
import { PortfolioAutopilot } from "@/components/PortfolioAutopilot";
import { PriorityActions } from "@/components/PriorityActions";
import { WorkQueueGrid } from "@/components/WorkQueues";

export const dynamic = "force-dynamic";

// §12.02 Action Center — "Que dois-je faire aujourd'hui ?" C'est la page d'accueil de
// l'application, volontairement une to-do list et pas un tableau de bord analytique
// (celui-là est sur l'Executive Dashboard, §12.01).
export default async function ActionCenter() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
      orderBy: { dueDate: "asc" },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings)).sort((a, b) => b.score - a.score);
  const activity = buildActivityFeed(items, 8);
  const pendingCount = items.filter(
    (i) => i.nextAction.kind === "EMAIL" || i.nextAction.kind === "WHATSAPP"
  ).length;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Action Center" }]} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-graphite/60">
            Que dois-je faire aujourd&apos;hui ?{" "}
            <Link href="/dashboard" className="text-azur hover:underline">
              Executive Dashboard →
            </Link>{" "}
            ·{" "}
            <Link href="/forecast" className="text-azur hover:underline">
              Cash Forecast →
            </Link>{" "}
            ·{" "}
            <Link href="/agents" className="text-azur hover:underline">
              Agent Hub →
            </Link>
          </p>
        </div>

        <PriorityActions items={items} />

        <div className="mt-6">
          <PortfolioAutopilot pendingCount={pendingCount} />
        </div>

        <div className="mt-8">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">Work Queues</h2>
          <p className="mb-3 text-xs text-graphite/50">
            Le même portefeuille, vu sous plusieurs angles — clique une file pour l&apos;ouvrir.
          </p>
          <WorkQueueGrid items={items} hitlAmountThreshold={settings.hitlAmountThreshold} />
        </div>

        <div className="mt-8 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">Activité de Yas</h2>
          <p className="mb-2 text-xs text-graphite/50">
            Ce que Yas (et l&apos;humain, en relais) vient de faire sur le portefeuille.
          </p>
          <ActivityFeed events={activity} />
        </div>
      </main>
    </div>
  );
}
