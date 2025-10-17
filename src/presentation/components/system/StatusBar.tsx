interface StatusBarProps {
  busy: boolean;
  error?: string;
}

export const StatusBar = ({ busy, error }: StatusBarProps) => (
  <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
    <span className={`h-2 w-2 rounded-full ${busy ? "bg-highlight animate-pulse" : "bg-green-400"}`} />
    {error ? <span className="text-red-400">{error}</span> : <span>Workspace secure</span>}
  </div>
);
