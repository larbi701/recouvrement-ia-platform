"use client";

import { useState } from "react";
import type { WorklistItem } from "@/lib/types";
import { getWorkQueues, type QueueKey } from "@/components/WorkQueues";
import { DossierCards } from "@/components/DossierCards";

type TabKey = QueueKey | "tous";

export function TabbedDossierList({
  items,
  initialQueue,
  hitlAmountThreshold,
}: {
  items: WorklistItem[];
  initialQueue: QueueKey | null;
  hitlAmountThreshold: number;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialQueue ?? "tous");
  const workQueues = getWorkQueues(hitlAmountThreshold);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "tous", label: "Tous les dossiers", count: items.length },
    ...workQueues.map((q) => ({ key: q.key, label: q.label, count: items.filter(q.match).length })),
  ];

  const activeQueue = workQueues.find((q) => q.key === activeTab);
  const filtered = activeQueue ? items.filter(activeQueue.match) : items;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-lavande-struct pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-indigo-deep text-white"
                : "bg-lavande-struct/60 text-graphite hover:bg-lavande-struct"
            }`}
          >
            {tab.label} <span className="opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {activeQueue && <p className="mb-4 text-sm text-graphite/60">{activeQueue.description}</p>}

      <DossierCards items={filtered} />
    </div>
  );
}
