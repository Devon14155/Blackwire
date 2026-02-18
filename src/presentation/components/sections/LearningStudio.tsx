import { useState } from "react";
import { Plus, BookOpen, ChevronRight, Clock, Target, Layers } from "lucide-react";
import { useLearningStore } from "@presentation/state/learningStore";
import { cn } from "@presentation/lib/cn";

export const LearningStudio = () => {
  const vaults = useLearningStore((state) => state.vaults);
  const currentVault = useLearningStore((state) => state.currentVault);
  const lessons = useLearningStore((state) => state.lessons);
  const dueCards = useLearningStore((state) => state.dueCards);
  const createVault = useLearningStore((state) => state.createVault);
  const selectVault = useLearningStore((state) => state.selectVault);
  const loading = useLearningStore((state) => state.loading);

  const [showCreateVault, setShowCreateVault] = useState(false);
  const [newVaultTitle, setNewVaultTitle] = useState("");
  const [newVaultTopic, setNewVaultTopic] = useState("");

  const handleCreateVault = async () => {
    if (!newVaultTitle.trim()) return;
    await createVault(newVaultTitle, newVaultTopic || newVaultTitle);
    setNewVaultTitle("");
    setNewVaultTopic("");
    setShowCreateVault(false);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-white/60">Loading learning data...</div>
      </div>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Learning Studio</p>
            <h1 className="text-xl font-semibold">Personalized Learning</h1>
          </div>
          <button
            onClick={() => setShowCreateVault(true)}
            className="flex items-center gap-2 rounded-full bg-highlight px-4 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            New Vault
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-white/5 bg-black/20 p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Study Queues</h2>
          </div>

          <div className="space-y-2 mb-6">
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-highlight/20 p-2">
                  <Clock className="h-5 w-5 text-highlight" />
                </div>
                <div>
                  <p className="font-medium text-white/80">Due Cards</p>
                  <p className="text-2xl font-bold text-white">{dueCards.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Vaults</h2>
          </div>

          <div className="space-y-1">
            {vaults.map((vault) => (
              <button
                key={vault.id}
                onClick={() => selectVault(vault.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                  currentVault?.id === vault.id
                    ? "bg-highlight/10 text-highlight"
                    : "text-white/60 hover:bg-white/5"
                )}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{vault.title}</p>
                  <p className="text-xs text-white/40">{vault.progress}% complete</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            ))}

            {vaults.length === 0 && (
              <p className="px-3 py-2 text-sm text-white/40">No vaults yet</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentVault ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{currentVault.title}</h2>
                    <p className="mt-1 text-sm text-white/50">{currentVault.description || currentVault.topic}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-white/40">Progress</p>
                      <p className="text-lg font-semibold text-white">{currentVault.progress}%</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-highlight transition-all"
                      style={{ width: `${currentVault.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Lessons</h3>
                  <button className="flex items-center gap-1 text-xs text-highlight hover:underline">
                    <Plus className="h-3 w-3" />
                    Add Lesson
                  </button>
                </div>

                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={cn(
                        "rounded-xl border p-4 transition hover:border-white/20",
                        lesson.status === "completed"
                          ? "border-green-500/20 bg-green-500/5"
                          : "border-white/5 bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                          lesson.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{lesson.title}</p>
                          <p className="text-xs text-white/40">{lesson.duration} min • {lesson.status}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/40" />
                      </div>
                    </div>
                  ))}

                  {lessons.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/40">
                      <Layers className="mx-auto h-8 w-8 opacity-50" />
                      <p className="mt-2">No lessons yet</p>
                      <p className="text-xs">Create your first lesson to start learning</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center">
                <BookOpen className="mx-auto h-12 w-12 text-white/20" />
                <h2 className="mt-4 text-xl font-semibold text-white/80">Select a Vault</h2>
                <p className="mt-2 text-sm text-white/50">
                  Choose a learning vault from the sidebar or create a new one to start your learning journey.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateVault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d10] p-6">
            <h2 className="text-lg font-semibold">Create Learning Vault</h2>
            <p className="mt-1 text-sm text-white/50">A vault contains lessons and flashcards on a topic.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40">Title</label>
                <input
                  value={newVaultTitle}
                  onChange={(e) => setNewVaultTitle(e.target.value)}
                  placeholder="e.g., Machine Learning Basics"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40">Topic</label>
                <input
                  value={newVaultTopic}
                  onChange={(e) => setNewVaultTopic(e.target.value)}
                  placeholder="e.g., ML, AI, Neural Networks"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateVault(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVault}
                disabled={!newVaultTitle.trim()}
                className="rounded-lg bg-highlight px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Create Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};