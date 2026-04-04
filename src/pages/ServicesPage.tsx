import { PageHeader, Card, Pill } from "@/components/shell/Primitives";

const MOCK_SERVICES = [
  { name: "org.freedesktop.DBus", bus: "system", pid: 1, uniqueName: ":1.0", interfaces: ["org.freedesktop.DBus", "org.freedesktop.DBus.Peer"] },
  { name: "org.freedesktop.systemd1", bus: "system", pid: 1, uniqueName: ":1.1", interfaces: ["org.freedesktop.systemd1.Manager"] },
  { name: "org.freedesktop.NetworkManager", bus: "system", pid: 842, uniqueName: ":1.5", interfaces: ["org.freedesktop.NetworkManager"] },
  { name: "org.freedesktop.login1", bus: "system", pid: 1, uniqueName: ":1.2", interfaces: ["org.freedesktop.login1.Manager"] },
  { name: "org.freedesktop.PolicyKit1", bus: "system", pid: 910, uniqueName: ":1.8", interfaces: ["org.freedesktop.PolicyKit1.Authority"] },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader title="Services" subtitle="D-Bus services tracked on system and session buses." actions={
        <button className="px-4 py-2 rounded-md border border-border bg-[hsl(var(--bg-elevated))] text-sm font-medium hover:bg-muted/30 transition-colors">Refresh</button>
      } />
      <Card>
        <div className="space-y-1">
          {MOCK_SERVICES.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-muted-foreground/20 transition-colors">
              <div className="min-w-0">
                <div className="font-mono text-sm font-medium text-foreground truncate">{svc.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">PID {svc.pid} · {svc.uniqueName} · {svc.interfaces.length} interfaces</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Pill>{svc.bus}</Pill>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
