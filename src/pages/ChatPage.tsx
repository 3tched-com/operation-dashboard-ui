import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader, Card, Callout, Pill } from "@/components/shell/Primitives";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import { useEventStore } from "@/stores/event-store";
import { cn } from "@/lib/utils";
import { Send, X, Plus, Maximize2, Minimize2 } from "lucide-react";

interface LocalMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown>; result?: unknown; status: string }>;
}

export default function ChatPage() {
  const { connected } = useEventStore();
  const [messages, setMessages] = useState<LocalMessage[]>([
    { id: "sys-1", role: "system", content: "Connected to Operation-DBUS control plane. Ready for commands.", timestamp: Date.now() },
  ]);
  const [draft, setDraft] = useState("");
  const [sessionKey, setSessionKey] = useState("default");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<unknown>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = () => {
    if (!draft.trim() || !connected) return;
    const userMsg: LocalMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: draft.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setSending(true);

    // Simulate response (will be replaced with real API)
    setTimeout(() => {
      const assistantMsg: LocalMessage = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: `Acknowledged. Processing command: "${userMsg.content}"`,
        timestamp: Date.now(),
        toolCalls: userMsg.content.toLowerCase().includes("tool") ? [
          { id: "tc-1", name: "dbus.list_services", arguments: { bus: "system" }, result: { services: ["org.freedesktop.DBus", "org.freedesktop.systemd1"] }, status: "completed" },
        ] : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSending(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openInSidebar = (data: unknown) => {
    setSidebarContent(data);
    setSidebarOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      {!focusMode && (
        <div className="flex items-end justify-between gap-4 px-4 py-3 border-b border-border shrink-0">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight leading-tight text-foreground">Chat</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Direct gateway chat session for quick interventions.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sessionKey}
              onChange={(e) => setSessionKey(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-input bg-card text-sm font-mono focus:border-ring outline-none"
            >
              <option value="default">default</option>
              <option value="agent:main">agent:main</option>
              <option value="debug">debug</option>
            </select>
            <button onClick={() => setFocusMode(!focusMode)} className="p-2 rounded-md hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors" title="Toggle focus mode">
              {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {focusMode && (
        <button onClick={() => setFocusMode(false)} className="absolute top-2 right-2 z-10 p-2 rounded-full bg-card border border-border hover:bg-muted/30 text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Chat body */}
      <div className={cn("flex flex-1 min-h-0", sidebarOpen && "gap-0")}>
        {/* Thread */}
        <div className={cn("flex flex-col flex-1 min-w-0", sidebarOpen && "flex-[0_0_60%]")}>
          <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" role="log">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onInspect={openInSidebar} />
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">AI</div>
                <div className="rounded-lg bg-card border border-border px-4 py-3 animate-[pulse-dot_1.5s_ease-in-out_infinite]">
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border px-4 py-3 shrink-0 bg-background">
            {!connected && <Callout variant="danger" className="mb-3">Connect to the gateway to start chatting.</Callout>}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!connected}
                  placeholder={connected ? "Message (↩ to send, Shift+↩ for line breaks)" : "Connect to gateway first…"}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-sm resize-none min-h-[44px] max-h-40 focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors font-sans"
                  rows={1}
                />
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setMessages([{ id: "sys-new", role: "system", content: "New session started.", timestamp: Date.now() }])} className="px-3 py-2 rounded-md border border-border bg-[hsl(var(--bg-elevated))] text-xs font-medium hover:bg-muted/30 transition-colors">
                  New session
                </button>
                <button onClick={handleSend} disabled={!connected || !draft.trim()} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {sending ? "Queue" : "Send"}<kbd className="text-[10px] bg-primary-foreground/20 px-1 rounded">↵</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — tool output inspector */}
        {sidebarOpen && (
          <div className="flex-[0_0_40%] border-l border-border bg-card flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inspector</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-muted/30 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {sidebarContent !== null ? (
                <JsonRenderer data={sidebarContent} />
              ) : (
                <div className="text-sm text-muted-foreground">Click a tool result to inspect.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, onInspect }: { message: LocalMessage; onInspect: (data: unknown) => void }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const time = new Date(message.timestamp).toLocaleTimeString();

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        isUser ? "bg-muted text-foreground" : "bg-primary/20 text-primary",
      )}>
        {isUser ? "OP" : "AI"}
      </div>
      <div className={cn("max-w-[75%] space-y-2", isUser && "text-right")}>
        <div className={cn(
          "rounded-lg px-4 py-2.5 text-sm",
          isUser ? "bg-primary/10 border border-primary/20 text-foreground" : "bg-card border border-border text-foreground",
        )}>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        {message.toolCalls?.map((tc) => (
          <button
            key={tc.id}
            onClick={() => onInspect(tc)}
            className="w-full text-left rounded-lg border border-border bg-muted/20 px-3 py-2 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Pill variant={tc.status === "completed" ? "ok" : tc.status === "error" ? "danger" : "default"}>
                {tc.status}
              </Pill>
              <span className="font-mono text-xs text-foreground">{tc.name}</span>
            </div>
            {tc.result && (
              <pre className="mt-1.5 font-mono text-[11px] text-muted-foreground truncate">{JSON.stringify(tc.result).slice(0, 100)}</pre>
            )}
          </button>
        ))}
        <div className="text-[10px] text-muted-foreground">{time}</div>
      </div>
    </div>
  );
}
