import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONTROLLABLE_AGENTS, isControllable } from "@/lib/agentConfig";

// Suspension / reprise d'un agent, niveau d'autonomie, ou arrêt d'urgence global.
export async function POST(req: Request) {
  const body = await req.json();

  if (typeof body.all === "boolean") {
    for (const key of CONTROLLABLE_AGENTS) {
      await prisma.agentConfig.upsert({ where: { key }, update: { enabled: body.all }, create: { key, enabled: body.all } });
    }
    return NextResponse.json({ ok: true });
  }

  const { key, enabled, autonomy } = body;
  if (!isControllable(key)) {
    return NextResponse.json({ error: "Cet agent n'est pas pilotable : c'est un calcul du moteur, toujours actif." }, { status: 400 });
  }
  const data: { enabled?: boolean; autonomy?: string } = {};
  if (typeof enabled === "boolean") data.enabled = enabled;
  if (autonomy === "AUTO" || autonomy === "PROPOSE") data.autonomy = autonomy;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });

  await prisma.agentConfig.upsert({ where: { key }, update: data, create: { key, ...data } });
  return NextResponse.json({ ok: true });
}
