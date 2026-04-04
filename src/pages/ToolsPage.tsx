import { useState } from "react";
import { PageHeader, Card, Callout, Pill } from "@/components/shell/Primitives";
import { SchemaPanel } from "@/components/json/SchemaPanel";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import type { Tool, JsonSchema } from "@/types/api";

const MOCK_TOOLS: Tool[] = [
  { id: "dbus.list_services", name: "dbus.list_services", description: "List all D-Bus services on system and session buses.", inputSchema: { type: "object", properties: { bus: { type: "string", enum: ["system", "session"], description: "Which bus to query" } }, required: ["bus"] }, category: "dbus", enabled: true, source: "builtin" },
  { id: "dbus.introspect", name: "dbus.introspect", description: "Introspect a D-Bus service to discover interfaces, methods, signals.", inputSchema: { type: "object", properties: { service: { type: "string", description: "Service name" }, path: { type: "string", default: "/", description: "Object path" } }, required: ["service"] }, category: "dbus", enabled: true, source: "builtin" },
  { id: "dbus.call_method", name: "dbus.call_method", description: "Call a method on a D-Bus interface.", inputSchema: { type: "object", properties: { service: { type: "string" }, path: { type: "string" }, interface: { type: "string" }, method: { type: "string" }, args: { type: "array", items: { type: "string" } } }, required: ["service", "path", "interface", "method"] }, category: "dbus", enabled: true, source: "builtin" },
  { id: "system.exec", name: "system.exec", description: "Execute a system command with approval.", inputSchema: { type: "object", properties: { command: { type: "string" }, timeout: { type: "number", default: 30 } }, required: ["command"] }, category: "system", enabled: true, source: "builtin" },
  { id: "mcp.query", name: "mcp.query", description: "Query an MCP-connected service.", inputSchema: { type: "object", properties: { server: { type: "string" }, method: { type: "string" }, params: { type: "object" } }, required: ["server", "method"] }, category: "mcp", enabled: false, source: "mcp" },
];

export default function ToolsPage() {
  const [filter, setFilter] = useState("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [execResult, setExecResult] = useState<unknown>(null);
  const [execArgs, setExecArgs] = useState("{}");

  const filtered = MOCK_TOOLS.filter((t) =>
    [t.name, t.description, t.category].join(" ").toLowerCase().includes(filter.toLowerCase())
  );

  const handleExecute = () => {
    if (!selectedTool) return;
    try {
      const parsed = JSON.parse(execArgs);
      setExecResult({ tool: selectedTool.name, input: parsed, output: { status: "ok", data: { message: "Simulated result" } }, duration: "42ms" });
    } catch { setExecResult({ error: "Invalid JSON arguments" }); }
  };

  return (
    <>
      <PageHeader title="Tools" subtitle="Searchable tool catalog with schema-first execution." />
      <Card>
        <div className="flex items-center justify-between">
          <div><div className="text-[15px] font-semibold text-foreground">Tool Catalog</div><div className="text-[13px] text-muted-foreground mt-1">Schema-driven tools exposed by the control plane.</div></div>
        </div>
        <div className="mt-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Filter</span>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search tools" className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none" />
          </label>
          <div className="text-xs text-muted-foreground mt-2">{filtered.length} shown</div>
        </div>
        <div className="mt-4 space-y-2">
          {filtered.map((tool) => (
            <button key={tool.id} onClick={() => { setSelectedTool(tool); setExecResult(null); setExecArgs("{}"); }}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTool?.id === tool.id ? "border-primary/30 bg-primary/5" : "border-border hover:border-muted-foreground/20"}`}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">{tool.name}</span>
                <Pill variant={tool.enabled ? "ok" : "default"}>{tool.enabled ? "enabled" : "disabled"}</Pill>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tool.source}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{tool.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {selectedTool && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <SchemaPanel schema={selectedTool.inputSchema} />
            <Card title="Execute" subtitle="Run this tool with JSON arguments.">
              <label className="space-y-1.5 mt-2 block">
                <span className="text-xs font-medium text-muted-foreground">Arguments (JSON)</span>
                <textarea value={execArgs} onChange={(e) => setExecArgs(e.target.value)} rows={6}
                  className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-mono focus:border-ring outline-none resize-y min-h-[120px]" />
              </label>
              <button onClick={handleExecute} className="mt-3 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Execute</button>
            </Card>
          </div>
          {execResult && (
            <Card title="Result" subtitle="Execution output.">
              <JsonRenderer data={execResult} className="mt-2" />
            </Card>
          )}
        </div>
      )}
    </>
  );
}
