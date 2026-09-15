import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { buildActivityFeed } from "@/lib/activity";
import { KpiHeader } from "@/components/KpiHeader";
import { Funnel } from "@/components/Funnel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function Cockpit() {
  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true, callTasks: true },
    orderBy: { dueDate: "asc" },
  });
  const items = invoices.map(buildWorklistItem).sort((a, b) => b.score - a.score);
  const totalOverdueMad = items.reduce((sum, i) => sum + i.amountMad, 0);
  const activity = buildActivityFeed(items, 8);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yasmine", href: "/" }, { label: "Cockpit" }]} />
      <KpiHeader totalOverdueMad={totalOverdueMad} dossierCount={items.length} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <div className="pt-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Où en sont vos dossiers
          </h2>
          <p className="mb-3 text-xs text-graphite/50">
            Clique sur un niveau pour voir les dossiers concernés — du parcours automatique au plus critique.
          </p>
          <Funnel items={items} />
        </div>

        <div className="mt-8 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Activité de Yasmine
          </h2>
          <p className="mb-2 text-xs text-graphite/50">
            Ce que Yasmine (et l&apos;humain, en relais) vient de faire sur le portefeuille.
          </p>
          <ActivityFeed events={activity} />
        </div>
      </main>
    </div>
  );
}
