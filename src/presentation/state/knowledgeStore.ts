import { create } from "zustand";
import { horizonDB } from "@core/database/horizonDB";
import type { Note } from "@domain/entities/Note";
import type { Card, CardPosition, CardSize, CardLink } from "@domain/entities/Card";
import type { Whiteboard, WhiteboardViewport } from "@domain/entities/Whiteboard";
import { createId } from "@core/utils/uuid";
import { RAGService } from "@domain/services/RAGService";

interface KnowledgeState {
  notes: Note[];
  currentNote: Note | null;
  whiteboards: Whiteboard[];
  currentWhiteboard: Whiteboard | null;
  cards: Card[];
  selectedCardId: string | null;
  viewport: WhiteboardViewport;
  loading: boolean;
  error?: string;

  initialize: () => Promise<void>;

  createNote: (title: string, content: string, tags?: string[], parentId?: string | null) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<Note[]>;

  createWhiteboard: (title: string, description?: string) => Promise<Whiteboard>;
  updateWhiteboard: (id: string, updates: Partial<Whiteboard>) => Promise<void>;
  deleteWhiteboard: (id: string) => Promise<void>;
  selectWhiteboard: (id: string) => Promise<void>;
  updateViewport: (viewport: Partial<WhiteboardViewport>) => void;

  createCard: (whiteboardId: string, content: string, position?: CardPosition, size?: CardSize, color?: string) => Promise<Card>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  updateCardPosition: (id: string, position: CardPosition) => Promise<void>;
  updateCardSize: (id: string, size: CardSize) => Promise<void>;
  addCardLink: (cardId: string, link: CardLink) => Promise<void>;
  removeCardLink: (cardId: string, targetId: string) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  selectCard: (id: string | null) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  notes: [],
  currentNote: null,
  whiteboards: [],
  currentWhiteboard: null,
  cards: [],
  selectedCardId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  loading: false,
  error: undefined,

  initialize: async () => {
    set({ loading: true, error: undefined });
    try {
      const [notes, whiteboards] = await Promise.all([
        horizonDB.notes.toArray(),
        horizonDB.whiteboards.toArray()
      ]);

      set({
        notes,
        whiteboards,
        loading: false
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  createNote: async (title, content, tags = [], parentId = null) => {
    const now = Date.now();
    const note: Note = {
      id: createId(),
      title,
      content,
      tags,
      parentId,
      createdAt: now,
      updatedAt: now,
      embeddingId: null
    };

    await horizonDB.notes.add(note);

    if (content) {
      await RAGService.indexNote(note.id);
    }

    set(state => ({ notes: [...state.notes, note] }));
    return note;
  },

  updateNote: async (id, updates) => {
    await horizonDB.notes.update(id, {
      ...updates,
      updatedAt: Date.now()
    });

    set(state => ({
      notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n),
      currentNote: state.currentNote?.id === id
        ? { ...state.currentNote, ...updates }
        : state.currentNote
    }));
  },

  deleteNote: async (id) => {
    await horizonDB.notes.delete(id);
    set(state => ({
      notes: state.notes.filter(n => n.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote
    }));
  },

  selectNote: async (id) => {
    const note = await horizonDB.notes.get(id);
    set({ currentNote: note || null });
  },

  searchNotes: async (query) => {
    const notes = await horizonDB.notes
      .filter(n =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.content.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
    return notes;
  },

  createWhiteboard: async (title, description = "") => {
    const now = Date.now();
    const whiteboard: Whiteboard = {
      id: createId(),
      title,
      description,
      parentId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.whiteboards.add(whiteboard);
    set(state => ({ whiteboards: [...state.whiteboards, whiteboard] }));
    return whiteboard;
  },

  updateWhiteboard: async (id, updates) => {
    await horizonDB.whiteboards.update(id, {
      ...updates,
      updatedAt: Date.now()
    });

    set(state => ({
      whiteboards: state.whiteboards.map(w => w.id === id ? { ...w, ...updates } : w),
      currentWhiteboard: state.currentWhiteboard?.id === id
        ? { ...state.currentWhiteboard, ...updates }
        : state.currentWhiteboard
    }));
  },

  deleteWhiteboard: async (id) => {
    await horizonDB.whiteboards.delete(id);
    await horizonDB.cards.where("whiteboardId").equals(id).delete();

    set(state => ({
      whiteboards: state.whiteboards.filter(w => w.id !== id),
      currentWhiteboard: state.currentWhiteboard?.id === id ? null : state.currentWhiteboard,
      cards: state.currentWhiteboard?.id === id ? [] : state.cards
    }));
  },

  selectWhiteboard: async (id) => {
    const whiteboard = await horizonDB.whiteboards.get(id);
    const cards = await horizonDB.cards.where("whiteboardId").equals(id).toArray();

    set({
      currentWhiteboard: whiteboard || null,
      cards,
      viewport: whiteboard?.viewport || { x: 0, y: 0, zoom: 1 }
    });
  },

  updateViewport: (viewport) => {
    set(state => ({
      viewport: { ...state.viewport, ...viewport }
    }));
  },

  createCard: async (whiteboardId, content, position = { x: 0, y: 0 }, size = { width: 250, height: 150 }, color = "#1a1a2e") => {
    const now = Date.now();
    const card: Card = {
      id: createId(),
      content,
      whiteboardId,
      position,
      size,
      color,
      links: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
      embeddingId: null
    };

    await horizonDB.cards.add(card);
    set(state => ({ cards: [...state.cards, card] }));
    return card;
  },

  updateCard: async (id, updates) => {
    await horizonDB.cards.update(id, {
      ...updates,
      updatedAt: Date.now()
    });

    set(state => ({
      cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  },

  updateCardPosition: async (id, position) => {
    await horizonDB.cards.update(id, { position, updatedAt: Date.now() });
    set(state => ({
      cards: state.cards.map(c => c.id === id ? { ...c, position } : c)
    }));
  },

  updateCardSize: async (id, size) => {
    await horizonDB.cards.update(id, { size, updatedAt: Date.now() });
    set(state => ({
      cards: state.cards.map(c => c.id === id ? { ...c, size } : c)
    }));
  },

  addCardLink: async (cardId, link) => {
    const card = await horizonDB.cards.get(cardId);
    if (!card) return;

    const links = [...card.links, link];
    await horizonDB.cards.update(cardId, { links, updatedAt: Date.now() });

    set(state => ({
      cards: state.cards.map(c => c.id === cardId ? { ...c, links } : c)
    }));
  },

  removeCardLink: async (cardId, targetId) => {
    const card = await horizonDB.cards.get(cardId);
    if (!card) return;

    const links = card.links.filter(l => l.targetId !== targetId);
    await horizonDB.cards.update(cardId, { links, updatedAt: Date.now() });

    set(state => ({
      cards: state.cards.map(c => c.id === cardId ? { ...c, links } : c)
    }));
  },

  deleteCard: async (id) => {
    await horizonDB.cards.delete(id);
    set(state => ({
      cards: state.cards.filter(c => c.id !== id),
      selectedCardId: state.selectedCardId === id ? null : state.selectedCardId
    }));
  },

  selectCard: (id) => {
    set({ selectedCardId: id });
  }
}));