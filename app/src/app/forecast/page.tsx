import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/AppHeader";
import { computeCashForecast } from "@/lib/forecast";

export const dynamic = "force-dynamic";

// §12.08 Cash Forecast — Inspiré HighRadius. Prévisions J+7/J+30/J+60/J+90, basées sur
// les promesses de paiement en cours et une estimation déterministe pour le reste.
export default async function CashForecastPage() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));
  const { horizons, contributions } = computeCashForecast(items);
  const maxMad = Math.max(...horizons.map((h) => h.cumulativeMad), 1);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Prévisions de trésorerie" }]} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <Link href="/cockpit" className="text-sm text-azur hover:underline">
          ← Centre d&apos;action
        </Link>

        <div className="mt-4 rounded-xl border border-lavande-struct bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Agent · Cash Forecast Analyst
          </h2>
          <p className="mb-4 text-xs text-graphite/50">
            Estimation déterministe (pas de machine learning) : promesses de paiement en cours en priorité, sinon un
            horizon de recouvrement typique par playbook pondéré par la probabilité d&apos;encaissement de chaque
            dossier.
          </p>

          <div className="flex items-end gap-6 pb-2 pt-4">
            {horizons.map((h) => (
              <div key={h.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-sm font-bold text-indigo-deep">{h.cumulativeMad.toLocaleString("fr-FR")}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-deep to-violet-velos"
                  style={{ height: `${Math.max(8, (h.cumulativeMad / maxMad) * 160)}px` }}
                />
                <span className="text-xs font-medium uppercase tracking-wide text-graphite/60">{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-lavande-struct bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Détail par dossier
          </h3>
          <ul className="flex flex-col gap-2">
            {contributions.map((c) => (
              <li key={c.invoiceId}>
                <Link
                  href={`/dossiers/${c.invoiceId}`}
                  className="flex items-center justify-between rounded-lg border border-lavande-struct p-2.5 text-sm transition hover:border-violet-velos/40"
                >
                  <div>
                    <span className="font-medium text-indigo-deep">{c.clientName}</span>
                    <span className="ml-2 rounded-full bg-lavande-struct px-2 py-0.5 text-[11px] text-graphite/70">
                      {c.basis === "promesse" ? "Promesse de paiement" : "Estimation"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-indigo-deep">{c.expectedMad.toLocaleString("fr-FR")} MAD</span>
                    <span className="ml-2 text-xs text-graphite/50">dans ~{c.expectedInDays} j</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
