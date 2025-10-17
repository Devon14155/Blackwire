interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar = ({ onOpenSettings }: SidebarProps) => (
  <aside className="hidden w-64 flex-col border-r border-white/5 bg-black/40 px-6 py-8 lg:flex">
    <div className="mb-8 flex items-center gap-3 text-sm text-white/60">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent shadow-glow">
        ∞
      </span>
      <div>
        <p className="text-xs uppercase tracking-widest text-white/40">NSTAR</p>
        <p className="font-semibold">Continuum</p>
      </div>
    </div>
    <nav className="flex flex-1 flex-col gap-2 text-sm">
      <button className="group flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-left font-medium text-white transition hover:bg-white/10">
        <span className="h-2 w-2 rounded-full bg-green-400 shadow-glow" />
        Live Chat
      </button>
      <button
        onClick={onOpenSettings}
        className="group flex items-center gap-3 rounded-lg px-3 py-2 text-left text-white/70 transition hover:bg-white/10"
      >
        <span className="h-2 w-2 rounded-full bg-highlight/70" />
        Settings
      </button>
    </nav>
    <div className="mt-auto space-y-2 text-xs text-white/40">
      <p>Offline-ready</p>
      <p>Bring your own model</p>
      <p>No telemetry</p>
    </div>
  </aside>
);
