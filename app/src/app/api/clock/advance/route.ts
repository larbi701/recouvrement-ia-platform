import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// Horloge de démo (§ simulatedDate) — avance la date simulée de N jours, jamais l'heure
// réelle. Permet de rejouer un scénario de recouvrement sur plusieurs semaines en quelques
// clics, sans attendre. Le pilotage automatique existant ("Lancer Yas sur le portefeuille")
// reste le point d'entrée pour faire agir Yas à la nouvelle date — cette route ne fait que
// déplacer l'horloge.
export async function POST(req: Request) {
  const { days } = await req.json();

  if (typeof days !== "number" || !Number.isFinite(days) || days === 0) {
    return NextResponse.json({ error: "Nombre de jours invalide" }, { status: 400 });
  }

  const current = await getSettings();
  const next = new Date(current.simulatedDate.getTime() + days * 86_400_000);

  const settings = await prisma.settings.update({
    where: { id: "singleton" },
    data: { simulatedDate: next },
  });

  return NextResponse.json({ simulatedDate: settings.simulatedDate });
}
