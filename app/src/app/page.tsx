import { prisma } from "@/lib/prisma";
import { computeRiskScore } from "@/lib/scoring";
import { computeNextAction } from "@/lib/workflow";
import type { WorklistItem } from "@/lib/types";
import { KpiHeader } from "@/components/KpiHeader";
import { Worklist } from "@/components/Worklist";
import { LogoWordmark } from "@/components/Logo";

export const dynamic = "force-dynamic";

async function getWorklist(): Promise<WorklistItem[]> {
  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true, callTasks: true },
    orderBy: { dueDate: "asc" },
  });

  const items: WorklistItem[] = invoices.map((invoice) => {
    const daysOverdue = Math.max(
      0,
      Math.floor((Date.now() - invoice.dueDate.getTime()) / 86_400_000)
    );
    const emailCount = invoice.reminders.filter((r) => r.channel === "EMAIL").length;
    const whatsappCount = invoice.reminders.filter((r) => r.channel === "WHATSAPP").length;
    const hasUnresolvedReply = invoice.replies.length > 0;

    const { score, priority, reasoning } = computeRiskScore({
      daysOverdue,
      amountMad: invoice.amountMad,
      reminderCount: emailCount + whatsappCount,
      hasUnresolvedReply,
    });

    const nextAction = computeNextAction({
      daysOverdue,
      hasUnresolvedReply,
      emailCount,
      whatsappCount,
      hasPendingCallTask: invoice.callTasks.some((c) => c.status === "A_FAIRE"),
      hasAnyCallTask: invoice.callTasks.length > 0,
      strategic: invoice.client.strategic,
      chronicLatePayer: invoice.client.chronicLatePayer,
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
      contactPhone: invoice.client.contactPhone,
      behaviorNote: invoice.client.behaviorNote,
      strategic: invoice.client.strategic,
      chronicLatePayer: invoice.client.chronicLatePayer,
      reminders: invoice.reminders
        .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
        .map((r) => ({
          id: r.id,
          channel: r.channel,
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
      callTasks: invoice.callTasks
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((c) => ({
          id: c.id,
          reason: c.reason,
          talkingPoints: c.talkingPoints,
          status: c.status,
          outcome: c.outcome,
          outcomeNote: c.outcomeNote,
          promisedDate: c.promisedDate ? c.promisedDate.toISOString() : null,
          createdAt: c.createdAt.toISOString(),
          completedAt: c.completedAt ? c.completedAt.toISOString() : null,
        })),
      score,
      priority,
      reasoning,
      nextAction,
    };
  });

  return items.sort((a, b) => b.score - a.score);
}

export default async function Home() {
  const items = await getWorklist();
  const totalOverdueMad = items.reduce((sum, i) => sum + i.amountMad, 0);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-lavande-struct bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
          <LogoWordmark />
          <span className="ml-3 rounded-full bg-lavande-struct px-2 py-0.5 text-xs font-medium text-indigo-deep">
            Démo — données simulées
          </span>
        </div>
      </header>

      <KpiHeader totalOverdueMad={totalOverdueMad} dossierCount={items.length} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <Worklist items={items} />
      </main>
    </div>
  );
}
