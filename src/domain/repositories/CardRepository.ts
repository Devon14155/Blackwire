import type { Card } from "@domain/entities/Card";

export interface CardRepository {
  getById(id: string): Promise<Card | null>;
  getByWhiteboardId(whiteboardId: string): Promise<Card[]>;
  getLinkedCards(cardId: string): Promise<Card[]>;
  save(card: Card): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByWhiteboardId(whiteboardId: string): Promise<void>;
}