import { useState } from "react";
import { PageHeader, Card, Pill, StatCard, Callout } from "@/components/shell/Primitives";
import { JsonRenderer } from "@/components/json/JsonRenderer";

const MOCK_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", contextWindow: 128000, active: true },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", contextWindow: 128000, active: false },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", contextWindow: 200000, active: false },
];

export default function LlmPage() {
  const [activeModel, setActiveModel] = useState("gpt-4o");
  return (
    <>
      <PageHeader title="LLM" subtitle="Provider status, available models, and routing." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Active Model" value={activeModel} variant="ok" />
        <StatCard label="Provider" value="openai" />
        <StatCard label="Context Window" value="128k" />
      </div>
      <Card title="Models" subtitle="Available models from configured providers.">
        <div className="space-y-2 mt-3">
          {MOCK_MODELS.map((m) => (
            <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${m.id === activeModel ? "border-primary/30 bg-primary/5" : "border-border"}`}>
              <div>
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{m.provider} · {(m.contextWindow / 1000)}k context</div>
              </div>
              <div className="flex items-center gap-2">
                {m.id === activeModel ? <Pill variant="ok">active</Pill> : (
                  <button onClick={() => setActiveModel(m.id)} className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">Switch</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
