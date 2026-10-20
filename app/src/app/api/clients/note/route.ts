import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const { clientId, content } = await req.json();
  if (!clientId || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Note vide" }, { status: 400 });
  }
  const settings = await getSettings();
  const note = await prisma.clientNote.create({
    data: { clientId, content: content.trim().slice(0, 1000), createdAt: settings.simulatedDate },
  });
  return NextResponse.json({ note });
}
