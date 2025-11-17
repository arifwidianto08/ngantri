/**
 * Menu service interface and implementation
 * Handles business logic for menu operations
 */

import { MenuRepository } from "../data/interfaces/MenuRepository";
import { Menu, NewMenu, MenuCategory, NewMenuCategory } from "../data/schema";
import {
  PaginatedResult,
  CursorPaginationParams,
  buildPaginatedResult,
} from "../lib/pagination";
import { AppError, errors } from "../lib/errors";
import { validateCurrencyAmount } from "../lib/currency";

// Service-specific types
export interface MenuItemData {
  merchantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number; // Price in IDR (Indonesian Rupiah)
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface MenuCategoryData {
  merchantId: string;
  name: string;
}

export interface MenuItemUpdateData {
  name?: string;
  description?: string;
  price?: number; // Price in IDR
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface MenuSearchOptions {
  merchantId?: string;
  categoryId?: string;
  isAvailable?: boolean;
  priceMin?: number;
  priceMax?: number;
  searchTerm?: string;
}

/**
 * Menu service interface
 */
export interface IMenuService {
  // Menu item operations
  createMenuItem(data: MenuItemData): Promise<Menu>;
  findMenuItemById(id: string): Promise<Menu>;
  findMenuItemsByMerchant(
    merchantId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Menu>>;
  findMenuItemsByCategory(
    categoryId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Menu>>;
  updateMenuItem(id: string, data: MenuItemUpdateData): Promise<Menu>;
  deleteMenuItem(id: string): Promise<void>;

  // Menu category operations
  createCategory(data: MenuCategoryData): Promise<MenuCategory>;
  findCategoriesByMerchant(merchantId: string): Promise<MenuCategory[]>;
  updateCategory(id: string, name: string): Promise<MenuCategory>;
  deleteCategory(id: string): Promise<void>;

  // Search and filtering
  searchMenuItems(
    options: MenuSearchOptions,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Menu>>;

  // Validation methods
  validateMenuItemData(data: MenuItemData): Promise<void>;
  validateCategoryData(data: MenuCategoryData): Promise<void>;
}

/**
 * Menu service implementation
 */
export class MenuService implements IMenuService {
  constructor(private menuRepository: MenuRepository) {}

  /**
   * Create a new menu item
   */
  async createMenuItem(data: MenuItemData): Promise<Menu> {
    // Validate menu item data
    await this.validateMenuItemData(data);

    // Create menu item
    const menuData: NewMenu = {
      merchantId: data.merchantId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description || null,
      price: data.price,
      imageUrl: data.imageUrl || null,
      isAvailable: data.isAvailable ?? true,
    };

    try {
      const menu = await this.menuRepository.create(menuData);
      return menu;
    } catch (error) {
      throw errors.internal("Failed to create menu item", error);
    }
  }

  /**
   * Find menu item by ID
   */
  async findMenuItemById(id: string): Promise<Menu> {
    try {
      const menu = await this.menuRepository.findById(id);
      if (!menu) {
        throw errors.menuNotFound(id);
      }
      return menu;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to find menu item", error);
    }
  }

  /**
   * Find menu items by merchant with pagination
   */
  async findMenuItemsByMerchant(
    merchantId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Menu>> {
    try {
      const result = await this.menuRepository.findByMerchant(merchantId, {
        cursor: params.cursor,
        limit: params.limit,
        isAvailable: true, // Only return available items by default
      });

      return buildPaginatedResult(result.data, params);
    } catch (error) {
      throw errors.internal("Failed to fetch menu items by merchant", error);
    }
  }

  /**
   * Find menu items by category with pagination
   */
  async findMenuItemsByCategory(
    categoryId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Menu>> {
    try {
      const result = await this.menuRepository.findByCategory(categoryId, {
        cursor: params.cursor,
        limit: params.limit,
        isAvailable: true,
      });

      return buildPaginatedResult(result.data, params);
    } catch (error) {
      throw errors.internal("Failed to fetch menu items by category", error);
    }
  }

  /**
   * Update menu item
   */
  async updateMenuItem(id: string, data: MenuItemUpdateData): Promise<Menu> {
    // Validate menu item exists
    await this.findMenuItemById(id);

    // Validate price if provided
    if (data.price !== undefined) {
      const validation = validateCurrencyAmount(data.price, "item");
      if (!validation.valid) {
        throw errors.validation(validation.error!);
      }
    }

    try {
      const updatedMenu = await this.menuRepository.update(id, data);
      if (!updatedMenu) {
        throw errors.menuNotFound(id);
      }
      return updatedMenu;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to update menu item", error);
    }
  }

  /**
   * Delete menu item (soft delete)
   */
  async deleteMenuItem(id: string): Promise<void> {
    // Validate menu item exists
    await this.findMenuItemById(id);

    try {
      const result = await this.menuRepository.softDelete(id);
      if (!result) {
        throw errors.internal("Failed to delete menu item");
      }
    } catch (error) {
      throw errors.internal("Failed to delete menu item", error);
    }
  }

  /**
   * Create a new menu category
   */
  async createCategory(data: MenuCategoryData): Promise<MenuCategory> {
    // Validate category data
    await this.validateCategoryData(data);

    const categoryData: NewMenuCategory = {
      merchantId: data.merchantId,
      name: data.name,
    };

    try {
      const category = await this.menuRepository.createCategory(categoryData);
      return category;
    } catch (error) {
      throw errors.internal("Failed to create menu category", error);
    }
  }

  /**
   * Find categories by merchant
   */
  async findCategoriesByMerchant(merchantId: string): Promise<MenuCategory[]> {
    try {
      const result = await this.menuRepository.findCategoriesByMerchant(
        merchantId
      );
      return result.data;
    } catch (error) {
      throw errors.internal("Failed to fetch menu categories", error);
    }
  }

  /**
   * Update menu category
   */
  async updateCategory(id: string, name: string): Promise<MenuCategory> {
    if (!name?.trim()) {
      throw errors.validation("Category name is required");
    }

    try {
      const updatedCategory = await this.menuRepository.updateCategory(id, {
        name,
      });
      if (!updatedCategory) {
        throw errors.notFound("Menu category", id);
      }
      return updatedCategory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to update menu category", error);
    }
  }

  /**
   * Delete menu category
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const result = await this.menuRepository.softDeleteCategory(id);
      if (!result) {
        throw errors.notFound("Menu category", id);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to delete menu category", error);
    }
  }

  /**
   * Search menu items with filters
   */
  async searchMenuItems(
    options: MenuSearchOptions,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Menu>> {
    try {
      // For now, use findByMerchant as a basic search implementation
      // TODO: Implement proper search in repository layer
      if (options.merchantId) {
        return await this.findMenuItemsByMerchant(options.merchantId, params);
      }

      // Return empty result if no merchant ID is provided
      const emptyResult = {
        data: [],
        nextCursor: undefined,
        hasMore: false,
      };
      return buildPaginatedResult(emptyResult.data, params);
    } catch (error) {
      throw errors.internal("Failed to search menu items", error);
    }
  }

  /**
   * Validate menu item data
   */
  async validateMenuItemData(data: MenuItemData): Promise<void> {
    // Validate required fields
    if (!data.name?.trim()) {
      throw errors.validation("Menu item name is required");
    }

    if (!data.merchantId?.trim()) {
      throw errors.validation("Merchant ID is required");
    }

    if (data.price === undefined || data.price === null) {
      throw errors.validation("Price is required");
    }

    // Validate price
    const priceValidation = validateCurrencyAmount(data.price, "item");
    if (!priceValidation.valid) {
      throw errors.validation(priceValidation.error!);
    }

    // Validate name length
    if (data.name.length < 2) {
      throw errors.validation(
        "Menu item name must be at least 2 characters long"
      );
    }

    if (data.name.length > 100) {
      throw errors.validation(
        "Menu item name must be less than 100 characters"
      );
    }

    // Validate description length if provided
    if (data.description && data.description.length > 500) {
      throw errors.validation(
        "Menu item description must be less than 500 characters"
      );
    }
  }

  /**
   * Validate category data
   */
  async validateCategoryData(data: MenuCategoryData): Promise<void> {
    // Validate required fields
    if (!data.name?.trim()) {
      throw errors.validation("Category name is required");
    }

    if (!data.merchantId?.trim()) {
      throw errors.validation("Merchant ID is required");
    }

    // Validate name length
    if (data.name.length < 2) {
      throw errors.validation(
        "Category name must be at least 2 characters long"
      );
    }

    if (data.name.length > 100) {
      throw errors.validation("Category name must be less than 100 characters");
    }
  }
}
