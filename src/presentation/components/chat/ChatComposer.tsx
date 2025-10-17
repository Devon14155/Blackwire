import { FormEvent, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";

interface ChatComposerProps {
  busy: boolean;
  onSubmit: (value: string) => Promise<void>;
}

export const ChatComposer = ({ busy, onSubmit }: ChatComposerProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const performSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || busy) {
      return;
    }
    await onSubmit(trimmed);
    setValue("");
    textareaRef.current?.focus();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await performSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="relative rounded-3xl border border-white/10 bg-black/60 p-4 shadow-glow">
      <textarea
        ref={textareaRef}
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={async (event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            await performSubmit();
          }
        }}
        placeholder="Send a message to your selected model…"
        className="h-24 w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:white/40 focus:outline-none"
        disabled={busy}
      />
      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
        <p>Shift + Enter for newline</p>
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="flex items-center gap-2 rounded-full bg-highlight px-4 py-2 font-semibold text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/30"
        >
          Send
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};
