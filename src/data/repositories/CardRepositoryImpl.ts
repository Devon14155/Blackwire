import type { CardRepository } from "@domain/repositories/CardRepository";
import type { Card } from "@domain/entities/Card";
import { horizonDB } from "@core/database/horizonDB";

export class CardRepositoryImpl implements CardRepository {
  async getById(id: string): Promise<Card | null> {
    const card = await horizonDB.cards.get(id);
    return card || null;
  }

  async getByWhiteboardId(whiteboardId: string): Promise<Card[]> {
    return horizonDB.cards.where("whiteboardId").equals(whiteboardId).toArray();
  }

  async getLinkedCards(cardId: string): Promise<Card[]> {
    const card = await horizonDB.cards.get(cardId);
    if (!card) return [];

    const linkedIds = card.links.map(l => l.targetId);
    const linkedCards = await Promise.all(
      linkedIds.map(id => horizonDB.cards.get(id))
    );

    return linkedCards.filter((c): c is Card => c !== undefined);
  }

  async save(card: Card): Promise<void> {
    await horizonDB.cards.put({ ...card, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.cards.delete(id);
  }

  async deleteByWhiteboardId(whiteboardId: string): Promise<void> {
    await horizonDB.cards.where("whiteboardId").equals(whiteboardId).delete();
  }
}