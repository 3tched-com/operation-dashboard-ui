import { PageHeader, Card } from "@/components/shell/Primitives";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import { useEventStore } from "@/stores/event-store";

export default function StatePage() {
  const { latestState, events } = useEventStore();
  const stateUpdates = events.filter((e) => e.event === "state_update");

  return (
    <>
      <PageHeader title="State" subtitle="Live state projections and recent state changes." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Current State" subtitle="Derived current-truth from state_update events.">
          {Object.keys(latestState).length > 0 ? (
            <JsonRenderer data={latestState} className="mt-2" />
          ) : (
            <div className="text-sm text-muted-foreground mt-2">No state updates received. State is projected from SSE state_update events.</div>
          )}
        </Card>
        <Card title="Recent Changes" subtitle="Latest state_update events.">
          <div className="space-y-1 mt-2 max-h-[400px] overflow-auto">
            {stateUpdates.length === 0 ? (
              <div className="text-sm text-muted-foreground">No state changes yet.</div>
            ) : stateUpdates.slice(-20).reverse().map((evt) => (
              <details key={evt.id} className="border-b border-border last:border-0">
                <summary className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-muted/20 text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground">{new Date(evt.ts).toLocaleTimeString()}</span>
                  <span className="font-mono text-xs text-foreground truncate">{JSON.stringify(evt.payload)?.slice(0, 60)}</span>
                </summary>
                <pre className="px-2 pb-2 font-mono text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(evt.payload, null, 2)}</pre>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
