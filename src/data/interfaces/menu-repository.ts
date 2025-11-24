import { Menu, NewMenu, MenuCategory, NewMenuCategory } from "../schema";

export interface MenuRepository {
  // Menu Category operations
  createCategory(category: NewMenuCategory): Promise<MenuCategory>;
  findCategoryById(id: string): Promise<MenuCategory | null>;
  findCategoriesByMerchant(
    merchantId: string,
    options?: {
      cursor?: string;
      limit?: number;
    }
  ): Promise<{
    data: MenuCategory[];
    nextCursor?: string;
    hasMore: boolean;
  }>;
  updateCategory(
    id: string,
    updates: Partial<Omit<MenuCategory, "id" | "createdAt">>
  ): Promise<MenuCategory | null>;
  softDeleteCategory(id: string): Promise<boolean>;

  // Menu Item operations
  create(menu: NewMenu): Promise<Menu>;
  findById(id: string): Promise<Menu | null>;
  findByMerchant(
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
  }>;
  findByCategory(
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
  }>;

  // Update operations
  update(
    id: string,
    updates: Partial<Omit<Menu, "id" | "createdAt">>
  ): Promise<Menu | null>;
  updateAvailability(id: string, isAvailable: boolean): Promise<Menu | null>;
  updatePrice(id: string, price: number): Promise<Menu | null>;

  // Delete operations (soft delete)
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<Menu | null>;

  // Utility operations
  count(
    merchantId: string,
    options?: { isAvailable?: boolean; categoryId?: string }
  ): Promise<number>;
  categoryExists(merchantId: string, categoryName: string): Promise<boolean>;
}
