import { AppHeader } from "@/components/AppHeader";
import { ImportWizard } from "@/components/ImportWizard";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// §1 specs techniques — Étape 1 du workflow global (§9) et point de départ du
// scénario "effet wow" (§17) : import d'une balance âgée Excel/CSV.
export default async function ImportPage() {
  const settings = await getSettings();
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        breadcrumb={[{ label: "Yas", href: "/" }, { label: "Import balance âgée" }]}
        simulatedDate={settings.simulatedDate}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
        <h1 className="mb-1 text-xl font-bold text-indigo-deep">Importer une balance âgée</h1>
        <p className="mb-6 text-sm text-graphite/60">
          Portfolio Intelligence Analyst prend le relais dès l&apos;import : score, playbook et priorité sont
          calculés automatiquement pour chaque facture.
        </p>
        <ImportWizard />
      </main>
    </div>
  );
}
