import type { ActivityItem } from "@/lib/activity";
import { SPECIALIST_LABELS } from "@/lib/agents";
import Link from "next/link";

function relativeTime(iso: string, nowMs: number): string {
  const diffMs = nowMs - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

export function ActivityFeed({
  events,
  linkToDossiers = true,
  now,
}: {
  events: ActivityItem[];
  linkToDossiers?: boolean;
  now: Date;
}) {
  const nowMs = now.getTime();
  if (events.length === 0) {
    return <p className="text-sm text-graphite/50">Aucune activité pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col">
      {events.map((event, i) => {
        const content = (
          <div className="flex gap-3 py-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                event.actor === "AGENT" ? "bg-violet-velos" : "bg-azur"
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-indigo-deep">{event.title}</p>
                <span className="shrink-0 text-[11px] text-graphite/40">{relativeTime(event.at, nowMs)}</span>
              </div>
              <p className="text-xs text-graphite/60">
                <span
                  className={
                    event.actor === "AGENT"
                      ? "font-medium text-violet-velos"
                      : "font-medium text-azur"
                  }
                >
                  {event.actor === "AGENT" && event.agent ? SPECIALIST_LABELS[event.agent] : "Humain"}
                </span>
                {event.detail ? ` · ${event.detail}` : ""}
              </p>
            </div>
          </div>
        );
        return (
          <li key={event.id} className={i > 0 ? "border-t border-lavande-struct" : ""}>
            {linkToDossiers ? (
              <Link href={`/dossiers/${event.invoiceId}`} className="block transition hover:bg-perle -mx-2 px-2 rounded-lg">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
