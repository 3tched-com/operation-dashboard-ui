import { useState } from "react";
import { PageHeader, Card, Pill, Callout } from "@/components/shell/Primitives";
import { cn } from "@/lib/utils";
import { Settings, Shield, Zap, Bot, Globe, Terminal } from "lucide-react";

const SECTIONS = [
  { key: "env", label: "Environment", icon: Globe },
  { key: "auth", label: "Authentication", icon: Shield },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "tools", label: "Tools", icon: Zap },
  { key: "gateway", label: "Gateway", icon: Terminal },
];

const MOCK_CONFIG: Record<string, Record<string, unknown>> = {
  env: { logLevel: "info", dataDir: "/var/lib/operation-dbus", pidFile: "/run/operation-dbus.pid" },
  auth: { mode: "wireguard", trustedProxy: true, allowedCidrs: ["100.64.0.0/10"] },
  agents: { defaultModel: "gpt-4o", maxConcurrent: 5, sessionTimeout: 3600 },
  tools: { approvalRequired: ["system.exec"], autoEnable: true },
  gateway: { listenAddr: "127.0.0.1:18789", wsEnabled: true, sseEnabled: true },
};

export default function ConfigPage() {
  const [activeSection, setActiveSection] = useState("env");
  const [mode, setMode] = useState<"form" | "raw">("form");
  const [rawValue, setRawValue] = useState(JSON.stringify(MOCK_CONFIG, null, 2));

  const sectionData = MOCK_CONFIG[activeSection] || {};

  return (
    <>
      <PageHeader title="Config" subtitle="Edit control plane configuration safely." />
      <div className="grid grid-cols-[260px_1fr] gap-0 rounded-xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        {/* Sidebar */}
        <div className="flex flex-col border-r border-border bg-secondary/30 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Settings</span>
            <Pill variant="ok">valid</Pill>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5">
            {SECTIONS.map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[13px] font-medium transition-colors",
                  activeSection === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30")}>
                <s.icon className="h-[18px] w-[18px] opacity-70" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <div className="flex rounded-md border border-border bg-card overflow-hidden">
              {(["form", "raw"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn("flex-1 py-2 text-xs font-semibold transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{m === "form" ? "Form" : "Raw"}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-foreground">{SECTIONS.find((s) => s.key === activeSection)?.label}</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">Reload</button>
              <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">Save</button>
              <button className="px-3 py-1.5 rounded-md border border-primary/30 text-primary text-xs font-medium hover:bg-primary/10 transition-colors">Apply</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {mode === "raw" ? (
              <textarea value={rawValue} onChange={(e) => setRawValue(e.target.value)}
                className="w-full h-full min-h-[500px] px-3 py-2 rounded-md border border-input bg-card text-sm font-mono resize-y focus:border-ring outline-none" />
            ) : (
              <div className="space-y-4">
                {Object.entries(sectionData).map(([key, val]) => (
                  <label key={key} className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{key}</span>
                    {typeof val === "boolean" ? (
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked={val} className="accent-primary" />
                        <span className="text-sm text-foreground">{String(val)}</span>
                      </div>
                    ) : Array.isArray(val) ? (
                      <input defaultValue={val.join(", ")} className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-mono focus:border-ring outline-none" />
                    ) : (
                      <input defaultValue={String(val)} className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-mono focus:border-ring outline-none" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
