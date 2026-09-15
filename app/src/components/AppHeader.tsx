import Link from "next/link";
import { LogoWordmark } from "@/components/Logo";

export function AppHeader({ breadcrumb }: { breadcrumb?: { label: string; href?: string }[] }) {
  return (
    <header className="border-b border-lavande-struct bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
        <Link href="/">
          <LogoWordmark />
        </Link>
        <span className="ml-3 rounded-full bg-lavande-struct px-2 py-0.5 text-xs font-medium text-indigo-deep">
          Démo — données simulées
        </span>
      </div>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-4 text-sm text-graphite/60">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.label}>
              {i > 0 && <span className="mx-1.5 text-graphite/30">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-indigo-deep hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-indigo-deep">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
