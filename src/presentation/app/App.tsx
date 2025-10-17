import { useEffect, useMemo, useState } from "react";
import { DependencyProvider } from "@presentation/di/DependencyContext";
import { container } from "@presentation/di/container";
import { useChatStore } from "@presentation/state/chatStore";
import { ChatView } from "@presentation/components/chat/ChatView";
import { SettingsSheet } from "@presentation/components/settings/SettingsSheet";
import { StatusBar } from "@presentation/components/system/StatusBar";
import { Sidebar } from "@presentation/components/system/Sidebar";
import { ThemeToggle } from "@presentation/components/system/ThemeToggle";

export const App = () => {
  const initialize = useChatStore((state) => state.initialize);
  const loading = useChatStore((state) => state.loading);
  const error = useChatStore((state) => state.error);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    initialize().catch((err) => console.error("Failed to initialize", err));
  }, [initialize]);

  const dependencyValue = useMemo(() => container, []);

  return (
    <DependencyProvider value={dependencyValue}>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar onOpenSettings={() => setShowSettings(true)} />
        <main className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">NSTAR Console</p>
              <h1 className="text-xl font-semibold">Model-Agnostic Workspace</h1>
            </div>
            <div className="flex items-center gap-4">
              <StatusBar busy={loading} error={error} />
              <ThemeToggle />
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-full bg-highlight px-4 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-105"
              >
                Settings
              </button>
            </div>
          </header>
          <ChatView />
        </main>
        <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
      </div>
    </DependencyProvider>
  );
};
