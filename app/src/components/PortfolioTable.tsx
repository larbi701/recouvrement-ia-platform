"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorklistItem } from "@/lib/types";
import { PLAYBOOK_LABELS, type PlaybookKey } from "@/lib/workflow";
import { getWorkQueues, type QueueKey } from "@/components/WorkQueues";

type SortKey = "clientName" | "amountMad" | "daysOverdue" | "score";

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-corail/10 text-indigo-deep ring-corail/40",
  A_TRAITER: "bg-sky/15 text-azur ring-sky/40",
  SURVEILLANCE: "bg-lavande-struct text-graphite/70 ring-lavande-struct",
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  EMAIL: "Email à générer",
  WHATSAPP: "WhatsApp à générer",
  CALL_TASK: "Appel à préparer/traiter",
  WAIT_HUMAN: "Réponse à traiter",
  WAIT_PROMISE: "Attente de promesse",
  LEGAL_TRANSFER: "Transmission avocat",
  PUBLIC_DEBTOR_REVIEW: "Débiteur public",
};

function SortHeader({
  label,
  sortKeyValue,
  activeSortKey,
  sortDir,
  onToggle,
}: {
  label: string;
  sortKeyValue: SortKey;
  activeSortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggle: (key: SortKey) => void;
}) {
  return (
    <th
      onClick={() => onToggle(sortKeyValue)}
      className="cursor-pointer select-none border-b border-lavande-struct p-2 text-left text-xs font-medium uppercase tracking-wide text-graphite/60 hover:text-indigo-deep"
    >
      {label} {activeSortKey === sortKeyValue && (sortDir === "asc" ? "↑" : "↓")}
    </th>
  );
}

export function PortfolioTable({
  items,
  hitlAmountThreshold,
  initialQueue,
  initialPlaybook,
}: {
  items: WorklistItem[];
  hitlAmountThreshold: number;
  initialQueue: QueueKey | null;
  initialPlaybook: PlaybookKey | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<QueueKey | "all">(initialQueue ?? "all");
  const [playbook, setPlaybook] = useState<PlaybookKey | null>(initialPlaybook);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const queues = useMemo(() => getWorkQueues(hitlAmountThreshold), [hitlAmountThreshold]);
  const activeQueue = queues.find((q) => q.key === queue);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = items;
    if (activeQueue) rows = rows.filter(activeQueue.match);
    if (playbook) rows = rows.filter((i) => i.playbook === playbook);
    if (q) {
      rows = rows.filter((i) => i.clientName.toLowerCase().includes(q) || i.reference.toLowerCase().includes(q));
    }
    return rows.slice().sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "clientName") return a.clientName.localeCompare(b.clientName) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
  }, [items, search, activeQueue, playbook, sortKey, sortDir]);

  const totalMad = filtered.reduce((sum, i) => sum + i.amountMad, 0);
  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.invoiceId));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((i) => i.invoiceId)));
  }

  function exportCsv() {
    const header = ["Client", "Référence", "Montant MAD", "Jours de retard", "Playbook", "Score", "Priorité", "Prochaine action"];
    const lines = filtered.map((i) =>
      [i.clientName, i.reference, i.amountMad, i.daysOverdue, PLAYBOOK_LABELS[i.playbook], i.score, i.priority, NEXT_ACTION_LABELS[i.nextAction.kind]]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    );
    const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portefeuille-velos-ia.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function prepareBulk() {
    setBulkBusy(true);
    setBulkMsg(null);
    try {
      const res = await fetch("/api/portfolio/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de la préparation");
      const skipped = data.skipped?.length ? ` · ${data.skipped.length} ignoré(s) : ${data.skipped[0].reason.toLowerCase()}` : "";
      setBulkMsg({ text: `${data.prepared.length} brouillon(s) préparé(s) par Yas — à valider dans Messages${skipped}.` });
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      setBulkMsg({ text: e instanceof Error ? e.message : "Erreur", error: true });
    } finally {
      setBulkBusy(false);
    }
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${active ? "bg-indigo-deep text-white" : "bg-lavande-struct/60 text-graphite hover:bg-lavande-struct"}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button className={chip(queue === "all")} onClick={() => setQueue("all")}>
          Tous ({items.length})
        </button>
        {queues.map((q) => (
          <button key={q.key} className={chip(queue === q.key)} onClick={() => setQueue(q.key)}>
            {q.label} ({items.filter(q.match).length})
          </button>
        ))}
      </div>

      {(activeQueue || playbook) && (
        <p className="mb-3 text-xs text-graphite/60">
          {activeQueue?.description}
          {playbook && (
            <>
              {activeQueue ? " · " : ""}Étape : <b>{PLAYBOOK_LABELS[playbook]}</b>{" "}
              <button onClick={() => setPlaybook(null)} className="text-azur underline">
                retirer
              </button>
            </>
          )}
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Rechercher un client ou une facture…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 max-w-full rounded-lg border border-lavande-struct p-2 text-sm focus:border-violet-velos focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <p className="text-xs text-graphite/50">
            {filtered.length} dossier(s) · {totalMad.toLocaleString("fr-FR")} MAD
          </p>
          <button
            onClick={exportCsv}
            className="rounded-lg border border-lavande-struct px-3 py-1.5 text-xs font-medium text-graphite hover:bg-perle"
          >
            Exporter en CSV
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-violet-velos/30 bg-lavande/30 px-4 py-2.5">
          <span className="text-sm font-medium text-indigo-deep">{selected.size} dossier(s) sélectionné(s)</span>
          <button
            onClick={prepareBulk}
            disabled={bulkBusy}
            className="rounded-lg bg-indigo-deep px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {bulkBusy ? "Yas rédige…" : "Préparer les relances"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-graphite/60 underline">
            Tout désélectionner
          </button>
          <span className="text-xs text-graphite/50">Les brouillons arrivent dans Messages, rien ne part sans votre validation.</span>
        </div>
      )}
      {bulkMsg && (
        <p className={`mb-3 text-sm ${bulkMsg.error ? "text-corail" : "font-medium text-indigo-deep"}`}>
          {bulkMsg.text}{" "}
          {!bulkMsg.error && (
            <Link href="/messages" className="text-azur underline">
              Ouvrir Messages →
            </Link>
          )}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-lavande-struct bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="w-8 border-b border-lavande-struct p-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Tout sélectionner" />
              </th>
              <SortHeader label="Client" sortKeyValue="clientName" activeSortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="border-b border-lavande-struct p-2 text-left text-xs font-medium uppercase tracking-wide text-graphite/60">
                Référence
              </th>
              <SortHeader label="Montant" sortKeyValue="amountMad" activeSortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Retard" sortKeyValue="daysOverdue" activeSortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="border-b border-lavande-struct p-2 text-left text-xs font-medium uppercase tracking-wide text-graphite/60">
                Étape
              </th>
              <SortHeader label="Score" sortKeyValue="score" activeSortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="border-b border-lavande-struct p-2 text-left text-xs font-medium uppercase tracking-wide text-graphite/60">
                Prochaine action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.invoiceId} className="border-b border-lavande-struct/60 hover:bg-perle">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.has(item.invoiceId)}
                    onChange={() => toggleOne(item.invoiceId)}
                    aria-label={`Sélectionner ${item.clientName}`}
                  />
                </td>
                <td className="p-2">
                  <Link href={`/dossiers/${item.invoiceId}`} className="font-medium text-indigo-deep hover:underline">
                    {item.clientName}
                  </Link>
                  {item.strategic && <span className="ml-1 text-violet-velos">★</span>}
                  {item.drafts.length > 0 && (
                    <span className="ml-2 rounded-full bg-sky/15 px-2 py-0.5 text-[10px] font-medium text-azur">Brouillon à valider</span>
                  )}
                </td>
                <td className="p-2 text-graphite/70">{item.reference}</td>
                <td className="p-2 font-medium text-indigo-deep">{item.amountMad.toLocaleString("fr-FR")} MAD</td>
                <td className="p-2 text-graphite/70">
                  {item.daysOverdue < 0 ? `J-${Math.abs(item.daysOverdue)}` : `J+${item.daysOverdue}`}
                </td>
                <td className="p-2 text-graphite/70">{PLAYBOOK_LABELS[item.playbook]}</td>
                <td className="p-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${PRIORITY_STYLES[item.priority]}`}
                  >
                    {item.score}/100
                  </span>
                </td>
                <td className="p-2 text-graphite/70">{NEXT_ACTION_LABELS[item.nextAction.kind]}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-graphite/40">
                  Aucun dossier ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
