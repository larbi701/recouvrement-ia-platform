"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorklistItem } from "@/lib/types";

const PRIORITY_STYLES: Record<WorklistItem["priority"], string> = {
  URGENT: "bg-corail/10 text-indigo-deep ring-corail/40",
  A_TRAITER: "bg-sky/15 text-azur ring-sky/40",
  SURVEILLANCE: "bg-lavande-struct text-graphite/70 ring-lavande-struct",
};

const PRIORITY_LABELS: Record<WorklistItem["priority"], string> = {
  URGENT: "Urgent",
  A_TRAITER: "À traiter",
  SURVEILLANCE: "Surveillance",
};

const TONE_LABELS: Record<string, string> = {
  AMICALE: "Amicale",
  FERME: "Ferme",
  MISE_EN_DEMEURE: "Dernier avertissement",
};

const INTENT_LABELS: Record<string, string> = {
  DEMANDE_DELAI: "Demande de délai",
  CONTESTATION: "Contestation",
  CONFIRMATION: "Confirmation de paiement",
  AUTRE: "Autre",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

type GenerateResponse = {
  draft: string;
  tone: string;
};

export function Worklist({ items }: { items: WorklistItem[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.invoiceId ?? null);
  const [draft, setDraft] = useState<string | null>(null);
  const [draftTone, setDraftTone] = useState<string | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((i) => i.invoiceId === selectedId) ?? null,
    [items, selectedId]
  );

  function selectItem(id: string) {
    setSelectedId(id);
    setDraft(null);
    setDraftTone(null);
    setConfirmation(null);
  }

  async function handleGenerate() {
    if (!selected) return;
    setLoadingGenerate(true);
    setConfirmation(null);
    try {
      const res = await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: selected.invoiceId }),
      });
      if (!res.ok) throw new Error("Échec de la génération");
      const data: GenerateResponse = await res.json();
      setDraft(data.draft);
      setDraftTone(data.tone);
    } catch {
      setConfirmation("Erreur — vérifie que ta clé API Claude est bien renseignée dans .env.local");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleSend() {
    if (!selected || !draft || !draftTone) return;
    setLoadingSend(true);
    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selected.invoiceId,
          tone: draftTone,
          content: draft,
          createdBy: "HUMAIN",
        }),
      });
      if (!res.ok) throw new Error("Échec de l'envoi");
      setConfirmation("Relance envoyée ✓ (simulation — traçabilité enregistrée)");
      setDraft(null);
      setDraftTone(null);
      router.refresh();
    } catch {
      setConfirmation("Erreur lors de l'envoi.");
    } finally {
      setLoadingSend(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[1fr_420px]">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.invoiceId}>
            <button
              onClick={() => selectItem(item.invoiceId)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selectedId === item.invoiceId
                  ? "border-violet-velos/50 bg-lavande-struct/50 ring-1 ring-violet-velos/30"
                  : "border-lavande-struct bg-white hover:border-violet-velos/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-indigo-deep">{item.clientName}</span>
                    {item.strategic && (
                      <span
                        title="Client stratégique — à traiter avec tact, indépendamment du score"
                        className="text-violet-velos"
                      >
                        ★
                      </span>
                    )}
                    {item.replies.length > 0 && (
                      <span className="rounded-full bg-azur/10 px-2 py-0.5 text-[11px] font-medium text-azur ring-1 ring-azur/30">
                        Réponse à traiter
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-graphite/70">{item.reasoning}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-indigo-deep">
                    {item.amountMad.toLocaleString("fr-FR")} MAD
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${PRIORITY_STYLES[item.priority]}`}
                  >
                    {PRIORITY_LABELS[item.priority]}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {selected ? (
          <div className="rounded-xl border border-lavande-struct bg-white p-5">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-bold text-indigo-deep">{selected.clientName}</h2>
              {selected.strategic && <span className="text-violet-velos">★</span>}
            </div>
            <p className="text-sm text-graphite/60">
              {selected.sector} · {selected.contactName} · {selected.contactEmail}
            </p>

            <div className="mt-4 rounded-lg bg-perle p-3 text-sm text-graphite">
              {selected.behaviorNote}
            </div>

            <div className="mt-4 rounded-lg border border-violet-velos/30 bg-lavande/30 p-3 text-sm text-indigo-deep">
              <span className="font-semibold text-violet-velos">Raisonnement de l&apos;agent — </span>
              {selected.reasoning}
            </div>

            {selected.replies.length > 0 && (
              <div className="mt-4 rounded-lg border border-azur/30 bg-azur/5 p-3 text-sm">
                <p className="font-medium text-azur">
                  Réponse du client
                  {selected.replies[0].classifiedIntent && (
                    <span className="ml-2 rounded-full bg-azur/10 px-2 py-0.5 text-[11px] font-medium text-azur">
                      {INTENT_LABELS[selected.replies[0].classifiedIntent] ?? selected.replies[0].classifiedIntent}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-graphite/80">&ldquo;{selected.replies[0].content}&rdquo;</p>
                {selected.replies[0].agentSummary && (
                  <p className="mt-2 text-graphite/80">
                    <span className="font-medium text-graphite">Résumé agent : </span>
                    {selected.replies[0].agentSummary}
                  </p>
                )}
                {selected.replies[0].proposedAction && (
                  <p className="mt-2 text-graphite/80">
                    <span className="font-medium text-graphite">Action proposée : </span>
                    {selected.replies[0].proposedAction}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-graphite/60">
                Historique des relances ({selected.reminders.length})
              </p>
              <ul className="flex flex-col gap-2">
                {selected.reminders.map((r) => (
                  <li key={r.id} className="rounded-lg border border-lavande-struct p-2 text-xs text-graphite/70">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-indigo-deep">{TONE_LABELS[r.tone] ?? r.tone}</span>
                      <span>{formatDate(r.sentAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-graphite/60">{r.content}</p>
                  </li>
                ))}
                {selected.reminders.length === 0 && (
                  <li className="text-xs text-graphite/40">Aucune relance envoyée pour l&apos;instant.</li>
                )}
              </ul>
            </div>

            <div className="mt-5 border-t border-lavande-struct pt-4">
              {!draft ? (
                <button
                  onClick={handleGenerate}
                  disabled={loadingGenerate}
                  className="w-full rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {loadingGenerate ? "L'agent rédige…" : "Générer la prochaine relance"}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-graphite/60">
                    Ton : {TONE_LABELS[draftTone ?? ""] ?? draftTone} — modifiable avant envoi
                  </span>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-lavande-struct p-3 text-sm text-graphite focus:border-violet-velos focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSend}
                      disabled={loadingSend}
                      className="flex-1 rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {loadingSend ? "Envoi…" : "Envoyer"}
                    </button>
                    <button
                      onClick={() => {
                        setDraft(null);
                        setDraftTone(null);
                      }}
                      className="rounded-lg border border-lavande-struct px-4 py-2 text-sm font-medium text-graphite transition hover:bg-perle"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              {confirmation && <p className="mt-2 text-sm font-medium text-indigo-deep">{confirmation}</p>}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-lavande-struct p-8 text-center text-sm text-graphite/40">
            Sélectionne un dossier à gauche.
          </div>
        )}
      </aside>
    </div>
  );
}
