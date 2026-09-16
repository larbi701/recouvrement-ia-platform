import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ImportRow = {
  clientName: string;
  reference: string;
  issueDate: string;
  dueDate: string;
  amountMad: number;
  contactEmail: string;
  contactPhone: string;
  sector: string;
};

export async function POST(req: Request) {
  const { rows }: { rows: ImportRow[] } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à importer" }, { status: 400 });
  }

  let clientsCreated = 0;
  let invoicesCreated = 0;
  let invoicesSkipped = 0;
  const clientCache = new Map<string, string>(); // nom normalisé -> clientId

  for (const row of rows) {
    if (!row.clientName || !row.reference || !row.issueDate || !row.dueDate || !row.amountMad) continue;

    const key = row.clientName.trim().toLowerCase();
    let clientId = clientCache.get(key);

    if (!clientId) {
      const existing = await prisma.client.findFirst({
        where: { name: { equals: row.clientName.trim() } },
      });
      if (existing) {
        clientId = existing.id;
      } else {
        const created = await prisma.client.create({
          data: {
            name: row.clientName.trim(),
            sector: row.sector || "Non renseigné",
            contactName: row.clientName.trim(),
            contactEmail: row.contactEmail || "",
            contactPhone: row.contactPhone || "",
            behaviorNote: "Importé depuis une balance âgée — historique de comportement non disponible.",
            strategic: false,
            chronicLatePayer: false,
          },
        });
        clientId = created.id;
        clientsCreated++;
      }
      clientCache.set(key, clientId);
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { clientId, reference: row.reference.trim() },
    });
    if (existingInvoice) {
      invoicesSkipped++;
      continue;
    }

    const dueDate = new Date(row.dueDate);
    await prisma.invoice.create({
      data: {
        clientId,
        reference: row.reference.trim(),
        amountMad: Math.round(row.amountMad),
        issueDate: new Date(row.issueDate),
        dueDate,
        status: dueDate.getTime() >= Date.now() ? "EN_COURS" : "EN_RETARD",
      },
    });
    invoicesCreated++;
  }

  return NextResponse.json({ clientsCreated, invoicesCreated, invoicesSkipped });
}
