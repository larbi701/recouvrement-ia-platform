import { AppHeader } from "@/components/AppHeader";
import { SettingsForm } from "@/components/SettingsForm";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// §12.10 Paramètres (Administration) — les règles du jeu, réellement lues par le moteur
// de décision (src/lib/workflow.ts) à chaque calcul, pas un simple affichage.
export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader breadcrumb={[{ label: "Yas", href: "/" }, { label: "Paramètres" }]} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-6">
        <h1 className="mb-1 text-xl font-bold text-indigo-deep">Paramètres</h1>
        <p className="mb-6 text-sm text-graphite/60">
          Ces réglages pilotent Collection Strategist et Collection Supervisor sur l&apos;ensemble du portefeuille —
          aucune donnée fictive, ce sont les vraies valeurs utilisées.
        </p>
        <SettingsForm initial={settings} />
      </main>
    </div>
  );
}
