import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { AppHeader } from "@/components/AppHeader";
import { DossierCards } from "@/components/DossierCards";
import { STAGES, type StageKey } from "@/components/Funnel";

export const dynamic = "force-dynamic";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const stageKey = (stage as StageKey) ?? null;
  const stageDef = STAGES.find((s) => s.key === stageKey) ?? null;

  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true, callTasks: true },
    orderBy: { dueDate: "asc" },
  });
  let items = invoices.map(buildWorklistItem).sort((a, b) => b.score - a.score);
  if (stageDef) items = items.filter(stageDef.match);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        breadcrumb={[
          { label: "Yasmine", href: "/" },
          { label: "Cockpit", href: "/cockpit" },
          { label: stageDef ? stageDef.label : "Tous les dossiers" },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {stageDef && <p className="mb-4 text-sm text-graphite/60">{stageDef.description}</p>}
        <DossierCards items={items} />
      </main>
    </div>
  );
}
