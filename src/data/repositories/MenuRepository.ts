import { eq, desc, gt, and, isNull, sql } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  menus,
  menuCategories,
  Menu,
  NewMenu,
  MenuCategory,
  NewMenuCategory,
} from "../schema";
import { MenuRepository } from "../interfaces/menu-repository";

export class MenuRepositoryImpl implements MenuRepository {
  // Menu Category operations
  async createCategory(category: NewMenuCategory): Promise<MenuCategory> {
    const [created] = await db
      .insert(menuCategories)
      .values(category)
      .returning();
    return created;
  }

  async findCategoryById(id: string): Promise<MenuCategory | null> {
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(and(eq(menuCategories.id, id), isNull(menuCategories.deletedAt)))
      .limit(1);

    return category || null;
  }

  async findCategoriesByMerchant(
    merchantId: string,
    options?: {
      cursor?: string;
      limit?: number;
    }
  ): Promise<{
    data: MenuCategory[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const limit = Math.min(options?.limit ?? 20, 100);
    const conditions = [
      eq(menuCategories.merchantId, merchantId),
      isNull(menuCategories.deletedAt),
    ];

    if (options?.cursor) {
      conditions.push(gt(menuCategories.id, options.cursor));
    }

    const results = await db
      .select()
      .from(menuCategories)
      .where(and(...conditions))
      .orderBy(desc(menuCategories.id))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[limit - 1].id : undefined;

    return { data, nextCursor, hasMore };
  }

  async updateCategory(
    id: string,
    updates: Partial<Omit<MenuCategory, "id" | "createdAt">>
  ): Promise<MenuCategory | null> {
    const [updated] = await db
      .update(menuCategories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(menuCategories.id, id), isNull(menuCategories.deletedAt)))
      .returning();

    return updated || null;
  }

  async softDeleteCategory(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(menuCategories)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(menuCategories.id, id), isNull(menuCategories.deletedAt)))
      .returning();

    return !!deleted;
  }

  // Menu Item operations
  async create(menu: NewMenu): Promise<Menu> {
    const [created] = await db.insert(menus).values(menu).returning();
    return created;
  }

  async findById(id: string): Promise<Menu | null> {
    const [menu] = await db
      .select()
      .from(menus)
      .where(and(eq(menus.id, id), isNull(menus.deletedAt)))
      .limit(1);

    return menu || null;
  }

  async findByMerchant(
    merchantId: string,
    options?: {
      cursor?: string;
      limit?: number;
      categoryId?: string;
      isAvailable?: boolean;
    }
  ): Promise<{
    data: Menu[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const limit = Math.min(options?.limit ?? 20, 100);
    const conditions = [
      eq(menus.merchantId, merchantId),
      isNull(menus.deletedAt),
    ];

    if (options?.cursor) {
      conditions.push(gt(menus.id, options.cursor));
    }

    if (options?.categoryId) {
      conditions.push(eq(menus.categoryId, options.categoryId));
    }

    if (options?.isAvailable !== undefined) {
      conditions.push(eq(menus.isAvailable, options.isAvailable));
    }

    const results = await db
      .select()
      .from(menus)
      .where(and(...conditions))
      .orderBy(desc(menus.id))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[limit - 1].id : undefined;

    return { data, nextCursor, hasMore };
  }

  async findByCategory(
    categoryId: string,
    options?: {
      cursor?: string;
      limit?: number;
      isAvailable?: boolean;
    }
  ): Promise<{
    data: Menu[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const limit = Math.min(options?.limit ?? 20, 100);
    const conditions = [
      eq(menus.categoryId, categoryId),
      isNull(menus.deletedAt),
    ];

    if (options?.cursor) {
      conditions.push(gt(menus.id, options.cursor));
    }

    if (options?.isAvailable !== undefined) {
      conditions.push(eq(menus.isAvailable, options.isAvailable));
    }

    const results = await db
      .select()
      .from(menus)
      .where(and(...conditions))
      .orderBy(desc(menus.id))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[limit - 1].id : undefined;

    return { data, nextCursor, hasMore };
  }

  async update(
    id: string,
    updates: Partial<Omit<Menu, "id" | "createdAt">>
  ): Promise<Menu | null> {
    const [updated] = await db
      .update(menus)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(menus.id, id), isNull(menus.deletedAt)))
      .returning();

    return updated || null;
  }

  async updateAvailability(
    id: string,
    isAvailable: boolean
  ): Promise<Menu | null> {
    return this.update(id, { isAvailable });
  }

  async updatePrice(id: string, price: number): Promise<Menu | null> {
    return this.update(id, { price });
  }

  async softDelete(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(menus)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(menus.id, id), isNull(menus.deletedAt)))
      .returning();

    return !!deleted;
  }

  async restore(id: string): Promise<Menu | null> {
    const [restored] = await db
      .update(menus)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(menus.id, id))
      .returning();

    return restored || null;
  }

  async count(
    merchantId: string,
    options?: { isAvailable?: boolean; categoryId?: string }
  ): Promise<number> {
    const conditions = [
      eq(menus.merchantId, merchantId),
      isNull(menus.deletedAt),
    ];

    if (options?.isAvailable !== undefined) {
      conditions.push(eq(menus.isAvailable, options.isAvailable));
    }

    if (options?.categoryId) {
      conditions.push(eq(menus.categoryId, options.categoryId));
    }

    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(menus)
      .where(and(...conditions));

    return result?.count ?? 0;
  }

  async categoryExists(
    merchantId: string,
    categoryName: string
  ): Promise<boolean> {
    const [category] = await db
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.merchantId, merchantId),
          eq(menuCategories.name, categoryName),
          isNull(menuCategories.deletedAt)
        )
      )
      .limit(1);

    return !!category;
  }
}
