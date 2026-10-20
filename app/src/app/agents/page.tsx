import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { AppHeader } from "@/components/AppHeader";
import { EmergencyStop } from "@/components/AgentControls";
import { AGENT_ROSTER } from "@/lib/agents";
import { getAgentConfigs, isControllable } from "@/lib/agentConfig";

export const dynamic = "force-dynamic";

// Agents IA : qui fait quoi, et surtout la commande — suspendre un agent, régler son
// autonomie, couper tout en cas de doute. Chaque carte ouvre la fiche de l'agent.
export default async function AgentsPage() {
  const [invoices, settings, configs] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
    getAgentConfigs(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));
  const activity = buildActivityFeed(items, 100_000);
  const pendingValidation = items.filter(
    (i) => i.nextAction.kind === "LEGAL_TRANSFER" || ("requiresValidation" in i.nextAction && i.nextAction.requiresValidation)
  ).length;

  function statFor(key: string): { count: number; label: string } {
    switch (key) {
      case "PORTFOLIO_ANALYST":
        return { count: items.length, label: "dossiers scorés en continu" };
      case "CASH_FORECAST_ANALYST":
        return { count: 4, label: "horizons suivis (J+7/30/60/90)" };
      case "COLLECTION_SUPERVISOR":
        return { count: pendingValidation, label: "dossiers en attente de validation" };
      default:
        return { count: activity.filter((e) => e.agent === key).length, label: "actions journalisées" };
    }
  }

  const anyEnabled = Object.values(configs).some((c) => c.enabled);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Agents IA" }]} simulatedDate={settings.simulatedDate} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-indigo-deep">Agents IA</h1>
            <p className="mt-1 max-w-2xl text-sm text-graphite/60">
              Yas est le visage unique que vous voyez au quotidien ; en coulisses, 7 agents spécialisés collaborent. Trois font
              appel à l&apos;IA et se pilotent ici (suspension, autonomie). Les quatre autres sont des règles de calcul, toujours
              actives : c&apos;est une garantie.
            </p>
          </div>
          <EmergencyStop anyEnabled={anyEnabled} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_ROSTER.map((agent) => {
            const stat = statFor(agent.key);
            const cfg = isControllable(agent.key) ? configs[agent.key] : null;
            const suspended = cfg ? !cfg.enabled : false;
            return (
              <Link
                key={agent.key}
                href={`/agents/${agent.key}`}
                className={`rounded-xl border bg-white p-4 transition hover:border-violet-velos/50 ${suspended ? "border-corail/40" : "border-lavande-struct"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-deep to-violet-velos text-xs font-bold text-white">
                    {agent.initials}
                  </span>
                  {suspended ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-corail/10 px-2 py-0.5 text-[11px] font-medium text-indigo-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-corail" />
                      Suspendu
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-lavande px-2 py-0.5 text-[11px] font-medium text-indigo-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-velos" />
                      Actif
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-graphite/40">{agent.engine === "IA" ? "IA · pilotable" : "Calcul · toujours actif"}</span>
                </div>
                <h3 className="mt-2 font-bold text-indigo-deep">{agent.name}</h3>
                <p className="text-xs font-medium uppercase tracking-wide text-violet-velos">{agent.role}</p>
                <p className="mt-2 text-sm text-graphite/70">{agent.responsibility}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-indigo-deep">{stat.count}</p>
                    <p className="text-xs text-graphite/50">{stat.label}</p>
                  </div>
                  <span className="text-xs font-medium text-azur">Ouvrir la fiche →</span>
                </div>
                {cfg?.autonomy === "PROPOSE" && cfg.enabled && (
                  <p className="mt-2 text-[11px] font-medium text-azur">Mode « propose seulement » : tout passe par votre validation</p>
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
