import { eq, desc, gt, and, isNull, sql, lt } from "drizzle-orm";
import { db } from "../../lib/db";
import { buyerSessions, cartItems } from "../schema";
import type {
  BuyerSession,
  NewBuyerSession,
  CartItem,
  NewCartItem,
} from "../schema";
import type { SessionRepository } from "../interfaces/session-repository";

export class SessionRepositoryImpl implements SessionRepository {
  // Buyer Session operations
  async createSession(session: NewBuyerSession): Promise<BuyerSession> {
    const [created] = await db
      .insert(buyerSessions)
      .values(session)
      .returning();
    return created;
  }

  async findSessionById(id: string): Promise<BuyerSession | null> {
    const [session] = await db
      .select()
      .from(buyerSessions)
      .where(and(eq(buyerSessions.id, id), isNull(buyerSessions.deletedAt)))
      .limit(1);

    return session || null;
  }

  async updateSession(
    id: string,
    updates: Partial<Omit<BuyerSession, "id" | "createdAt">>
  ): Promise<BuyerSession | null> {
    const [updated] = await db
      .update(buyerSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(buyerSessions.id, id), isNull(buyerSessions.deletedAt)))
      .returning();

    return updated || null;
  }

  async softDeleteSession(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(buyerSessions)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(buyerSessions.id, id), isNull(buyerSessions.deletedAt)))
      .returning();

    return !!deleted;
  }

  // Cart operations
  async addCartItem(cartItem: NewCartItem): Promise<CartItem> {
    const [created] = await db.insert(cartItems).values(cartItem).returning();
    return created;
  }

  async addCartItems(items: NewCartItem[]): Promise<CartItem[]> {
    const results: CartItem[] = [];

    for (const item of items) {
      // Check if item already exists
      const [existingItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.sessionId, item.sessionId),
            eq(cartItems.menuId, item.menuId),
            isNull(cartItems.deletedAt)
          )
        )
        .limit(1);

      if (existingItem) {
        // Update existing item
        const [updated] = await db
          .update(cartItems)
          .set({
            quantity: item.quantity,
            priceSnapshot: item.priceSnapshot,
            notes: item.notes,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existingItem.id))
          .returning();
        results.push(updated);
      } else {
        // Insert new item
        const [created] = await db.insert(cartItems).values(item).returning();
        results.push(created);
      }
    }

    return results;
  }

  async findCartItems(
    sessionId: string,
    options?: {
      merchantId?: string;
      cursor?: string;
      limit?: number;
    }
  ): Promise<{
    data: CartItem[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const limit = Math.min(options?.limit ?? 20, 100);
    const conditions = [
      eq(cartItems.sessionId, sessionId),
      isNull(cartItems.deletedAt),
    ];

    if (options?.merchantId) {
      conditions.push(eq(cartItems.merchantId, options.merchantId));
    }

    if (options?.cursor) {
      conditions.push(gt(cartItems.id, options.cursor));
    }

    const results = await db
      .select()
      .from(cartItems)
      .where(and(...conditions))
      .orderBy(desc(cartItems.id))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[limit - 1].id : undefined;

    return { data, nextCursor, hasMore };
  }

  async findCartItemById(id: string): Promise<CartItem | null> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, id), isNull(cartItems.deletedAt)))
      .limit(1);

    return item || null;
  }

  async updateCartItem(
    id: string,
    updates: Partial<Omit<CartItem, "id" | "sessionId" | "createdAt">>
  ): Promise<CartItem | null> {
    const [updated] = await db
      .update(cartItems)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(cartItems.id, id), isNull(cartItems.deletedAt)))
      .returning();

    return updated || null;
  }

  async removeCartItem(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(cartItems)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(cartItems.id, id), isNull(cartItems.deletedAt)))
      .returning();

    return !!deleted;
  }

  async clearCart(sessionId: string, merchantId?: string): Promise<boolean> {
    const conditions = [
      eq(cartItems.sessionId, sessionId),
      isNull(cartItems.deletedAt),
    ];

    if (merchantId) {
      conditions.push(eq(cartItems.merchantId, merchantId));
    }

    const result = await db
      .update(cartItems)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning();

    return result.length > 0;
  }

  // Cart analytics
  async getCartTotal(sessionId: string, merchantId?: string): Promise<number> {
    const conditions = [
      eq(cartItems.sessionId, sessionId),
      isNull(cartItems.deletedAt),
    ];

    if (merchantId) {
      conditions.push(eq(cartItems.merchantId, merchantId));
    }

    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${cartItems.quantity} * ${cartItems.priceSnapshot}), 0)`,
      })
      .from(cartItems)
      .where(and(...conditions));

    return result?.total ?? 0;
  }

  async getCartItemCount(
    sessionId: string,
    merchantId?: string
  ): Promise<number> {
    const conditions = [
      eq(cartItems.sessionId, sessionId),
      isNull(cartItems.deletedAt),
    ];

    if (merchantId) {
      conditions.push(eq(cartItems.merchantId, merchantId));
    }

    const [result] = await db
      .select({
        count: sql<number>`COALESCE(SUM(${cartItems.quantity}), 0)`,
      })
      .from(cartItems)
      .where(and(...conditions));

    return result?.count ?? 0;
  }

  async getCartByMerchant(sessionId: string): Promise<
    Record<
      string,
      {
        merchantId: string;
        items: CartItem[];
        total: number;
        itemCount: number;
      }
    >
  > {
    const items = await db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.sessionId, sessionId), isNull(cartItems.deletedAt))
      )
      .orderBy(desc(cartItems.createdAt));

    const groupedByMerchant: Record<
      string,
      {
        merchantId: string;
        items: CartItem[];
        total: number;
        itemCount: number;
      }
    > = {};

    for (const item of items) {
      if (!groupedByMerchant[item.merchantId]) {
        groupedByMerchant[item.merchantId] = {
          merchantId: item.merchantId,
          items: [],
          total: 0,
          itemCount: 0,
        };
      }

      groupedByMerchant[item.merchantId].items.push(item);
      groupedByMerchant[item.merchantId].total +=
        item.quantity * item.priceSnapshot;
      groupedByMerchant[item.merchantId].itemCount += item.quantity;
    }

    return groupedByMerchant;
  }

  // Utility operations
  async sessionExists(id: string): Promise<boolean> {
    const [session] = await db
      .select({ id: buyerSessions.id })
      .from(buyerSessions)
      .where(and(eq(buyerSessions.id, id), isNull(buyerSessions.deletedAt)))
      .limit(1);

    return !!session;
  }

  async cleanupExpiredSessions(olderThanHours: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const result = await db
      .update(buyerSessions)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          lt(buyerSessions.updatedAt, cutoffDate),
          isNull(buyerSessions.deletedAt)
        )
      )
      .returning();

    return result.length;
  }
}
