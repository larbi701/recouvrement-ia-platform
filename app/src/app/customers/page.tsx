import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

// §12.05 Customer 360 — liste. Le portefeuille vu par client plutôt que par facture :
// utile dès qu'un client a plusieurs factures (après un import notamment).
export default async function CustomersPage() {
  const [clients, settings] = await Promise.all([
    prisma.client.findMany({
      include: {
        invoices: { include: { client: true, reminders: true, replies: true, callTasks: true, promises: true } },
      },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);

  const rows = clients.map((client) => {
    const items = client.invoices.map((invoice) => buildWorklistItem(invoice, settings));
    const totalOutstanding = items.reduce((sum, i) => sum + i.amountMad, 0);
    const avgHealth =
      items.length > 0 ? Math.round(items.reduce((s, i) => s + i.scores.customerHealthScore, 0) / items.length) : 100;
    const needsAttention = items.some(
      (i) => i.priority === "URGENT" || i.playbook === "PRE_LEGAL" || i.playbook === "LEGAL_TRANSFER"
    );
    return { client, invoiceCount: items.length, totalOutstanding, avgHealth, needsAttention };
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Customer 360" }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <ul className="flex flex-col gap-2">
          {rows.map(({ client, invoiceCount, totalOutstanding, avgHealth, needsAttention }) => (
            <li key={client.id}>
              <Link
                href={`/customers/${client.id}`}
                className="flex items-center justify-between rounded-xl border border-lavande-struct bg-white p-4 transition hover:border-violet-velos/40"
              >
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium text-indigo-deep">
                      {client.name} {client.strategic && <span className="text-violet-velos">★</span>}
                    </p>
                    <p className="text-xs text-graphite/50">
                      {client.sector} · {invoiceCount} facture(s)
                      {needsAttention && (
                        <span className="ml-2 rounded-full bg-corail/10 px-2 py-0.5 text-[11px] font-medium text-indigo-deep ring-1 ring-corail/30">
                          Attention requise
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-deep">{totalOutstanding.toLocaleString("fr-FR")} MAD</p>
                  <p className="text-xs text-graphite/50">Santé client : {avgHealth}%</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
