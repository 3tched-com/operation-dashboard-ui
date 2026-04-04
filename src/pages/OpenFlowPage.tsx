import { useState, useMemo } from "react";
import { PageHeader, Card } from "@/components/shell/Primitives";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { useEventStore } from "@/stores/event-store";
import { ChevronRight, Plus, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowEntry {
  id: string;
  table: number;
  priority: number;
  match_fields: Record<string, string>;
  actions: string[];
  packet_count: number;
  byte_count: number;
}

interface FlowTable {
  id: number;
  name: string;
  flows: FlowEntry[];
}

const DEFAULT_GLOBAL_CONFIG = {
  controller: "tcp:127.0.0.1:6653",
  fail_mode: "secure",
  stp_enable: false,
  flow_eviction_threshold: 2500,
  n_tables: 254,
  protocols: "OpenFlow13,OpenFlow15",
};

const globalConfigSchema = {
  type: "object",
  properties: {
    controller: { type: "string", title: "Controller" },
    fail_mode: { type: "string", title: "Fail Mode", enum: ["secure", "standalone"] },
    stp_enable: { type: "boolean", title: "STP Enabled" },
    flow_eviction_threshold: { type: "number", title: "Flow Eviction Threshold" },
    protocols: { type: "string", title: "Protocols" },
  },
};

const flowEntrySchema = {
  type: "object",
  properties: {
    table: { type: "number", title: "Table ID", minimum: 0, maximum: 254 },
    priority: { type: "number", title: "Priority", minimum: 0, maximum: 65535 },
    in_port: { type: "string", title: "In Port" },
    dl_src: { type: "string", title: "Source MAC" },
    dl_dst: { type: "string", title: "Destination MAC" },
    dl_type: { type: "string", title: "EtherType", enum: ["0x0800", "0x0806", "0x86dd"] },
    nw_src: { type: "string", title: "Source IP (CIDR)" },
    nw_dst: { type: "string", title: "Destination IP (CIDR)" },
    nw_proto: { type: "number", title: "IP Protocol" },
    tp_dst: { type: "number", title: "Destination Port" },
    actions: { type: "string", title: "Actions (comma-separated)" },
  },
};

const DEFAULT_TABLES: FlowTable[] = [
  { id: 0, name: "Classifier", flows: [
    { id: "f1", table: 0, priority: 100, match_fields: { dl_type: "0x0800", nw_dst: "10.10.0.0/24" }, actions: ["resubmit(,1)"], packet_count: 145230, byte_count: 18200000 },
    { id: "f2", table: 0, priority: 50, match_fields: { dl_type: "0x0806" }, actions: ["NORMAL"], packet_count: 3400, byte_count: 204000 },
    { id: "f3", table: 0, priority: 0, match_fields: {}, actions: ["drop"], packet_count: 890, byte_count: 53400 },
  ] },
  { id: 1, name: "Routing", flows: [
    { id: "f4", table: 1, priority: 200, match_fields: { nw_dst: "10.10.0.2" }, actions: ["output:2"], packet_count: 80200, byte_count: 9600000 },
    { id: "f5", table: 1, priority: 200, match_fields: { nw_dst: "10.10.0.3" }, actions: ["output:3"], packet_count: 65030, byte_count: 8580000 },
    { id: "f6", table: 1, priority: 100, match_fields: { nw_dst: "10.10.0.0/24" }, actions: ["resubmit(,2)"], packet_count: 12000, byte_count: 1440000 },
  ] },
  { id: 2, name: "Security", flows: [
    { id: "f7", table: 2, priority: 300, match_fields: { nw_src: "10.10.0.0/24", tp_dst: "22" }, actions: ["output:1"], packet_count: 500, byte_count: 32000 },
    { id: "f8", table: 2, priority: 0, match_fields: {}, actions: ["drop"], packet_count: 120, byte_count: 7200 },
  ] },
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function OpenFlowPage() {
  const { latestState } = useEventStore();
  const [globalConfig, setGlobalConfig] = useState(DEFAULT_GLOBAL_CONFIG);
  const [addFlowOpen, setAddFlowOpen] = useState(false);
  const [newFlow, setNewFlow] = useState<Record<string, unknown>>({});
  const [openTables, setOpenTables] = useState<Record<number, boolean>>({ 0: true });

  const tables = useMemo(() => {
    const live = latestState["openflow.tables"] ?? latestState["openflow:tables"];
    if (Array.isArray(live)) return live as FlowTable[];
    return DEFAULT_TABLES;
  }, [latestState]);

  return (
    <>
      <PageHeader title="OpenFlow" subtitle="Flow table explorer and rule management." />

      <Card title="Global Configuration" subtitle="OpenFlow controller and protocol settings." actions={
        <Badge variant="outline" className="text-[10px] font-mono">{globalConfig.protocols}</Badge>
      }>
        <div className="mt-3">
          <SchemaRenderer
            schema={globalConfigSchema as any}
            data={globalConfig}
            onChange={(v) => setGlobalConfig(v as typeof globalConfig)}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between mt-6 mb-3">
        <h3 className="text-sm font-semibold text-foreground">Flow Tables</h3>
        <button onClick={() => { setAddFlowOpen(true); setNewFlow({}); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">
          <Plus className="h-3 w-3" /> Add Flow
        </button>
      </div>

      <div className="space-y-3">
        {tables.map((table) => (
          <Collapsible key={table.id} open={openTables[table.id] ?? false} onOpenChange={(o) => setOpenTables((p) => ({ ...p, [table.id]: o }))}>
            <CollapsibleTrigger className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2">
                <ChevronRight className={cn("h-4 w-4 transition-transform text-muted-foreground", openTables[table.id] && "rotate-90")} />
                <span className="text-sm font-semibold text-foreground">Table {table.id}</span>
                <span className="text-xs text-muted-foreground">— {table.name}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{table.flows.length} flows</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-6 mt-2 space-y-2">
                {table.flows.map((flow) => (
                  <div key={flow.id} className="rounded-md border border-border bg-muted/10 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-mono">pri={flow.priority}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{formatCount(flow.packet_count)} pkts / {formatCount(flow.byte_count)} bytes</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase mr-1">Match:</span>
                      {Object.keys(flow.match_fields).length === 0 ? (
                        <Badge variant="outline" className="text-[10px]">any</Badge>
                      ) : Object.entries(flow.match_fields).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-[10px] font-mono">{k}={v}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase mr-1">Actions:</span>
                      {flow.actions.map((a, i) => (
                        <Badge key={i} className="text-[10px] font-mono bg-primary/15 text-primary border-primary/20">{a}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <Dialog open={addFlowOpen} onOpenChange={setAddFlowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Flow Entry</DialogTitle>
            <DialogDescription>Define match fields and actions for a new OpenFlow rule.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <SchemaRenderer schema={flowEntrySchema as any} data={newFlow} onChange={(v) => setNewFlow(v as Record<string, unknown>)} />
          </div>
          <div className="flex justify-end mt-4">
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Add Flow</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
