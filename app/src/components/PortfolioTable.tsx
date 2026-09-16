"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { WorklistItem } from "@/lib/types";
import { PLAYBOOK_LABELS } from "@/lib/workflow";

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

export function PortfolioTable({ items }: { items: WorklistItem[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
    if (q) {
      rows = rows.filter(
        (i) => i.clientName.toLowerCase().includes(q) || i.reference.toLowerCase().includes(q)
      );
    }
    return rows
      .slice()
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "clientName") return a.clientName.localeCompare(b.clientName) * dir;
        return (a[sortKey] - b[sortKey]) * dir;
      });
  }, [items, search, sortKey, sortDir]);

  const totalMad = filtered.reduce((sum, i) => sum + i.amountMad, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Rechercher un client ou une facture…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 max-w-full rounded-lg border border-lavande-struct p-2 text-sm focus:border-violet-velos focus:outline-none"
        />
        <p className="text-xs text-graphite/50">
          {filtered.length} dossier(s) · {totalMad.toLocaleString("fr-FR")} MAD
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-lavande-struct bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <SortHeader label="Client" sortKeyValue="clientName" activeSortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="border-b border-lavande-struct p-2 text-left text-xs font-medium uppercase tracking-wide text-graphite/60">
                Référence
              </th>
              <SortHeader label="Montant" sortKeyValue="amountMad" activeSortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Retard" sortKeyValue="daysOverdue" activeSortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="border-b border-lavande-struct p-2 text-left text-xs font-medium uppercase tracking-wide text-graphite/60">
                Playbook
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
                  <Link href={`/dossiers/${item.invoiceId}`} className="font-medium text-indigo-deep hover:underline">
                    {item.clientName}
                  </Link>
                  {item.strategic && <span className="ml-1 text-violet-velos">★</span>}
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
                <td colSpan={7} className="p-4 text-center text-graphite/40">
                  Aucun dossier ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
