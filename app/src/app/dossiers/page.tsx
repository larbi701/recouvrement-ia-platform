import { redirect } from "next/navigation";

// Ancien écran "Dossiers par priorité" : fusionné dans le Portefeuille (filtres).
export default async function DossiersRedirect({ searchParams }: { searchParams: Promise<{ queue?: string }> }) {
  const { queue } = await searchParams;
  redirect(queue ? `/portfolio?queue=${encodeURIComponent(queue)}` : "/portfolio");
}
