type Props = {
  totalOverdueMad: number;
  dossierCount: number;
};

function SimulationTag({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200"
    >
      Simulation
    </span>
  );
}

export function KpiHeader({ totalOverdueMad, dossierCount }: Props) {
  const tiles = [
    {
      label: "Total en retard",
      value: `${totalOverdueMad.toLocaleString("fr-FR")} MAD`,
      sub: `${dossierCount} dossiers en cours`,
      simulated: false,
      tooltip: "",
    },
    {
      label: "Délai moyen de recouvrement (DSO)",
      value: "88 → 58 jours",
      sub: "-34% grâce à l'automatisation",
      simulated: true,
      tooltip:
        "88 jours = délai clients moyen des PME marocaines en 2024 (Inforisk, en baisse depuis 94 jours en 2023). 58 jours = projection avec l'agent, sur la base d'une réduction de DSO du même ordre que celle documentée par Growfin (-34%).",
    },
    {
      label: "Effort manuel réduit",
      value: "55%",
      sub: "temps de relance économisé",
      simulated: true,
      tooltip: "Scénario illustratif pour la démo — pas un résultat mesuré chez un client réel.",
    },
    {
      label: "Récupéré ce mois grâce à l'agent",
      value: "96 500 MAD",
      sub: "sur les dossiers relancés",
      simulated: true,
      tooltip: "Scénario illustratif pour la démo — pas un résultat mesuré chez un client réel.",
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {tile.label}
              </span>
              {tile.simulated && <SimulationTag title={tile.tooltip} />}
            </div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900">
              {tile.value}
            </div>
            <div className="text-xs text-slate-500">{tile.sub}</div>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-4 text-[11px] text-slate-400">
        Délais de paiement calibrés sur le marché marocain — moyenne PME 2024 : Inforisk · plafond légal entre
        entreprises : 120 jours (loi 69-21).
      </p>
    </div>
  );
}
