"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlatformSettings } from "@/lib/settings";

function Field({
  label,
  suffix,
  value,
  onChange,
  hint,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-lavande-struct p-3">
      <label className="text-sm font-medium text-indigo-deep">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-28 rounded-lg border border-lavande-struct p-2 text-sm text-graphite focus:border-violet-velos focus:outline-none"
        />
        <span className="text-sm text-graphite/60">{suffix}</span>
      </div>
      <p className="mt-1 text-xs text-graphite/50">{hint}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-lavande-struct p-3">
      <label className="text-sm font-medium text-indigo-deep">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-lavande-struct p-2 text-sm text-graphite focus:border-violet-velos focus:outline-none"
      />
      <p className="mt-1 text-xs text-graphite/50">{hint}</p>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: PlatformSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<PlatformSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PlatformSettings>(key: K, v: PlatformSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      // simulatedDate n'est jamais envoyé depuis ce formulaire — seule l'horloge de démo
      // (bandeau, +1j/+7j) est autorisée à la modifier.
      const {
        hitlAmountThreshold,
        earlyMaxDays,
        standardMaxDays,
        intensiveMaxDays,
        preLegalMaxDays,
        companyName,
        companySector,
      } = values;
      const res = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hitlAmountThreshold,
          earlyMaxDays,
          standardMaxDays,
          intensiveMaxDays,
          preLegalMaxDays,
          companyName,
          companySector,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'enregistrement");
      setMessage("Paramètres enregistrés — le moteur de décision les applique dès maintenant, partout dans l'appli.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-lavande-struct bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
          Identité de l&apos;entreprise créancière
        </h2>
        <p className="mb-3 text-xs text-graphite/50">
          Le nom qui signe les relances générées par Yas — changez-le pour adapter la démo à chaque prospect.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Raison sociale"
            value={values.companyName}
            onChange={(v) => set("companyName", v)}
            hint="Utilisée telle quelle dans la signature des emails, WhatsApp et fiches d'appel générés."
          />
          <TextField
            label="Secteur"
            value={values.companySector}
            onChange={(v) => set("companySector", v)}
            hint="Donne le contexte à l'agent qui rédige les messages."
          />
        </div>
      </div>

      <div className="rounded-xl border border-lavande-struct bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">
          Validation humaine obligatoire
        </h2>
        <Field
          label="Seuil de montant"
          suffix="MAD"
          value={values.hitlAmountThreshold}
          onChange={(v) => set("hitlAmountThreshold", v)}
          hint="Au-delà de ce montant, Collection Supervisor bloque l'exécution automatique et demande une validation, quel que soit le playbook."
        />
      </div>

      <div className="rounded-xl border border-lavande-struct bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
          Frontières des playbooks
        </h2>
        <p className="mb-3 text-xs text-graphite/50">
          Nombre de jours de retard à partir duquel un dossier change d&apos;étape (§10 des specs).
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Fin du recouvrement précoce"
            suffix="jours"
            value={values.earlyMaxDays}
            onChange={(v) => set("earlyMaxDays", v)}
            hint="Après ce délai, on passe au playbook Standard."
          />
          <Field
            label="Fin du recouvrement standard"
            suffix="jours"
            value={values.standardMaxDays}
            onChange={(v) => set("standardMaxDays", v)}
            hint="Après ce délai, on passe au playbook Intensif."
          />
          <Field
            label="Fin du recouvrement intensif"
            suffix="jours"
            value={values.intensiveMaxDays}
            onChange={(v) => set("intensiveMaxDays", v)}
            hint="Après ce délai, on passe au Pré-contentieux."
          />
          <Field
            label="Fin du pré-contentieux"
            suffix="jours"
            value={values.preLegalMaxDays}
            onChange={(v) => set("preLegalMaxDays", v)}
            hint="Plafond légal marocain (loi 69-21) : au-delà, transmission avocat obligatoire."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-indigo-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && <p className="text-sm font-medium text-indigo-deep">{message}</p>}
        {error && <p className="text-sm text-corail">{error}</p>}
      </div>
    </div>
  );
}
