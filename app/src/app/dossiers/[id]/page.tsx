import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { AppHeader } from "@/components/AppHeader";
import { DossierDetail } from "@/components/DossierDetail";

export const dynamic = "force-dynamic";

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, reminders: true, replies: true, callTasks: true },
  });

  if (!invoice) notFound();

  const item = buildWorklistItem(invoice);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        breadcrumb={[
          { label: "Yas", href: "/" },
          { label: "Cockpit", href: "/cockpit" },
          { label: "Dossiers", href: "/dossiers" },
          { label: item.clientName },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <DossierDetail item={item} />
      </main>
    </div>
  );
}
