import { useState } from "react";
import { PageHeader, Card } from "@/components/shell/Primitives";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import { EventTape } from "@/components/json/EventTape";
import { useEventStore } from "@/stores/event-store";

export default function InspectorPage() {
  const { events, health, latestStats } = useEventStore();
  const [callMethod, setCallMethod] = useState("");
  const [callParams, setCallParams] = useState("{}");
  const [callResult, setCallResult] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const handleCall = () => {
    try {
      JSON.parse(callParams);
      setCallResult(JSON.stringify({ method: callMethod, result: "Simulated RPC response", ts: Date.now() }, null, 2));
      setCallError(null);
    } catch { setCallError("Invalid JSON params"); setCallResult(null); }
  };

  return (
    <>
      <PageHeader title="Inspector" subtitle="Gateway snapshots, events, and manual RPC calls." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Snapshots" subtitle="Status, health, and heartbeat data." actions={
          <button className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">Refresh</button>
        }>
          <div className="space-y-3 mt-3">
            <div><div className="text-xs text-muted-foreground mb-1">Health</div>
              <pre className="font-mono text-xs bg-muted/30 rounded-md p-3 overflow-auto max-h-48 whitespace-pre-wrap">{JSON.stringify(health ?? {}, null, 2)}</pre>
            </div>
            <div><div className="text-xs text-muted-foreground mb-1">Latest Stats</div>
              <pre className="font-mono text-xs bg-muted/30 rounded-md p-3 overflow-auto max-h-48 whitespace-pre-wrap">{JSON.stringify(latestStats ?? {}, null, 2)}</pre>
            </div>
          </div>
        </Card>

        <Card title="Manual RPC" subtitle="Send a raw gateway method with JSON params.">
          <div className="grid grid-cols-1 gap-3 mt-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Method</span>
              <input value={callMethod} onChange={(e) => setCallMethod(e.target.value)} placeholder="system-presence"
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-mono focus:border-ring outline-none" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Params (JSON)</span>
              <textarea value={callParams} onChange={(e) => setCallParams(e.target.value)} rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-mono focus:border-ring outline-none resize-y" />
            </label>
          </div>
          <button onClick={handleCall} className="mt-3 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Call</button>
          {callError && <div className="mt-3 rounded-lg border border-danger/20 bg-danger/10 text-danger text-sm px-4 py-2">{callError}</div>}
          {callResult && <pre className="mt-3 font-mono text-xs bg-muted/30 rounded-md p-3 overflow-auto max-h-48 whitespace-pre-wrap">{callResult}</pre>}
        </Card>
      </div>
      <EventTape events={events} />
    </>
  );
}
