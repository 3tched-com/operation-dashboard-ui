import { PageHeader, Card } from "@/components/shell/Primitives";
import { StateProjectionPanel } from "@/components/json/StateProjectionPanel";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { useEventStore } from "@/stores/event-store";

function inferSchema(data: unknown): any {
  if (data === null || data === undefined) return { type: "string" };
  if (typeof data === "boolean") return { type: "boolean" };
  if (typeof data === "number") return { type: "number", minimum: 0, maximum: 100 };
  if (typeof data === "string") return { type: "string" };
  if (Array.isArray(data)) return { type: "array", items: data.length > 0 ? inferSchema(data[0]) : { type: "string" } };
  if (typeof data === "object") {
    const props: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      props[k] = inferSchema(v);
    }
    return { type: "object", properties: props };
  }
  return { type: "string" };
}

export default function StatePage() {
  const { latestState, events } = useEventStore();
  const stateUpdates = events.filter((e) => e.event === "state_update");

  return (
    <>
      <PageHeader title="State" subtitle="Live state projections rendered as interactive UI components." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StateProjectionPanel state={latestState} />
        <Card title="Recent Changes" subtitle="Latest state_update events rendered with SchemaRenderer.">
          <div className="space-y-3 mt-2 max-h-[400px] overflow-auto">
            {stateUpdates.length === 0 ? (
              <div className="text-sm text-muted-foreground">No state changes yet.</div>
            ) : stateUpdates.slice(-20).reverse().map((evt) => (
              <div key={evt.id} className="border-b border-border/30 pb-2 last:border-0">
                <div className="text-[11px] font-mono text-muted-foreground mb-1">
                  {new Date(evt.ts).toLocaleTimeString()}
                </div>
                {evt.payload && typeof evt.payload === "object" ? (
                  <SchemaRenderer
                    schema={inferSchema(evt.payload)}
                    data={evt.payload}
                    readOnly
                  />
                ) : (
                  <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(evt.payload, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
