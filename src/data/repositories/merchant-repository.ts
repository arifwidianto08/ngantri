import { eq, desc, gt, and, isNull, sql, count } from "drizzle-orm";
import { db } from "../../lib/db";
import { merchants } from "../schema";
import type { Merchant, NewMerchant } from "../schema";
import type { MerchantRepository } from "../interfaces/merchant-repository";

export class MerchantRepositoryImpl implements MerchantRepository {
  async create(merchant: NewMerchant): Promise<Merchant> {
    const [created] = await db.insert(merchants).values(merchant).returning();
    return created;
  }

  async findById(id: string): Promise<Merchant | null> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(and(eq(merchants.id, id), isNull(merchants.deletedAt)))
      .limit(1);

    return merchant || null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Merchant | null> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(
        and(eq(merchants.phoneNumber, phoneNumber), isNull(merchants.deletedAt))
      )
      .limit(1);

    return merchant || null;
  }

  async findByMerchantNumber(merchantNumber: number): Promise<Merchant | null> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(
        and(
          eq(merchants.merchantNumber, merchantNumber),
          isNull(merchants.deletedAt)
        )
      )
      .limit(1);

    return merchant || null;
  }

  async findAll(options?: {
    cursor?: string;
    limit?: number;
    isAvailable?: boolean;
  }): Promise<{
    data: Merchant[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const limit = Math.min(options?.limit ?? 20, 100); // Max 100 items per page
    const conditions = [isNull(merchants.deletedAt)];

    if (options?.cursor) {
      conditions.push(gt(merchants.id, options.cursor));
    }

    if (options?.isAvailable !== undefined) {
      conditions.push(eq(merchants.isAvailable, options.isAvailable));
    }

    // Fetch one extra item to determine if there are more results
    const results = await db
      .select()
      .from(merchants)
      .where(and(...conditions))
      .orderBy(desc(merchants.id)) // UUIDv7 natural ordering by creation time
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[limit - 1].id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async update(
    id: string,
    updates: Partial<Omit<Merchant, "id" | "createdAt">>
  ): Promise<Merchant | null> {
    const [updated] = await db
      .update(merchants)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(merchants.id, id), isNull(merchants.deletedAt)))
      .returning();

    return updated || null;
  }

  async updateAvailability(
    id: string,
    isAvailable: boolean
  ): Promise<Merchant | null> {
    return this.update(id, { isAvailable });
  }

  async softDelete(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(merchants)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(merchants.id, id), isNull(merchants.deletedAt)))
      .returning();

    return !!deleted;
  }

  async restore(id: string): Promise<Merchant | null> {
    const [restored] = await db
      .update(merchants)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, id))
      .returning();

    return restored || null;
  }

  async exists(phoneNumber: string): Promise<boolean> {
    const [merchant] = await db
      .select({ id: merchants.id })
      .from(merchants)
      .where(
        and(eq(merchants.phoneNumber, phoneNumber), isNull(merchants.deletedAt))
      )
      .limit(1);

    return !!merchant;
  }

  async getNextMerchantNumber(): Promise<number> {
    const [result] = await db
      .select({
        maxNumber: sql<number>`COALESCE(MAX(${merchants.merchantNumber}), 0)`,
      })
      .from(merchants)
      .where(isNull(merchants.deletedAt));

    return (result?.maxNumber ?? 0) + 1;
  }

  async count(options?: { isAvailable?: boolean }): Promise<number> {
    const conditions = [isNull(merchants.deletedAt)];

    if (options?.isAvailable !== undefined) {
      conditions.push(eq(merchants.isAvailable, options.isAvailable));
    }

    const [result] = await db
      .select({ count: count(merchants.id) })
      .from(merchants)
      .where(and(...conditions));

    return result?.count ?? 0;
  }
}
