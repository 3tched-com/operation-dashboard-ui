import { PageHeader, Card, Pill } from "@/components/shell/Primitives";

export default function SecurityPage() {
  return (
    <>
      <PageHeader title="Security" subtitle="Security audit, exec approvals, and access controls." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Security Audit" subtitle="Last scan results.">
          <div className="space-y-2 mt-3">
            <div className="flex justify-between p-2 border-b border-border"><span className="text-sm text-muted-foreground">Critical</span><Pill variant="ok">0</Pill></div>
            <div className="flex justify-between p-2 border-b border-border"><span className="text-sm text-muted-foreground">Warnings</span><Pill variant="warn">2</Pill></div>
            <div className="flex justify-between p-2"><span className="text-sm text-muted-foreground">Info</span><Pill>5</Pill></div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground font-mono">Run <code className="text-primary">operation-dbus security audit --deep</code> for details.</div>
        </Card>
        <Card title="Exec Approvals" subtitle="Pending command execution approvals.">
          <div className="text-sm text-muted-foreground mt-2">No pending approvals.</div>
        </Card>
      </div>
    </>
  );
}
