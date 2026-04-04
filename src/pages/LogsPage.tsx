import { useState } from "react";
import { PageHeader, Card, Pill } from "@/components/shell/Primitives";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEventStore } from "@/stores/event-store";
import { ChevronRight, Wrench, AlertTriangle } from "lucide-react";
import type { LogLevel, JsonSchema } from "@/types/api";

const LEVELS: LogLevel[] = ["trace", "debug", "info", "warn", "error", "fatal"];

const MOCK_LOGS = Array.from({ length: 30 }, (_, i) => ({
  id: `log-${i}`,
  time: new Date(Date.now() - (30 - i) * 2000).toISOString(),
  level: (["info", "info", "debug", "warn", "info", "error", "info", "debug", "info", "info"][i % 10]) as LogLevel,
  subsystem: ["gateway", "dbus", "agent", "tools", "auth"][i % 5],
  message: [
    "Service org.freedesktop.systemd1 registered",
    "Agent main heartbeat OK",
    "Tool dbus.list_services executed in 12ms",
    "Session default active, 3 messages",
    "WireGuard tunnel re-established",
    "Permission denied for org.freedesktop.PolicyKit1",
    "Config reload triggered",
    "Introspect cache miss for /org/freedesktop/systemd1",
    "SSE client connected from 100.64.0.2",
    "Health check passed",
  ][i % 10],
  raw: `{"level":"info","ts":"${new Date().toISOString()}","msg":"log entry ${i}"}`,
  metadata: i % 5 === 3 ? {
    schema: {
      type: "object",
      title: "Tool Execution Details",
      properties: {
        tool_name: { type: "string", description: "Tool that was executed" },
        duration_ms: { type: "number", minimum: 0, maximum: 5000, description: "Execution time" },
        cache_hit: { type: "boolean", description: "Whether result was cached" },
        bus: { type: "string", enum: ["system", "session"], description: "D-Bus bus type" },
      },
    } as JsonSchema,
    payload: { tool_name: "dbus.list_services", duration_ms: 12, cache_hit: false, bus: "system" },
  } : i % 5 === 5 - 1 ? {
    actions: [
      { label: "Retry Auth", action: "retry_auth", variant: "default" as const },
      { label: "View Policy", action: "view_policy", variant: "outline" as const },
    ],
    payload: { service: "org.freedesktop.PolicyKit1", error_code: "EPERM", user: "operator" },
  } : i % 7 === 0 ? {
    schema: {
      type: "object",
      title: "Connection Details",
      properties: {
        remote_ip: { type: "string", description: "Remote IP address" },
        tunnel: { type: "string", enum: ["wireguard", "direct", "proxy"], description: "Connection type" },
        latency_ms: { type: "number", minimum: 0, maximum: 500, description: "Latency" },
        authenticated: { type: "boolean", description: "Auth status" },
      },
    } as JsonSchema,
    payload: { remote_ip: "100.64.0.2", tunnel: "wireguard", latency_ms: 3.2, authenticated: true },
  } : undefined,
}));

export default function LogsPage() {
  const [filterText, setFilterText] = useState("");
  const [levelFilters, setLevelFilters] = useState<Record<LogLevel, boolean>>(
    Object.fromEntries(LEVELS.map((l) => [l, true])) as Record<LogLevel, boolean>
  );
  const [autoFollow, setAutoFollow] = useState(true);

  const toggleLevel = (level: LogLevel) => {
    setLevelFilters((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const needle = filterText.trim().toLowerCase();
  const filtered = MOCK_LOGS.filter((entry) => {
    if (!levelFilters[entry.level]) return false;
    if (!needle) return true;
    return [entry.message, entry.subsystem, entry.raw].join(" ").toLowerCase().includes(needle);
  });

  const levelColor = (level: LogLevel) => {
    switch (level) {
      case "error": case "fatal": return "text-danger";
      case "warn": return "text-warn";
      case "info": return "text-ok";
      case "debug": return "text-info";
      default: return "text-muted-foreground";
    }
  };

  return (
    <>
      <PageHeader title="Logs" subtitle="Live tail of gateway file logs." actions={
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">Refresh</button>
          <button className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">Export</button>
        </div>
      } />
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="space-y-1.5 min-w-[220px]">
            <span className="text-xs font-medium text-muted-foreground">Filter</span>
            <input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Search logs"
              className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none" />
          </label>
          <label className="flex items-center gap-2 mt-5">
            <input type="checkbox" checked={autoFollow} onChange={(e) => setAutoFollow(e.target.checked)} className="accent-primary" />
            <span className="text-xs text-muted-foreground">Auto-follow</span>
          </label>
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {LEVELS.map((level) => (
            <label key={level} className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer transition-colors",
              levelFilters[level] ? "border-border bg-muted/30 text-foreground" : "border-transparent text-muted-foreground opacity-50",
            )}>
              <input type="checkbox" checked={levelFilters[level]} onChange={() => toggleLevel(level)} className="hidden" />
              <span className={levelColor(level)}>●</span>
              {level}
            </label>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto bg-background" style={{ scrollbarWidth: "thin" }}>
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No log entries.</div>
          ) : filtered.map((entry) => (
            <LogRow key={entry.id} entry={entry} levelColor={levelColor} />
          ))}
        </div>
      </Card>
    </>
  );
}

interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  subsystem: string;
  message: string;
  raw: string;
  metadata?: {
    schema?: JsonSchema;
    payload?: Record<string, unknown>;
    actions?: Array<{ label: string; action: string; variant?: "default" | "outline" | "destructive" }>;
  };
}

function LogRow({ entry, levelColor }: { entry: LogEntry; levelColor: (l: LogLevel) => string }) {
  const hasExpandable = entry.metadata && (entry.metadata.schema || entry.metadata.actions);

  if (!hasExpandable) {
    return (
      <div className="flex items-baseline gap-3 px-3 py-1.5 border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors font-mono text-xs">
        <span className="text-muted-foreground w-20 shrink-0">{new Date(entry.time).toLocaleTimeString()}</span>
        <span className={cn("w-12 shrink-0 font-medium", levelColor(entry.level))}>{entry.level}</span>
        <span className="text-muted-foreground w-16 shrink-0 truncate">{entry.subsystem}</span>
        <span className="text-foreground flex-1 truncate">{entry.message}</span>
      </div>
    );
  }

  return (
    <Collapsible className="border-b border-border/50 last:border-0">
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-baseline gap-3 px-3 py-1.5 hover:bg-muted/10 transition-colors font-mono text-xs text-left group">
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground group-data-[state=open]:rotate-90 transition-transform mt-0.5" />
          <span className="text-muted-foreground w-20 shrink-0">{new Date(entry.time).toLocaleTimeString()}</span>
          <span className={cn("w-12 shrink-0 font-medium", levelColor(entry.level))}>{entry.level}</span>
          <span className="text-muted-foreground w-16 shrink-0 truncate">{entry.subsystem}</span>
          <span className="text-foreground flex-1 truncate">{entry.message}</span>
          {entry.metadata?.schema && <Wrench className="h-3 w-3 text-primary/50 shrink-0" />}
          {entry.metadata?.actions && <AlertTriangle className="h-3 w-3 text-warn/50 shrink-0" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-3 pt-1 ml-6 border-l-2 border-primary/20 space-y-3">
          {entry.metadata?.schema && entry.metadata.payload && (
            <SchemaRenderer
              schema={entry.metadata.schema}
              data={entry.metadata.payload}
              readOnly
            />
          )}
          {entry.metadata?.actions && (
            <div className="flex items-center gap-2">
              {entry.metadata.actions.map((act) => (
                <Button
                  key={act.action}
                  size="sm"
                  variant={act.variant === "destructive" ? "destructive" : act.variant === "outline" ? "outline" : "default"}
                  className="h-7 text-xs gap-1.5"
                  onClick={(e) => { e.stopPropagation(); console.log("Action:", act.action, entry.metadata?.payload); }}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          )}
          {!entry.metadata?.schema && entry.metadata?.payload && (
            <pre className="font-mono text-[11px] text-muted-foreground bg-muted/20 rounded-md p-2 whitespace-pre-wrap break-all">
              {JSON.stringify(entry.metadata.payload, null, 2)}
            </pre>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
