import type { Message } from "@domain/entities/Message";
import { cn } from "@presentation/lib/cn";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isAssistant = message.role === "assistant";
  const bubbleClasses = cn(
    "relative max-w-3xl rounded-3xl px-6 py-4 text-sm leading-relaxed shadow-lg transition",
    isAssistant
      ? "ml-0 bg-white/5 text-white/90 backdrop-blur"
      : "ml-auto bg-highlight text-black"
  );

  return (
    <div className={cn("flex w-full", isAssistant ? "justify-start" : "justify-end")}> 
      <div className={bubbleClasses}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.pending && <span className="absolute -bottom-2 right-6 h-2 w-2 animate-ping rounded-full bg-highlight" />}
        {message.error && <p className="mt-2 text-xs text-red-400">{message.error}</p>}
      </div>
    </div>
  );
};
