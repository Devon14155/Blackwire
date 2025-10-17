import { useEffect, useRef } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Trash2 } from "lucide-react";
import { ChatMessage } from "@presentation/components/chat/ChatMessage";
import { ChatComposer } from "@presentation/components/chat/ChatComposer";
import { useChatStore } from "@presentation/state/chatStore";

export const ChatView = () => {
  const messages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const clearConversation = useChatStore((state) => state.clearConversation);
  const loading = useChatStore((state) => state.loading);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea.Root className="flex-1">
        <ScrollArea.Viewport ref={viewportRef} className="h-full w-full px-6 py-10">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {messages.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/40 p-8 text-center text-sm text-white/50">
                <p className="font-medium text-white/70">Welcome to NSTAR Continuum</p>
                <p className="mt-2">Connect any chat-completion compatible model by configuring settings.</p>
                <p className="mt-1">Your history persists locally and never leaves this device.</p>
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
      <div className="border-t border-white/10 bg-black/30 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="flex justify-end">
            <button
              onClick={() => void clearConversation()}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Clear conversation
            </button>
          </div>
          <ChatComposer busy={loading} onSubmit={sendMessage} />
        </div>
      </div>
    </section>
  );
};
