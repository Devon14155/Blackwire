import { useState } from "react";
import { Plus, FileText, LayoutGrid, Search, ChevronRight, Tag, ArrowRight } from "lucide-react";
import { useKnowledgeStore } from "@presentation/state/knowledgeStore";
import { cn } from "@presentation/lib/cn";

export const KnowledgeOrganizer = () => {
  const notes = useKnowledgeStore((state) => state.notes);
  const currentNote = useKnowledgeStore((state) => state.currentNote);
  const whiteboards = useKnowledgeStore((state) => state.whiteboards);
  const currentWhiteboard = useKnowledgeStore((state) => state.currentWhiteboard);
  const cards = useKnowledgeStore((state) => state.cards);
  const createNote = useKnowledgeStore((state) => state.createNote);
  const createWhiteboard = useKnowledgeStore((state) => state.createWhiteboard);
  const createCard = useKnowledgeStore((state) => state.createCard);
  const updateCardPosition = useKnowledgeStore((state) => state.updateCardPosition);
  const selectNote = useKnowledgeStore((state) => state.selectNote);
  const selectWhiteboard = useKnowledgeStore((state) => state.selectWhiteboard);
  const loading = useKnowledgeStore((state) => state.loading);
  const viewport = useKnowledgeStore((state) => state.viewport);
  const updateViewport = useKnowledgeStore((state) => state.updateViewport);

  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [activeTab, setActiveTab] = useState<"notes" | "whiteboards">("notes");
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;
    await createNote(newNoteTitle, newNoteContent);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowCreateNote(false);
  };

  const handleCreateWhiteboard = async () => {
    const whiteboard = await createWhiteboard(`Whiteboard ${whiteboards.length + 1}`);
    selectWhiteboard(whiteboard.id);
  };

  const handleAddCard = async () => {
    if (!currentWhiteboard) return;
    const existingCards = cards.filter(c => c.whiteboardId === currentWhiteboard.id);
    const yOffset = existingCards.length * 180;
    await createCard(
      currentWhiteboard.id,
      "New Card",
      { x: 50 + (existingCards.length % 3) * 280, y: 50 + yOffset },
      { width: 250, height: 150 }
    );
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-white/60">Loading knowledge data...</div>
      </div>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Knowledge Organizer</p>
            <h1 className="text-xl font-semibold">Notes & Whiteboards</h1>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "notes" ? (
              <button
                onClick={() => setShowCreateNote(true)}
                className="flex items-center gap-2 rounded-full bg-highlight px-4 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                New Note
              </button>
            ) : (
              <button
                onClick={handleCreateWhiteboard}
                className="flex items-center gap-2 rounded-full bg-highlight px-4 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                New Whiteboard
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-white/5 bg-black/20 flex flex-col">
          <div className="p-2">
            <div className="flex rounded-lg bg-white/5 p-1">
              <button
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  activeTab === "notes" ? "bg-highlight text-black" : "text-white/60 hover:text-white"
                )}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab("whiteboards")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  activeTab === "whiteboards" ? "bg-highlight text-black" : "text-white/60 hover:text-white"
                )}
              >
                Whiteboards
              </button>
            </div>
          </div>

          <div className="p-2 border-t border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search..."
                className="w-full rounded-lg border border-white/10 bg-black/50 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-highlight focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === "notes" ? (
              <div className="space-y-1">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                      currentNote?.id === note.id
                        ? "bg-highlight/10 text-highlight"
                        : "text-white/60 hover:bg-white/5"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{note.title}</p>
                      <p className="truncate text-xs text-white/40">
                        {note.tags.slice(0, 2).join(", ")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                ))}

                {notes.length === 0 && (
                  <p className="px-3 py-2 text-sm text-white/40">No notes yet</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {whiteboards.map((wb) => (
                  <button
                    key={wb.id}
                    onClick={() => selectWhiteboard(wb.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                      currentWhiteboard?.id === wb.id
                        ? "bg-highlight/10 text-highlight"
                        : "text-white/60 hover:bg-white/5"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{wb.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                ))}

                {whiteboards.length === 0 && (
                  <p className="px-3 py-2 text-sm text-white/40">No whiteboards yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === "notes" ? (
            currentNote ? (
              <div className="h-full overflow-y-auto p-6">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">{currentNote.title}</h2>
                    <div className="mt-2 flex gap-2">
                      {currentNote.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/60"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-white/80">{currentNote.content || "No content yet..."}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <FileText className="mx-auto h-12 w-12 text-white/20" />
                  <h2 className="mt-4 text-xl font-semibold text-white/80">Select a Note</h2>
                  <p className="mt-2 text-sm text-white/50">
                    Choose a note from the sidebar or create a new one.
                  </p>
                </div>
              </div>
            )
          ) : currentWhiteboard ? (
            <div className="relative h-full bg-[#0a0a12]">
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => updateViewport({ zoom: Math.min(viewport.zoom * 1.2, 3) })}
                  className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-white/60 hover:text-white"
                >
                  +
                </button>
                <span className="text-xs text-white/40">{Math.round(viewport.zoom * 100)}%</span>
                <button
                  onClick={() => updateViewport({ zoom: Math.max(viewport.zoom / 1.2, 0.25) })}
                  className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-white/60 hover:text-white"
                >
                  -
                </button>
                <button
                  onClick={handleAddCard}
                  className="ml-2 flex items-center gap-1 rounded-lg bg-highlight px-3 py-1 text-xs font-medium text-black"
                >
                  <Plus className="h-3 w-3" />
                  Add Card
                </button>
              </div>

              <div
                className="h-full w-full overflow-auto"
                style={{ cursor: draggedCardId ? "grabbing" : "default" }}
              >
                <div
                  className="relative min-h-full"
                  style={{
                    width: "3000px",
                    height: "2000px",
                    transform: `scale(${viewport.zoom})`,
                    transformOrigin: "0 0"
                  }}
                >
                  {cards
                    .filter(c => c.whiteboardId === currentWhiteboard.id)
                    .map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedCardId(card.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={async (e) => {
                          if (draggedCardId === card.id) {
                            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                            if (rect) {
                              const x = (e.clientX - rect.left) / viewport.zoom - card.size.width / 2;
                              const y = (e.clientY - rect.top) / viewport.zoom - card.size.height / 2;
                              await updateCardPosition(card.id, { x, y });
                            }
                          }
                          setDraggedCardId(null);
                        }}
                        className="absolute rounded-xl border-2 p-4 shadow-lg transition-shadow hover:shadow-xl"
                        style={{
                          left: card.position.x,
                          top: card.position.y,
                          width: card.size.width,
                          minHeight: card.size.height,
                          backgroundColor: card.color,
                          borderColor: "rgba(255,255,255,0.1)"
                        }}
                      >
                        <p className="text-sm text-white/90">{card.content}</p>

                        {card.links.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {card.links.slice(0, 3).map((link) => (
                              <span
                                key={link.targetId}
                                className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/60"
                              >
                                <ArrowRight className="h-3 w-3" />
                                {link.label || "link"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center">
                <LayoutGrid className="mx-auto h-12 w-12 text-white/20" />
                <h2 className="mt-4 text-xl font-semibold text-white/80">Select a Whiteboard</h2>
                <p className="mt-2 text-sm text-white/50">
                  Choose a whiteboard from the sidebar or create a new one.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0d10] p-6">
            <h2 className="text-lg font-semibold">Create Note</h2>
            <p className="mt-1 text-sm text-white/50">Capture your thoughts and ideas.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40">Title</label>
                <input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40">Content</label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={6}
                  placeholder="Write your note..."
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateNote(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNoteTitle.trim()}
                className="rounded-lg bg-highlight px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};