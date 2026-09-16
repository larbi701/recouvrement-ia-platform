"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseSpreadsheetFile,
  guessMapping,
  normalizeRows,
  TARGET_FIELD_LABELS,
  REQUIRED_FIELDS,
  type ParsedSheet,
  type TargetField,
  type NormalizedInvoiceRow,
} from "@/lib/importParsing";

type Step = "upload" | "map" | "done";

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Record<string, TargetField>>({});
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ clientsCreated: number; invoicesCreated: number; invoicesSkipped: number } | null>(
    null
  );

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    try {
      const sheet = await parseSpreadsheetFile(file);
      if (sheet.rows.length === 0) {
        setError("Ce fichier ne contient aucune ligne exploitable.");
        return;
      }
      setParsed(sheet);
      setMapping(guessMapping(sheet.headers));
      setStep("map");
    } catch {
      setError("Impossible de lire ce fichier — vérifie que c'est bien un .xlsx ou .csv.");
    }
  }

  const normalized: NormalizedInvoiceRow[] = parsed ? normalizeRows(parsed, mapping) : [];
  const validRows = normalized.filter((r) => r.errors.length === 0);
  const invalidRows = normalized.filter((r) => r.errors.length > 0);
  const mappedFields = new Set(Object.values(mapping));
  const missingRequired = REQUIRED_FIELDS.filter((f) => !mappedFields.has(f));

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      if (!res.ok) throw new Error("Échec de l'import");
      const data = await res.json();
      setResult(data);
      setStep("done");
      router.refresh();
    } catch {
      setError("Erreur pendant l'import — réessaie.");
    } finally {
      setImporting(false);
    }
  }

  if (step === "upload") {
    return (
      <div className="rounded-xl border border-dashed border-violet-velos/40 bg-lavande/10 p-8 text-center">
        <p className="mb-4 text-sm text-graphite/70">
          Dépose une balance âgée au format Excel (.xlsx) ou CSV — colonnes attendues : nom du client, n° de
          facture, date d&apos;émission, date d&apos;échéance, montant TTC.
        </p>
        <label className="inline-block cursor-pointer rounded-lg bg-indigo-deep px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
          Choisir un fichier
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        {error && <p className="mt-4 text-sm text-corail">{error}</p>}
      </div>
    );
  }

  if (step === "map" && parsed) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-lavande-struct bg-white p-4">
          <p className="text-sm text-graphite/70">
            <span className="font-medium text-indigo-deep">{fileName}</span> — {parsed.rows.length} ligne(s)
            détectée(s). Vérifie le mapping des colonnes ci-dessous (deviné automatiquement).
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-lavande-struct bg-white p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {parsed.headers.map((h) => (
                  <th key={h} className="border-b border-lavande-struct p-2 text-left">
                    <p className="mb-1 text-xs font-medium text-graphite/50">{h}</p>
                    <select
                      value={mapping[h]}
                      onChange={(e) => setMapping({ ...mapping, [h]: e.target.value as TargetField })}
                      className="w-full rounded border border-lavande-struct p-1 text-xs"
                    >
                      {Object.entries(TARGET_FIELD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-b border-lavande-struct/50">
                  {parsed.headers.map((h) => (
                    <td key={h} className="p-2 text-graphite/70">
                      {String(row[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {missingRequired.length > 0 && (
          <p className="text-sm text-corail">
            Colonnes obligatoires non mappées : {missingRequired.map((f) => TARGET_FIELD_LABELS[f]).join(", ")}
          </p>
        )}

        <div className="rounded-xl border border-lavande-struct bg-white p-4 text-sm">
          <p className="text-graphite/70">
            <span className="font-medium text-indigo-deep">{validRows.length}</span> ligne(s) valide(s) prête(s) à
            importer
            {invalidRows.length > 0 && (
              <span className="text-corail"> · {invalidRows.length} ligne(s) en erreur (ignorée(s))</span>
            )}
            .
          </p>
          {invalidRows.length > 0 && (
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-graphite/50">
              {invalidRows.slice(0, 10).map((r) => (
                <li key={r.rowIndex}>
                  Ligne {r.rowIndex + 2} : {r.errors.join(", ")}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-corail">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleImport}
            disabled={importing || validRows.length === 0 || missingRequired.length > 0}
            className="rounded-lg bg-indigo-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {importing ? "Import en cours…" : `Importer ${validRows.length} facture(s)`}
          </button>
          <button
            onClick={() => {
              setStep("upload");
              setParsed(null);
            }}
            className="rounded-lg border border-lavande-struct px-5 py-2.5 text-sm font-medium text-graphite hover:bg-perle"
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="rounded-xl border border-violet-velos/30 bg-lavande/20 p-6 text-center">
        <p className="text-lg font-bold text-indigo-deep">Import terminé ✓</p>
        <p className="mt-2 text-sm text-graphite/70">
          {result.clientsCreated} nouveau(x) client(s) · {result.invoicesCreated} facture(s) créée(s)
          {result.invoicesSkipped > 0 && ` · ${result.invoicesSkipped} déjà existante(s), ignorée(s)`}
        </p>
        <a
          href="/cockpit"
          className="mt-4 inline-block rounded-lg bg-indigo-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Voir l&apos;Action Center →
        </a>
      </div>
    );
  }

  return null;
}
