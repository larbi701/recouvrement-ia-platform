import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { callTaskId, outcome, outcomeNote, promisedDate } = await req.json();

  if (!callTaskId || !outcome) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const callTask = await prisma.callTask.update({
    where: { id: callTaskId },
    data: {
      status: "FAIT",
      outcome,
      outcomeNote: outcomeNote || null,
      promisedDate: promisedDate ? new Date(promisedDate) : null,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ callTask });
}
