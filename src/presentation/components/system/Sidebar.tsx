import { 
  MessageSquare, 
  GraduationCap, 
  BrainCircuit, 
  FolderKanban, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useAppStore, type Section } from "@presentation/state/appStore";
import { cn } from "@presentation/lib/cn";

interface SidebarProps {
  onOpenSettings: () => void;
}

const navItems: Array<{
  id: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "command",
    label: "Command Center",
    icon: MessageSquare,
    description: "Chat with AI agents"
  },
  {
    id: "learning",
    label: "Learning Studio",
    icon: GraduationCap,
    description: "Study and review"
  },
  {
    id: "knowledge",
    label: "Knowledge Organizer",
    icon: BrainCircuit,
    description: "Notes and whiteboards"
  },
  {
    id: "tasks",
    label: "File & Task Manager",
    icon: FolderKanban,
    description: "Organize your work"
  }
];

export const Sidebar = ({ onOpenSettings }: SidebarProps) => {
  const activeSection = useAppStore((state) => state.activeSection);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-white/5 bg-black/40 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
        {sidebarOpen && (
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-highlight/20 text-highlight shadow-glow">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">HORIZON</p>
              <p className="font-semibold text-white/80">PWA</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white/60"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                isActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-highlight" : "")} />
              {sidebarOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{item.label}</span>
                  <span className="truncate text-xs text-white/40">{item.description}</span>
                </div>
              )}
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-highlight shadow-glow" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-2">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-white/60 transition hover:bg-white/5 hover:text-white/80"
          title={!sidebarOpen ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span className="text-sm">Settings</span>}
        </button>
      </div>

      {sidebarOpen && (
        <div className="border-t border-white/5 p-4 text-xs text-white/30">
          <p>Offline-ready</p>
          <p>Local-first storage</p>
          <p>Zero telemetry</p>
        </div>
      )}
    </aside>
  );
};