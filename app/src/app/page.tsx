import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

const CAPABILITIES = [
  {
    icon: "🧭",
    title: "Analyse & priorise",
    description:
      "Calcule un score de risque sur chaque facture en retard (ancienneté, montant, historique) et construit la liste à traiter aujourd'hui — sans qu'un humain ait à trier manuellement.",
  },
  {
    icon: "✉️",
    title: "Rédige les relances",
    description:
      "Email ou WhatsApp selon la situation, ton amical puis ferme puis dernier avertissement — jamais un template générique, toujours le bon contexte client.",
  },
  {
    icon: "📞",
    title: "Prépare les appels",
    description:
      "Quand un contact humain est plus efficace (client stratégique, silence prolongé), elle prépare la fiche d'appel et crée la tâche — l'humain appelle, elle garde la trace.",
  },
  {
    icon: "🧠",
    title: "Traite les réponses",
    description:
      "Classe l'intention du client (demande de délai, contestation, confirmation), résume, et propose une action — sans jamais relancer automatiquement en cas de litige.",
  },
];

// Même ordre que la navigation (AppHeader) : du plus général au plus particulier. Chaque
// entrée explique aussi ce qu'elle apporte à la suivante, pour que l'articulation entre
// écrans soit claire avant même d'y mettre les pieds.
const NAV_GUIDE = [
  {
    href: "/import",
    icon: "📥",
    name: "Importer",
    tag: "Point de départ",
    description: "On alimente Yas avec la balance âgée (Excel/CSV). Chaque facture importée est aussitôt scorée.",
    feeds: "Alimente tous les écrans qui suivent.",
  },
  {
    href: "/dashboard",
    icon: "📊",
    name: "Executive Dashboard",
    tag: "01 · Vue la plus large",
    description: "Combien d'argent est en retard, réparti par étape du recouvrement — pour prendre du recul.",
    feeds: "Donne le contexte avant de passer à l'action.",
  },
  {
    href: "/cockpit",
    icon: "✅",
    name: "Action Center",
    tag: "02 · Le cœur de l'appli",
    description: "Ce que Yas recommande de faire aujourd'hui, priorité par priorité. C'est ici qu'on revient le plus souvent.",
    feeds: "Renvoie vers un dossier précis, ou vers les Work Queues pour trier autrement.",
  },
  {
    href: "/dossiers",
    icon: "🗂️",
    name: "Work Queues",
    tag: "03 · Le portefeuille segmenté",
    description: "Le même portefeuille découpé par type de situation (urgent, gros montant, litige, à valider…).",
    feeds: "Chaque file mène directement aux dossiers concernés (Collection Case).",
  },
  {
    href: "/portfolio",
    icon: "📋",
    name: "Portefeuille",
    tag: "04 · La liste complète",
    description: "Toutes les factures, brutes, triables — pour chercher un dossier précis ou une vue exhaustive.",
    feeds: "Utile en complément des Work Queues quand on sait déjà ce qu'on cherche.",
  },
  {
    href: "/customers",
    icon: "🏢",
    name: "Customer 360",
    tag: "05 · Zoom client",
    description: "Toutes les factures d'un même client, tout son historique, en un seul endroit.",
    feeds: "Pertinent dès qu'un client a plusieurs factures en cours.",
  },
  {
    href: "/forecast",
    icon: "📈",
    name: "Cash Forecast",
    tag: "08 · La projection",
    description: "Combien Yas anticipe de récupérer à J+7/30/60/90, à partir des promesses et des probabilités de paiement.",
    feeds: "Se met à jour dès qu'une promesse ou un paiement change de statut.",
  },
  {
    href: "/agents",
    icon: "🤖",
    name: "Agent Hub",
    tag: "07 · Les coulisses de Yas",
    description: "Qui, parmi les 7 agents IA, a fait quoi — la transparence sur le travail réellement effectué.",
    feeds: "Le pendant IA de la Performance équipe, côté humain.",
  },
  {
    href: "/team",
    icon: "👥",
    name: "Performance équipe",
    tag: "09 · Le miroir humain",
    description: "Ce que l'équipe a traité elle-même : appels passés, promesses obtenues, validations rendues.",
    feeds: "Se lit en regard de l'Agent Hub pour voir la répartition IA / humain.",
  },
  {
    href: "/settings",
    icon: "⚙️",
    name: "Paramètres",
    tag: "10 · Les règles du jeu",
    description: "À partir de quel montant valider soi-même, où placer les frontières entre les étapes du recouvrement.",
    feeds: "Change ici, et tout le moteur de décision s'ajuste immédiatement, partout.",
  },
];

export default async function Presentation() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));
  const totalOverdueMad = items.reduce((sum, i) => sum + i.amountMad, 0);
  const totalActions = items.reduce(
    (sum, i) => sum + i.reminders.length + i.callTasks.length + i.replies.length,
    0
  );

  const stats = [
    { label: "Dossiers sous gestion", value: items.length.toString() },
    { label: "MAD en retard suivis", value: `${totalOverdueMad.toLocaleString("fr-FR")}` },
    { label: "Actions menées par Yas", value: totalActions.toString() },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-16">
        <div className="flex flex-col items-center pt-12 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-deep to-violet-velos text-4xl font-bold text-white">
            Y
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-lavande px-2.5 py-1 text-xs font-medium text-indigo-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-velos" />
              En ligne
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-corail">
              Agent recouvrement — CASH · VELOS IA
            </span>
          </div>

          <h1 className="mt-3 text-5xl font-bold tracking-tight text-indigo-deep">Yas</h1>

          <p className="mt-3 max-w-xl text-lg text-graphite/80">
            Relances email et WhatsApp, fiches d&apos;appel, réponses client classées — le recouvrement amiable B2B,
            du premier rappel au dernier avertissement.
          </p>

          <p className="mt-3 max-w-lg text-sm text-graphite/60">
            Calibrée sur le marché marocain (délais de paiement, plafond légal de 120 jours — loi 69-21), elle
            travaille 24/7 sur tout le portefeuille pendant que l&apos;équipe se concentre sur les appels et les
            négociations qui comptent vraiment.
          </p>

          <Link
            href="/cockpit"
            className="mt-8 rounded-lg bg-indigo-deep px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Voir Yas au travail →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-lavande-struct bg-white p-4 text-center">
              <p className="text-2xl font-bold text-violet-velos">{stat.value}</p>
              <p className="text-xs text-graphite/60">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Ce qu&apos;elle sait faire
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className="rounded-xl border border-lavande-struct bg-white p-4">
                <div className="mb-2 text-2xl">{cap.icon}</div>
                <h3 className="mb-1 font-semibold text-indigo-deep">{cap.title}</h3>
                <p className="text-sm text-graphite/70">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-1 text-center text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Comment se repérer dans l&apos;application
          </h2>
          <p className="mb-6 text-center text-xs text-graphite/50">
            Dix écrans, du plus général au plus particulier — chacun s&apos;articule avec le suivant.
          </p>
          <ol className="relative flex flex-col gap-1">
            {NAV_GUIDE.map((step, i) => (
              <li key={step.href} className="relative flex gap-4 pb-1">
                {i < NAV_GUIDE.length - 1 && (
                  <span className="absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px bg-lavande-struct" aria-hidden />
                )}
                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavande text-lg">
                  {step.icon}
                </div>
                <Link
                  href={step.href}
                  className="flex-1 rounded-xl border border-lavande-struct bg-white p-3 transition hover:border-violet-velos/40"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-indigo-deep">{step.name}</span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-violet-velos">
                      {step.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-graphite/70">{step.description}</p>
                  <p className="mt-1 text-xs text-azur">→ {step.feeds}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
