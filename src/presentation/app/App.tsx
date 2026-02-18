import { useEffect, useMemo, useState } from "react";
import { DependencyProvider } from "@presentation/di/DependencyContext";
import { container } from "@presentation/di/container";
import { useChatStore } from "@presentation/state/chatStore";
import { useAppStore } from "@presentation/state/appStore";
import { useLearningStore } from "@presentation/state/learningStore";
import { useKnowledgeStore } from "@presentation/state/knowledgeStore";
import { useTaskStore } from "@presentation/state/taskStore";
import { SettingsSheet } from "@presentation/components/settings/SettingsSheet";
import { Sidebar } from "@presentation/components/system/Sidebar";
import { ThemeToggle } from "@presentation/components/system/ThemeToggle";
import { StatusBar } from "@presentation/components/system/StatusBar";
import { CommandCenter } from "@presentation/components/sections/CommandCenter";
import { LearningStudio } from "@presentation/components/sections/LearningStudio";
import { KnowledgeOrganizer } from "@presentation/components/sections/KnowledgeOrganizer";
import { TaskManager } from "@presentation/components/sections/TaskManager";
import { EmbeddingService } from "@core/embeddings/EmbeddingService";

export const App = () => {
  const initializeChat = useChatStore((state) => state.initialize);
  const loading = useChatStore((state) => state.loading);
  const error = useChatStore((state) => state.error);
  const activeSection = useAppStore((state) => state.activeSection);
  const setEmbeddingStatus = useAppStore((state) => state.setEmbeddingStatus);
  const setEmbeddingProgress = useAppStore((state) => state.setEmbeddingProgress);
  const initializeLearning = useLearningStore((state) => state.initialize);
  const initializeKnowledge = useKnowledgeStore((state) => state.initialize);
  const initializeTasks = useTaskStore((state) => state.initialize);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([
        initializeChat(),
        initializeLearning(),
        initializeKnowledge(),
        initializeTasks()
      ]);

      setEmbeddingStatus("loading");
      try {
        await EmbeddingService.initialize((progress) => {
          setEmbeddingProgress(progress.progress);
          if (progress.status === "ready") {
            setEmbeddingStatus("ready");
          } else if (progress.status === "error") {
            setEmbeddingStatus("error");
          }
        });
      } catch (err) {
        console.warn("Embedding model initialization deferred:", err);
        setEmbeddingStatus("uninitialized");
      }
    };

    initializeApp().catch((err) => console.error("Failed to initialize", err));
  }, [initializeChat, initializeLearning, initializeKnowledge, initializeTasks, setEmbeddingStatus, setEmbeddingProgress]);

  const dependencyValue = useMemo(() => container, []);

  const renderSection = () => {
    switch (activeSection) {
      case "learning":
        return <LearningStudio />;
      case "knowledge":
        return <KnowledgeOrganizer />;
      case "tasks":
        return <TaskManager />;
      case "command":
      default:
        return <CommandCenter />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "learning":
        return { subtitle: "LEARNING STUDIO", title: "Personalized Education" };
      case "knowledge":
        return { subtitle: "KNOWLEDGE ORGANIZER", title: "Notes & Whiteboards" };
      case "tasks":
        return { subtitle: "TASK MANAGER", title: "Organize Your Work" };
      case "command":
      default:
        return { subtitle: "HORIZON PWA", title: "Agentic Command Center" };
    }
  };

  const sectionInfo = getSectionTitle();

  return (
    <DependencyProvider value={dependencyValue}>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar onOpenSettings={() => setShowSettings(true)} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">{sectionInfo.subtitle}</p>
              <h1 className="text-xl font-semibold">{sectionInfo.title}</h1>
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
          {renderSection()}
        </main>
        <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
      </div>
    </DependencyProvider>
  );
};