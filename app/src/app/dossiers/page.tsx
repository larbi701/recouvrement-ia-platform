import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { AppHeader } from "@/components/AppHeader";
import { TabbedDossierList } from "@/components/TabbedDossierList";
import type { StageKey } from "@/components/Funnel";

export const dynamic = "force-dynamic";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;

  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true, callTasks: true },
    orderBy: { dueDate: "asc" },
  });
  const items = invoices.map(buildWorklistItem).sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Cockpit", href: "/cockpit" }, { label: "Dossiers" }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <TabbedDossierList items={items} initialStage={(stage as StageKey) ?? null} />
      </main>
    </div>
  );
}
