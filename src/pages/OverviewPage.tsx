import { PageHeader, Card, StatCard, Callout } from "@/components/shell/Primitives";
import { EventTape } from "@/components/json/EventTape";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import { useEventStore } from "@/stores/event-store";

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function OverviewPage() {
  const { connected, health, events, latestState, latestStats, lastError } = useEventStore();

  return (
    <>
      <PageHeader title="Overview" subtitle="Gateway status, entry points, and a fast health read." />

      {lastError && <Callout variant="danger">{lastError}</Callout>}

      {/* Connection + Snapshot — OpenClaw grid-cols-2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Gateway Access" subtitle="Where the dashboard connects and how it authenticates.">
          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">API Endpoint</span>
              <input
                readOnly
                defaultValue={window.location.origin}
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-mono focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Auth Mode</span>
              <input
                readOnly
                defaultValue="WireGuard (trusted-proxy)"
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-mono focus:border-ring outline-none"
              />
            </label>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button className="px-4 py-2 rounded-md border border-border bg-[hsl(var(--bg-elevated))] text-sm font-medium hover:bg-muted/30 hover:border-muted-foreground/20 transition-all active:translate-y-0">
              Refresh
            </button>
            <span className="text-xs text-muted-foreground">Authenticated via WireGuard tunnel.</span>
          </div>
        </Card>

        <Card title="Snapshot" subtitle="Latest gateway handshake information.">
          <div className="grid grid-cols-2 gap-3 mt-3">
            <StatCard label="Status" value={connected ? "Connected" : "Disconnected"} variant={connected ? "ok" : "warn"} />
            <StatCard label="Uptime" value={health?.uptimeMs ? formatUptime(health.uptimeMs) : "n/a"} />
            <StatCard label="Version" value={health?.version || "n/a"} />
            <StatCard label="Memory" value={health?.memoryMb ? `${health.memoryMb} MB` : "n/a"} />
          </div>
          {!connected && !lastError && (
            <Callout className="mt-3">Connect to the control plane to see live data.</Callout>
          )}
        </Card>
      </div>

      {/* Quick stats — OpenClaw grid-cols-3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Services</div>
            <div className="text-2xl font-bold tracking-tight">{health?.services ?? "n/a"}</div>
            <div className="text-xs text-muted-foreground">D-Bus services tracked on system and session buses.</div>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Agents</div>
            <div className="text-2xl font-bold tracking-tight">{health?.agents ?? "n/a"}</div>
            <div className="text-xs text-muted-foreground">Active agent workspaces.</div>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sessions</div>
            <div className="text-2xl font-bold tracking-tight">{health?.activeSessions ?? "n/a"}</div>
            <div className="text-xs text-muted-foreground">Active chat sessions with the control plane.</div>
          </div>
        </Card>
      </div>

      {/* Event tape + state projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventTape events={events} />
        <Card title="Current State" subtitle="Latest state projections by key.">
          {Object.keys(latestState).length > 0 ? (
            <JsonRenderer data={latestState} className="mt-2" />
          ) : (
            <div className="text-sm text-muted-foreground mt-2">No state updates received yet.</div>
          )}
        </Card>
      </div>

      {/* System stats */}
      {latestStats && (
        <Card title="System Stats" subtitle="Latest system statistics from the event stream.">
          <JsonRenderer data={latestStats} className="mt-2" />
        </Card>
      )}

      {/* Notes — OpenClaw style */}
      <Card title="Notes" subtitle="Quick reminders for control plane setups.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            <div className="text-sm font-semibold text-foreground">WireGuard tunnel</div>
            <div className="text-xs text-muted-foreground mt-1">All API access goes through the WireGuard mesh. No external exposure needed.</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Session hygiene</div>
            <div className="text-xs text-muted-foreground mt-1">Use /new or session patch to reset context between agent runs.</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Schema-first tools</div>
            <div className="text-xs text-muted-foreground mt-1">Every tool exposes input_schema. Execution forms are generated from schema.</div>
          </div>
        </div>
      </Card>
    </>
  );
}
