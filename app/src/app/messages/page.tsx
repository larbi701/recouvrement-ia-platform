import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/AppHeader";
import { MessagesView, type InboxDTO, type MessageDTO } from "@/components/MessagesView";

export const dynamic = "force-dynamic";

// Messages : la boîte de travail de la communication. À valider (brouillons de Yas),
// Réponses clients (classées par l'agent) et Envoyés (traçabilité, avec rouverture du canal).
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const [reminders, replies, invoices, settings] = await Promise.all([
    prisma.reminder.findMany({
      where: { status: { in: ["BROUILLON", "ENVOYEE_SIMULEE"] } },
      include: { invoice: { include: { client: true } } },
      orderBy: { sentAt: "desc" },
    }),
    prisma.clientReply.findMany({ include: { invoice: { include: { client: true } } }, orderBy: { receivedAt: "desc" } }),
    prisma.invoice.findMany({ include: { client: true }, orderBy: { dueDate: "asc" } }),
    getSettings(),
  ]);

  const now = settings.simulatedDate.getTime();
  const daysAgo = (d: Date) => Math.floor((now - d.getTime()) / 86_400_000);
  const toDto = (r: (typeof reminders)[number]): MessageDTO => ({
    id: r.id,
    invoiceId: r.invoiceId,
    clientName: r.invoice.client.name,
    contactName: r.invoice.client.contactName,
    contactEmail: r.invoice.client.contactEmail,
    contactPhone: r.invoice.client.contactPhone,
    reference: r.invoice.reference,
    amountMad: r.invoice.amountMad,
    channel: r.channel,
    tone: r.tone,
    content: r.content,
    createdBy: r.createdBy,
    note: r.note,
    daysAgo: daysAgo(r.sentAt),
  });

  const inbox: InboxDTO[] = replies
    .map((r) => ({
      id: r.id,
      invoiceId: r.invoiceId,
      clientName: r.invoice.client.name,
      reference: r.invoice.reference,
      content: r.content,
      intent: r.classifiedIntent,
      summary: r.agentSummary,
      proposedAction: r.proposedAction,
      handled: r.handled,
      daysAgo: daysAgo(r.receivedAt),
    }))
    .sort((a, b) => Number(a.handled) - Number(b.handled));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Messages" }]} simulatedDate={settings.simulatedDate} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-6">
        <h1 className="mb-1 text-xl font-bold text-indigo-deep">Messages</h1>
        <p className="mb-5 text-sm text-graphite/60">
          Tout ce qui sort et tout ce qui rentre : validez les messages préparés par Yas, traitez les réponses des clients,
          retrouvez ce qui a été envoyé.
        </p>
        <MessagesView
          drafts={reminders.filter((r) => r.status === "BROUILLON").map(toDto)}
          inbox={inbox}
          sent={reminders.filter((r) => r.status === "ENVOYEE_SIMULEE").map(toDto)}
          invoiceOptions={invoices.map((i) => ({ id: i.id, label: `${i.client.name} — ${i.reference}` }))}
          initialTab={tab === "replies" ? "replies" : tab === "sent" ? "sent" : "drafts"}
        />
      </main>
    </div>
  );
}
