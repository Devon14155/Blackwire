import { useEffect, useRef } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Trash2, Bot, Lightbulb, Database, Zap } from "lucide-react";
import { ChatMessage } from "@presentation/components/chat/ChatMessage";
import { ChatComposer } from "@presentation/components/chat/ChatComposer";
import { useChatStore } from "@presentation/state/chatStore";
import { useAppStore } from "@presentation/state/appStore";
import { cn } from "@presentation/lib/cn";

const agentBadges = [
  { id: "atlas", name: "Atlas", type: "planning", icon: "🎯", color: "text-blue-400" },
  { id: "nova", name: "Nova", type: "executor", icon: "⚡", color: "text-yellow-400" },
  { id: "echo", name: "Echo", type: "reviewer", icon: "🔍", color: "text-purple-400" },
  { id: "sage", name: "Sage", type: "general", icon: "🧠", color: "text-green-400" }
];

export const CommandCenter = () => {
  const messages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const clearConversation = useChatStore((state) => state.clearConversation);
  const loading = useChatStore((state) => state.loading);
  const settings = useChatStore((state) => state.settings);
  const embeddingStatus = useAppStore((state) => state.embeddingStatus);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ragEnabled = settings?.enableRAG ?? false;
  const toolCallingEnabled = settings?.enableToolCalling ?? false;

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea.Root className="flex-1">
        <ScrollArea.Viewport ref={viewportRef} className="h-full w-full px-6 py-10">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {messages.length === 0 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-dashed border-white/10 bg-black/40 p-8 text-center text-sm text-white/50">
                  <p className="font-medium text-white/70">Welcome to Horizon Command Center</p>
                  <p className="mt-2">Chat with AI agents that can help you plan, execute, and review.</p>
                  <p className="mt-1">Your data stays local - nothing leaves your device.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {agentBadges.map((agent) => (
                    <div
                      key={agent.id}
                      className="rounded-xl border border-white/5 bg-white/5 p-4 transition hover:border-highlight/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{agent.icon}</span>
                        <span className={cn("font-medium", agent.color)}>{agent.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-white/40 capitalize">{agent.type} agent</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className="flex touch-none select-none bg-white/5 transition hover:bg-white/10"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-white/20" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      <div className="border-t border-white/10 bg-black/30 px-6 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-white/40">
              {ragEnabled && (
                <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-green-400">
                  <Database className="h-3 w-3" />
                  RAG
                </span>
              )}
              {toolCallingEnabled && (
                <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-blue-400">
                  <Zap className="h-3 w-3" />
                  Tools
                </span>
              )}
              {embeddingStatus === "ready" && (
                <span className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2 py-1 text-purple-400">
                  <Lightbulb className="h-3 w-3" />
                  Embeddings
                </span>
              )}
            </div>
            <button
              onClick={() => void clearConversation()}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>
          <ChatComposer busy={loading} onSubmit={sendMessage} />
        </div>
      </div>
    </section>
  );
};