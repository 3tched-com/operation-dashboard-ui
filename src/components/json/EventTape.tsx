import { cn } from "@/lib/utils";
import type { EventLogEntry } from "@/types/api";

interface EventTapeProps {
  events: EventLogEntry[];
  className?: string;
  maxItems?: number;
}

export function EventTape({ events, className, maxItems = 50 }: EventTapeProps) {
  const visible = events.slice(-maxItems).reverse();

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Event Tape</span>
        <span className="text-[11px] text-muted-foreground">{events.length} total</span>
      </div>
      <div className="max-h-[400px] overflow-auto">
        {visible.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No events yet.</div>
        ) : visible.map((evt) => (
          <EventRow key={evt.id} event={evt} />
        ))}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: EventLogEntry }) {
  const time = new Date(event.ts).toLocaleTimeString();
  return (
    <details className="border-b border-border last:border-0 group">
      <summary className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
        <span className="font-mono text-[11px] text-muted-foreground w-20 shrink-0">{time}</span>
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
          event.event === "health" && "border-ok/30 text-ok bg-ok/10",
          event.event === "state_update" && "border-info/30 text-info bg-info/10",
          event.event === "audit_event" && "border-warn/30 text-warn bg-warn/10",
          event.event === "system_stats" && "border-primary/30 text-primary bg-primary/10",
          !["health", "state_update", "audit_event", "system_stats"].includes(event.event) && "border-border text-muted-foreground",
        )}>{event.event}</span>
        <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
          {typeof event.payload === "string" ? event.payload : JSON.stringify(event.payload)?.slice(0, 80)}
        </span>
      </summary>
      <div className="px-3 pb-3">
        <pre className="font-mono text-xs text-foreground bg-muted/30 rounded-md p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </div>
    </details>
  );
}
