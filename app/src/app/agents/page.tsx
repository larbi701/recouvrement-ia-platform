import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { AppHeader } from "@/components/AppHeader";
import { AGENT_ROSTER } from "@/lib/agents";

export const dynamic = "force-dynamic";

// §12.07 Agent Hub — vue temps réel des agents IA, la preuve visuelle du "Digital Workforce"
// (§3 des specs) : chaque agent a un rôle, une responsabilité, et une activité mesurable.
export default async function AgentHubPage() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));
  const activity = buildActivityFeed(items, 500);

  const pendingValidationCount = items.filter(
    (i) => i.nextAction.kind === "LEGAL_TRANSFER" || ("requiresValidation" in i.nextAction && i.nextAction.requiresValidation)
  ).length;

  function statFor(key: string): { count: number; label: string } {
    switch (key) {
      case "PORTFOLIO_ANALYST":
        return { count: items.length, label: "dossiers scorés en continu" };
      case "CASH_FORECAST_ANALYST":
        return { count: 4, label: "horizons suivis (J+7/30/60/90)" };
      case "COLLECTION_SUPERVISOR":
        return { count: pendingValidationCount, label: "dossiers en attente de validation" };
      default:
        return { count: activity.filter((e) => e.agent === key).length, label: "actions journalisées" };
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Agent Hub" }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <p className="mb-4 text-sm text-graphite/60">
          Yas est le visage unique que vous voyez au quotidien — en coulisses, 7 agents spécialisés collaborent via
          un orchestrateur central.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_ROSTER.map((agent) => {
            const stat = statFor(agent.key);
            return (
              <div key={agent.key} className="rounded-xl border border-lavande-struct bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{agent.icon}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-lavande px-2 py-0.5 text-[11px] font-medium text-indigo-deep">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-velos" />
                    Actif
                  </span>
                </div>
                <h3 className="mt-2 font-bold text-indigo-deep">{agent.name}</h3>
                <p className="text-xs font-medium uppercase tracking-wide text-violet-velos">{agent.role}</p>
                <p className="mt-2 text-sm text-graphite/70">{agent.responsibility}</p>
                <p className="mt-3 text-2xl font-bold text-indigo-deep">{stat.count}</p>
                <p className="text-xs text-graphite/50">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
