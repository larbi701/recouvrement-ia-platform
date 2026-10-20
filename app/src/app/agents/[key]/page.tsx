import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppHeader } from "@/components/AppHeader";
import { AgentControls } from "@/components/AgentControls";
import { AGENT_ROSTER } from "@/lib/agents";
import { getAgentConfigs, isControllable } from "@/lib/agentConfig";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const agent = AGENT_ROSTER.find((a) => a.key === key);
  if (!agent) notFound();

  const [invoices, settings, configs] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
    getAgentConfigs(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));
  const mine = buildActivityFeed(items, 100_000).filter((e) => e.agent === agent.key);
  const cfg = isControllable(agent.key) ? configs[agent.key] : null;

  // Chiffres propres à chaque agent, tous calculés sur les données réelles.
  const sent = items.flatMap((i) => i.reminders).filter((r) => r.createdBy === "AGENT").length;
  const approved = items.flatMap((i) => i.reminders).filter((r) => r.createdBy === "HUMAIN").length;
  const drafts = items.reduce((s, i) => s + i.drafts.length, 0);
  const blocked = items.reduce((s, i) => s + i.drafts.filter((d) => d.note).length, 0);
  const callSheets = items.flatMap((i) => i.callTasks).length;
  const replies = items.flatMap((i) => i.replies);
  const disputes = replies.filter((r) => r.classifiedIntent === "CONTESTATION").length;
  const promises = items.flatMap((i) => i.promises);

  const stats: { label: string; value: string | number }[] =
    agent.key === "COMMUNICATION_SPECIALIST"
      ? [
          { label: "Messages envoyés seuls", value: sent },
          { label: "Messages validés par un humain", value: approved },
          { label: "Brouillons en attente", value: drafts },
          { label: "Retenus par le garde-fou", value: blocked },
        ]
      : agent.key === "COLLECTION_STRATEGIST"
      ? [
          { label: "Fiches d'appel préparées", value: callSheets },
          { label: "Appels traités par l'équipe", value: items.flatMap((i) => i.callTasks).filter((c) => c.status === "FAIT").length },
          { label: "Fiches en attente", value: items.flatMap((i) => i.callTasks).filter((c) => c.status === "A_FAIRE").length },
        ]
      : agent.key === "DISPUTE_SPECIALIST"
      ? [
          { label: "Réponses classées", value: replies.length },
          { label: "Contestations détectées", value: disputes },
          { label: "Réponses à traiter", value: replies.filter((r) => !r.handled).length },
        ]
      : agent.key === "PROMISE_MANAGER"
      ? [
          { label: "Promesses suivies", value: promises.length },
          { label: "En cours", value: promises.filter((p) => p.status === "EN_COURS").length },
          { label: "Tenues", value: promises.filter((p) => p.status === "TENUE").length },
          { label: "Rompues", value: promises.filter((p) => p.status === "ROMPUE").length },
        ]
      : agent.key === "COLLECTION_SUPERVISOR"
      ? [
          { label: "Dossiers à valider", value: items.filter((i) => i.nextAction.kind === "LEGAL_TRANSFER" || ("requiresValidation" in i.nextAction && i.nextAction.requiresValidation)).length },
          { label: "Messages retenus par le garde-fou", value: blocked },
          { label: "Seuil de validation", value: `${settings.hitlAmountThreshold.toLocaleString("fr-FR")} MAD` },
        ]
      : agent.key === "CASH_FORECAST_ANALYST"
      ? [
          { label: "Horizons suivis", value: 4 },
          { label: "Promesses utilisées", value: promises.filter((p) => p.status === "EN_COURS").length },
        ]
      : [
          { label: "Dossiers scorés", value: items.length },
          { label: "Score moyen", value: items.length ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length) : 0 },
          { label: "Dossiers urgents", value: items.filter((i) => i.priority === "URGENT").length },
        ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        breadcrumb={[{ label: "Yas", href: "/" }, { label: "Agents IA", href: "/agents" }, { label: agent.name }]}
        simulatedDate={settings.simulatedDate}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-deep to-violet-velos text-sm font-bold text-white">
            {agent.initials}
          </span>
          <div>
            <h1 className="text-xl font-bold text-indigo-deep">{agent.name}</h1>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-velos">
              {agent.role} · {agent.engine === "IA" ? "fait appel à l'IA" : "règle de calcul, toujours active"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-graphite/70">{agent.responsibility}</p>

        <div className="mt-5">
          {cfg ? (
            <AgentControls agentKey={agent.key} enabled={cfg.enabled} autonomy={cfg.autonomy} showAutonomy={agent.key === "COMMUNICATION_SPECIALIST"} />
          ) : (
            <div className="rounded-xl border border-lavande-struct bg-white p-4 text-sm text-graphite/70">
              Cet agent est un calcul du moteur : il tourne en permanence et ne se suspend pas. C&apos;est volontaire — il garantit
              que les règles de priorité, de validation et de contrôle s&apos;appliquent toujours.
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-lavande-struct bg-white p-3 text-center">
              <p className="text-xl font-bold text-indigo-deep">{s.value}</p>
              <p className="text-[11px] uppercase tracking-wide text-graphite/50">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-lavande-struct bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite/60">Ce qu&apos;il fait</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-graphite/80">
              {agent.does.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-corail/30 bg-corail/5 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite/60">Ce qu&apos;il ne fait jamais</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-graphite/80">
              {agent.never.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 text-sm">
          <Link href={agent.where.href} className="font-medium text-azur hover:underline">
            {agent.where.label} →
          </Link>
        </p>

        <div className="mt-5 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">Journal de l&apos;agent</h2>
          <p className="mb-2 text-xs text-graphite/50">Ses dernières actions sur le portefeuille, de la plus récente à la plus ancienne.</p>
          <ActivityFeed events={mine.slice(0, 15)} now={settings.simulatedDate} />
        </div>
      </main>
    </div>
  );
}
