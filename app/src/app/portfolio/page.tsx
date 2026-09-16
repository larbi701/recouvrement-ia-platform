import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/AppHeader";
import { PortfolioTable } from "@/components/PortfolioTable";

export const dynamic = "force-dynamic";

// §12.04 Portefeuille — la grille complète, brute, triable (inspirée Growfin). Les Work
// Queues restent le point d'entrée quotidien ; cet écran sert à chercher un dossier
// précis ou avoir une vue exhaustive triable par colonne.
export default async function PortfolioPage() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
  ]);
  const items = invoices.map((invoice) => buildWorklistItem(invoice, settings));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Portefeuille" }]} simulatedDate={settings.simulatedDate} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <PortfolioTable items={items} />
      </main>
    </div>
  );
}
