import { prisma } from "@/lib/prisma";
import { computeRiskScore } from "@/lib/scoring";
import type { WorklistItem } from "@/lib/types";
import { KpiHeader } from "@/components/KpiHeader";
import { Worklist } from "@/components/Worklist";

export const dynamic = "force-dynamic";

async function getWorklist(): Promise<WorklistItem[]> {
  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true },
    orderBy: { dueDate: "asc" },
  });

  const items: WorklistItem[] = invoices.map((invoice) => {
    const daysOverdue = Math.max(
      0,
      Math.floor((Date.now() - invoice.dueDate.getTime()) / 86_400_000)
    );
    const { score, priority, reasoning } = computeRiskScore({
      daysOverdue,
      amountMad: invoice.amountMad,
      reminderCount: invoice.reminders.length,
      hasUnresolvedReply: invoice.replies.length > 0,
    });

    return {
      invoiceId: invoice.id,
      reference: invoice.reference,
      amountMad: invoice.amountMad,
      daysOverdue,
      status: invoice.status,
      clientId: invoice.client.id,
      clientName: invoice.client.name,
      sector: invoice.client.sector,
      contactName: invoice.client.contactName,
      contactEmail: invoice.client.contactEmail,
      behaviorNote: invoice.client.behaviorNote,
      strategic: invoice.client.strategic,
      reminders: invoice.reminders
        .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
        .map((r) => ({
          id: r.id,
          tone: r.tone,
          content: r.content,
          status: r.status,
          createdBy: r.createdBy,
          sentAt: r.sentAt.toISOString(),
        })),
      replies: invoice.replies.map((r) => ({
        id: r.id,
        content: r.content,
        classifiedIntent: r.classifiedIntent,
        agentSummary: r.agentSummary,
        proposedAction: r.proposedAction,
        receivedAt: r.receivedAt.toISOString(),
      })),
      score,
      priority,
      reasoning,
    };
  });

  return items.sort((a, b) => b.score - a.score);
}

export default async function Home() {
  const items = await getWorklist();
  const totalOverdueMad = items.reduce((sum, i) => sum + i.amountMad, 0);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600" />
            <span className="text-lg font-semibold tracking-tight">Vélos IA</span>
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Démo — données simulées
            </span>
          </div>
        </div>
      </header>

      <KpiHeader totalOverdueMad={totalOverdueMad} dossierCount={items.length} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <Worklist items={items} />
      </main>
    </div>
  );
}
