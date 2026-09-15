"use client";

import { useState } from "react";
import type { WorklistItem } from "@/lib/types";
import { STAGES, type StageKey } from "@/components/Funnel";
import { DossierCards } from "@/components/DossierCards";

type TabKey = StageKey | "tous";

export function TabbedDossierList({ items, initialStage }: { items: WorklistItem[]; initialStage: StageKey | null }) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialStage ?? "tous");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "tous", label: "Tous les dossiers", count: items.length },
    ...STAGES.map((s) => ({ key: s.key, label: s.label, count: items.filter(s.match).length })),
  ];

  const activeStage = STAGES.find((s) => s.key === activeTab);
  const filtered = activeStage ? items.filter(activeStage.match) : items;

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

      {activeStage && <p className="mb-4 text-sm text-graphite/60">{activeStage.description}</p>}

      <DossierCards items={filtered} />
    </div>
  );
}
