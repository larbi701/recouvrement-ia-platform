export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 6L11 12L4 18"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 6L19 12L12 18"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

export function LogoWordmark() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        Vélos <span className="text-indigo-600">IA</span>
      </span>
    </div>
  );
}
