import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { getAgentConfigs } from "@/lib/agentConfig";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppHeader } from "@/components/AppHeader";
import { PortfolioAutopilot } from "@/components/PortfolioAutopilot";
import { PriorityActions } from "@/components/PriorityActions";
import { WorkQueueGrid } from "@/components/WorkQueues";

export const dynamic = "force-dynamic";

// Centre d'action — "Que dois-je faire aujourd'hui ?" La to-do list du jour : les actions que
// Yas recommande, ce qu'elle peut traiter seule, et ce qui attend l'équipe (validations,
// appels, réponses clients). Les indicateurs d'analyse sont dans le Pilotage.
export default async function ActionCenter() {
  const [invoices, settings, agents] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
      orderBy: { dueDate: "asc" },
    }),
    getSettings(),
    getAgentConfigs(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings)).sort((a, b) => b.score - a.score);
  const activity = buildActivityFeed(items, 8);
  const autoEligible = items.filter(
    (i) => (i.nextAction.kind === "EMAIL" || i.nextAction.kind === "WHATSAPP") && !i.nextAction.requiresValidation && i.drafts.length === 0
  ).length;

  const drafts = items.reduce((s, i) => s + i.drafts.length, 0);
  const unhandled = items.reduce((s, i) => s + i.replies.filter((r) => !r.handled).length, 0);
  const calls = items.filter((i) => i.callTasks.some((c) => c.status === "A_FAIRE") || i.nextAction.kind === "CALL_TASK");
  const team = [
    { label: "Messages à valider", value: drafts, href: "/messages", hint: "préparés par Yas" },
    { label: "Réponses clients à traiter", value: unhandled, href: "/messages?tab=replies", hint: "délais, litiges" },
    { label: "Appels à passer", value: calls.length, href: "#appels", hint: "fiches de Yas" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Centre d'action" }]} simulatedDate={settings.simulatedDate} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <h1 className="mb-1 text-xl font-bold text-indigo-deep">Centre d&apos;action</h1>
        <p className="mb-5 text-sm text-graphite/60">
          Que dois-je faire aujourd&apos;hui ? Les indicateurs d&apos;ensemble sont dans le{" "}
          <Link href="/dashboard" className="text-azur hover:underline">
            Pilotage
          </Link>
          .
        </p>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {team.map((t) => (
            <Link key={t.label} href={t.href} className="rounded-xl border border-lavande-struct bg-white p-4 transition hover:border-violet-velos/50">
              <p className="text-[11px] font-medium uppercase tracking-wide text-graphite/60">{t.label}</p>
              <p className={`mt-1 text-3xl font-bold ${t.value > 0 ? "text-corail" : "text-indigo-deep"}`}>{t.value}</p>
              <p className="text-xs text-graphite/50">{t.hint}</p>
            </Link>
          ))}
        </div>

        <div id="appels">
          <PriorityActions items={items} />
        </div>

        <div className="mt-6">
          <PortfolioAutopilot
            pendingCount={autoEligible}
            suspended={!agents.COMMUNICATION_SPECIALIST.enabled}
            proposeOnly={agents.COMMUNICATION_SPECIALIST.autonomy === "PROPOSE"}
          />
        </div>

        <div className="mt-8">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">Le portefeuille sous plusieurs angles</h2>
          <p className="mb-3 text-xs text-graphite/50">Cliquez une catégorie pour ouvrir la liste filtrée dans le Portefeuille.</p>
          <WorkQueueGrid items={items} hitlAmountThreshold={settings.hitlAmountThreshold} />
        </div>

        <div className="mt-8 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">Activité de Yas</h2>
          <p className="mb-2 text-xs text-graphite/50">Ce que Yas (et l&apos;humain, en relais) vient de faire sur le portefeuille.</p>
          <ActivityFeed events={activity} now={settings.simulatedDate} />
        </div>
      </main>
    </div>
  );
}
