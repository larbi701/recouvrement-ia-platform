// Mark officiel VELOS IA : trois nœuds reliés (charte graphique V5, section 04).
// Sur fond indigo : mark en blanc, sauf le nœud bas et la barre qui restent en violet.
type MarkProps = { className?: string; onDark?: boolean };

export function LogoMark({ className = "h-6 w-6", onDark = false }: MarkProps) {
  const lineColor = onDark ? "#FFFFFF" : "var(--color-indigo-deep)";
  const topNodeStroke = onDark ? "#FFFFFF" : "var(--color-indigo-deep)";
  const topNodeFill = onDark ? "var(--color-indigo-deep)" : "#FFFFFF";
  const bottomNodeFill = "var(--color-violet-velos)";

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <line x1="22" y1="22" x2="50" y2="78" stroke={lineColor} strokeWidth="6" strokeLinecap="round" />
      <line x1="78" y1="22" x2="50" y2="78" stroke="var(--color-violet-velos)" strokeWidth="6" strokeLinecap="round" />
      <line x1="22" y1="22" x2="78" y2="22" stroke={lineColor} strokeWidth="6" strokeLinecap="round" />
      <circle cx="22" cy="22" r="11" fill={topNodeFill} stroke={topNodeStroke} strokeWidth="6" />
      <circle cx="78" cy="22" r="11" fill={topNodeFill} stroke={topNodeStroke} strokeWidth="6" />
      <circle cx="50" cy="78" r="12" fill={bottomNodeFill} />
    </svg>
  );
}

export function LogoBadge({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-xl bg-indigo-deep`}>
      <LogoMark className="h-5 w-5" onDark />
    </div>
  );
}

export function LogoWordmark() {
  return (
    <div className="flex items-center gap-3">
      <LogoBadge />
      <div className="leading-tight">
        <span className="text-lg font-bold tracking-tight text-indigo-deep">
          VELOS <span className="text-violet-velos">IA</span>
        </span>
        <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-graphite/70">
          Business Operating System
        </p>
      </div>
    </div>
  );
}
