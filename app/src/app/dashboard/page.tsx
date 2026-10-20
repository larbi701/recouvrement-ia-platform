import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { buildActivityFeed } from "@/lib/activity";
import { computeCashForecast } from "@/lib/forecast";
import { AppHeader } from "@/components/AppHeader";
import { PLAYBOOK_LABELS, type PlaybookKey } from "@/lib/workflow";

export const dynamic = "force-dynamic";

const PLAYBOOK_ORDER: PlaybookKey[] = ["PRE_DUE", "EARLY", "STANDARD", "INTENSIVE", "PRE_LEGAL", "LEGAL_TRANSFER"];

// Minutes de travail humain évitées, par tâche réalisée par un agent (hypothèses affichées
// telles quelles dans l'écran : c'est une estimation, pas une mesure).
const MIN_PER_MESSAGE = 10;
const MIN_PER_CALL_SHEET = 15;
const MIN_PER_REPLY = 5;

type Tile = { label: string; value: string; hint: string; href?: string; tag?: string };

function TileCard({ tile }: { tile: Tile }) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-graphite/60">{tile.label}</span>
        {tile.tag && (
          <span className="rounded-full bg-lavande px-2 py-0.5 text-[10px] font-medium text-indigo-deep">{tile.tag}</span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-violet-velos">{tile.value}</p>
      <p className="text-xs text-graphite/50">{tile.hint}</p>
    </>
  );
  const cls = "rounded-xl border border-lavande-struct bg-white p-4";
  return tile.href ? (
    <Link href={tile.href} className={`${cls} transition hover:border-violet-velos/50`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// Le Pilotage : la synthèse qu'un dirigeant ou un DAF lit en une minute. Tout est calculé
// sur les données réelles de la base, sauf le DSO (étiqueté "Simulation") qui demande
// l'historique complet des paiements.
export default async function PilotagePage() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));
  const overdue = items.filter((i) => i.daysOverdue > 0);
  const overdueMad = overdue.reduce((s, i) => s + i.amountMad, 0);
  const weightedDelay = overdueMad > 0 ? Math.round(overdue.reduce((s, i) => s + i.amountMad * i.daysOverdue, 0) / overdueMad) : 0;

  const allPromises = items.flatMap((i) => i.promises);
  const kept = allPromises.filter((p) => p.status === "TENUE");
  const broken = allPromises.filter((p) => p.status === "ROMPUE");
  const active = allPromises.filter((p) => p.status === "EN_COURS");
  const securedMad = kept.reduce((s, p) => s + p.amountMad, 0);
  const activeMad = active.reduce((s, p) => s + p.amountMad, 0);
  const keptRate = kept.length + broken.length > 0 ? Math.round((kept.length / (kept.length + broken.length)) * 100) : null;

  const activity = buildActivityFeed(items, 100_000);
  const agentActions = activity.filter((e) => e.actor === "AGENT").length;
  const humanActions = activity.length - agentActions;
  const automationRate = activity.length > 0 ? Math.round((agentActions / activity.length) * 100) : null;

  const agentMessages = items.flatMap((i) => i.reminders).filter((r) => r.createdBy === "AGENT").length;
  const callSheets = items.flatMap((i) => i.callTasks).length;
  const replies = items.flatMap((i) => i.replies).length;
  const savedMinutes = agentMessages * MIN_PER_MESSAGE + callSheets * MIN_PER_CALL_SHEET + replies * MIN_PER_REPLY;
  const savedHours = Math.round((savedMinutes / 60) * 10) / 10;

  const draftCount = items.reduce((s, i) => s + i.drafts.length, 0);
  const blockedCount = items.reduce((s, i) => s + i.drafts.filter((d) => d.note).length, 0);
  const pendingCalls = items.filter((i) => i.callTasks.some((c) => c.status === "A_FAIRE")).length;
  const unhandledReplies = items.reduce((s, i) => s + i.replies.filter((r) => !r.handled).length, 0);
  const brokenToCall = items.filter((i) =>
    i.promises.some((p) => p.status === "EN_COURS" && new Date(p.promisedDate).getTime() < settings.simulatedDate.getTime())
  ).length;
  const toValidate = items.filter(
    (i) => i.nextAction.kind === "LEGAL_TRANSFER" || ("requiresValidation" in i.nextAction && i.nextAction.requiresValidation)
  ).length;

  const { horizons, contributions } = computeCashForecast(items, settings.simulatedDate);
  const maxForecast = Math.max(...horizons.map((h) => h.cumulativeMad), 1);

  const byPlaybook = PLAYBOOK_ORDER.map((key) => {
    const matched = items.filter((i) => i.playbook === key);
    return { key, count: matched.length, totalMad: matched.reduce((s, i) => s + i.amountMad, 0) };
  });
  const maxPlaybookMad = Math.max(...byPlaybook.map((p) => p.totalMad), 1);
  const watch = items.slice().sort((a, b) => b.score - a.score).slice(0, 5);

  const todo: Tile[] = [
    { label: "Messages à valider", value: String(draftCount), hint: blockedCount ? `dont ${blockedCount} retenu(s) par le garde-fou` : "brouillons préparés par Yas", href: "/messages" },
    { label: "Réponses clients à traiter", value: String(unhandledReplies), hint: "demandes de délai, litiges", href: "/messages?tab=replies" },
    { label: "Appels à passer", value: String(pendingCalls), hint: "fiches préparées par Yas", href: "/cockpit" },
    { label: "Dossiers à valider", value: String(toValidate), hint: "montant, compte stratégique, pré-contentieux", href: "/portfolio?queue=validation" },
  ];

  const results: Tile[] = [
    { label: "Encours en retard", value: `${overdueMad.toLocaleString("fr-FR")} MAD`, hint: `${overdue.length} facture(s) échue(s) sur ${items.length}`, href: "/portfolio" },
    { label: "Retard moyen pondéré", value: `${weightedDelay} jours`, hint: "pondéré par le montant de chaque facture" },
    { label: "Cash sécurisé", value: `${securedMad.toLocaleString("fr-FR")} MAD`, hint: `${kept.length} promesse(s) de paiement tenue(s)`, href: "/portfolio?queue=promises" },
    { label: "Promesses en cours", value: `${activeMad.toLocaleString("fr-FR")} MAD`, hint: `${active.length} engagement(s) à échéance à venir`, href: "/portfolio?queue=promises" },
    { label: "Promesses tenues", value: keptRate === null ? "—" : `${keptRate}%`, hint: `${kept.length} tenue(s) · ${broken.length} rompue(s)` },
    { label: "Délai de paiement (DSO)", value: "125 → 82 jours", hint: "-34% avec l'automatisation", tag: "Simulation" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Pilotage" }]} simulatedDate={settings.simulatedDate} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <h1 className="mb-1 text-xl font-bold text-indigo-deep">Pilotage</h1>
        <p className="mb-6 text-sm text-graphite/60">
          La synthèse en une minute : ce qui attend l&apos;équipe, ce que le recouvrement a rapporté, ce que Yas a fait seule et
          ce qui devrait rentrer.
        </p>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-graphite/60">À faire maintenant</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {todo.map((t) => (
            <TileCard key={t.label} tile={t} />
          ))}
        </div>

        <h2 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-graphite/60">Résultats</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <TileCard key={t.label} tile={t} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-lavande-struct bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">Travail de Yas</h2>
            {automationRate !== null && (
              <>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs text-graphite/60">Part traitée sans intervention humaine</span>
                  <span className="text-3xl font-bold text-violet-velos">{automationRate}%</span>
                </div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-lavande-struct">
                  <div className="bg-violet-velos" style={{ width: `${automationRate}%` }} />
                  <div className="bg-azur" style={{ width: `${100 - automationRate}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-graphite/50">
                  {agentActions} action(s) des agents IA · {humanActions} intervention(s) humaine(s)
                </p>
              </>
            )}
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-lavande-struct pt-4 text-center">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-graphite/50">Messages rédigés</dt>
                <dd className="text-xl font-bold text-indigo-deep">{agentMessages}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-graphite/50">Fiches d&apos;appel</dt>
                <dd className="text-xl font-bold text-indigo-deep">{callSheets}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-graphite/50">Temps économisé</dt>
                <dd className="text-xl font-bold text-indigo-deep">{savedHours.toLocaleString("fr-FR")} h</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-graphite/40">
              Estimation : {MIN_PER_MESSAGE} min par message rédigé, {MIN_PER_CALL_SHEET} min par fiche d&apos;appel, {MIN_PER_REPLY} min par
              réponse client classée.
            </p>
          </div>

          <div className="rounded-xl border border-lavande-struct bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">Encaissements attendus</h2>
            <div className="flex items-end gap-5 pb-2 pt-4">
              {horizons.map((h) => (
                <div key={h.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-deep">{h.cumulativeMad.toLocaleString("fr-FR")}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-indigo-deep to-violet-velos"
                    style={{ height: `${Math.max(6, (h.cumulativeMad / maxForecast) * 110)}px` }}
                  />
                  <span className="text-xs font-medium uppercase tracking-wide text-graphite/60">{h.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-graphite/40">
              Cumul en MAD. Promesses en cours d&apos;abord, sinon horizon du playbook pondéré par la probabilité de paiement
              ({contributions.filter((c) => c.basis === "promesse").length} promesse(s), {contributions.filter((c) => c.basis === "estimation").length} estimation(s)).
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-lavande-struct bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">Portefeuille par étape</h2>
            <p className="mb-3 mt-0.5 text-xs text-graphite/50">Où en sont vos dossiers dans le parcours de recouvrement. Cliquez une étape pour la filtrer.</p>
            <ul className="flex flex-col gap-2.5">
              {byPlaybook.map((row) => (
                <li key={row.key}>
                  <Link href={`/portfolio?playbook=${row.key}`} className="block rounded-lg p-1.5 hover:bg-perle">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-graphite">{PLAYBOOK_LABELS[row.key]}</span>
                      <span className="font-medium text-indigo-deep">
                        {row.count} · {row.totalMad.toLocaleString("fr-FR")} MAD
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lavande-struct">
                      <div className="h-full rounded-full bg-violet-velos" style={{ width: `${(row.totalMad / maxPlaybookMad) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-lavande-struct bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">À surveiller</h2>
            <p className="mb-3 mt-0.5 text-xs text-graphite/50">Les 5 dossiers au score de priorité le plus élevé.</p>
            <ul className="flex flex-col">
              {watch.map((i) => (
                <li key={i.invoiceId} className="border-t border-lavande-struct first:border-0">
                  <Link href={`/dossiers/${i.invoiceId}`} className="flex items-center justify-between gap-3 py-2 hover:bg-perle">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-indigo-deep">{i.clientName}</p>
                      <p className="truncate text-xs text-graphite/50">{i.reasoning}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-indigo-deep">{i.amountMad.toLocaleString("fr-FR")} MAD</p>
                      <p className="text-[11px] text-graphite/50">score {i.score}/100</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {brokenToCall > 0 && <p className="mt-2 text-xs text-corail">{brokenToCall} promesse(s) échue(s) à clarifier par téléphone.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
