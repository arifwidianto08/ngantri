import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { MenuRepository } from "../../../src/data/interfaces/menu-repository";
import type { Menu, MenuCategory } from "../../../src/data/schema";
import { MenuService } from "../../../src/services/menu-service";
import { ERROR_CODES } from "../../../src/lib/errors";

const makeMenu = (overrides: Partial<Menu> = {}): Menu => {
  const now = new Date();
  return {
    id: "m1",
    merchantId: "merch1",
    categoryId: "cat1",
    name: "Nasi Goreng",
    description: null,
    price: 15000,
    imageUrl: null,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
};

const makeCategory = (overrides: Partial<MenuCategory> = {}): MenuCategory => {
  const now = new Date();
  return {
    id: "c1",
    merchantId: "merch1",
    name: "Makanan",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
};

describe("MenuService (unit)", () => {
  let repo: jest.Mocked<MenuRepository>;
  let service: MenuService;

  beforeEach(() => {
    repo = {
      // category
      createCategory: jest.fn(),
      findCategoryById: jest.fn(),
      findCategoriesByMerchant: jest.fn(),
      updateCategory: jest.fn(),
      softDeleteCategory: jest.fn(),

      // menu item
      create: jest.fn(),
      findById: jest.fn(),
      findByMerchant: jest.fn(),
      findByCategory: jest.fn(),
      update: jest.fn(),
      updateAvailability: jest.fn(),
      updatePrice: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
      categoryExists: jest.fn(),
    };

    service = new MenuService(repo);
  });

  describe("createMenuItem", () => {
    it("VALID: creates menu item", async () => {
      const created = makeMenu({ id: "m2" });
      repo.create.mockResolvedValue(created);

      const res = await service.createMenuItem({
        merchantId: "merch1",
        categoryId: "cat1",
        name: "Ayam",
        price: 20000,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: "merch1",
          categoryId: "cat1",
          name: "Ayam",
          price: 20000,
          isAvailable: true,
        })
      );
      expect(res).toEqual(created);
    });

    it("FAIL: rejects missing name", async () => {
      await expect(
        service.createMenuItem({
          merchantId: "merch1",
          categoryId: "cat1",
          name: "",
          price: 20000,
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });
    });

    it("FAIL: wraps repository errors", async () => {
      repo.create.mockRejectedValue(new Error("db"));

      await expect(
        service.createMenuItem({
          merchantId: "merch1",
          categoryId: "cat1",
          name: "Ayam",
          price: 20000,
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.INTERNAL_SERVER_ERROR });
    });
  });

  describe("findMenuItemById", () => {
    it("VALID: returns menu", async () => {
      repo.findById.mockResolvedValue(makeMenu({ id: "m3" }));
      await expect(service.findMenuItemById("m3")).resolves.toMatchObject({
        id: "m3",
      });
    });

    it("FAIL: throws menuNotFound", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findMenuItemById("missing")).rejects.toMatchObject({
        code: ERROR_CODES.MENU_NOT_FOUND,
      });
    });
  });

  describe("findMenuItemsByMerchant", () => {
    it("VALID: paginates", async () => {
      repo.findByMerchant.mockResolvedValue({
        data: [makeMenu({ id: "m1" })],
        hasMore: false,
        nextCursor: undefined,
      });

      const res = await service.findMenuItemsByMerchant("merch1", {
        cursor: undefined,
        limit: 10,
      });

      expect(res.data.length).toBe(1);
      expect(repo.findByMerchant).toHaveBeenCalled();
    });
  });

  describe("updateMenuItem", () => {
    it("VALID: updates menu item", async () => {
      repo.findById.mockResolvedValue(makeMenu({ id: "m4" }));
      repo.update.mockResolvedValue(makeMenu({ id: "m4", price: 25000 }));

      const res = await service.updateMenuItem("m4", { price: 25000 });

      expect(repo.update).toHaveBeenCalledWith("m4", expect.any(Object));
      expect(res.price).toBe(25000);
    });

    it("FAIL: rejects invalid price", async () => {
      repo.findById.mockResolvedValue(makeMenu({ id: "m4" }));
      await expect(service.updateMenuItem("m4", { price: -1 })).rejects.toMatchObject(
        { code: ERROR_CODES.VALIDATION_ERROR }
      );
    });
  });

  describe("deleteMenuItem", () => {
    it("VALID: soft deletes", async () => {
      repo.findById.mockResolvedValue(makeMenu({ id: "m5" }));
      repo.softDelete.mockResolvedValue(true);

      await expect(service.deleteMenuItem("m5")).resolves.toBeUndefined();
    });

    it("FAIL: throws internal when repo returns false", async () => {
      repo.findById.mockResolvedValue(makeMenu({ id: "m5" }));
      repo.softDelete.mockResolvedValue(false);

      await expect(service.deleteMenuItem("m5")).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("createCategory / updateCategory / deleteCategory", () => {
    it("VALID: creates category", async () => {
      repo.createCategory.mockResolvedValue(makeCategory({ id: "c2" }));

      await expect(
        service.createCategory({ merchantId: "merch1", name: "Minuman" })
      ).resolves.toMatchObject({ id: "c2" });
    });

    it("VALID: updates category", async () => {
      repo.updateCategory.mockResolvedValue(makeCategory({ id: "c3", name: "A" }));

      await expect(service.updateCategory("c3", "A")).resolves.toMatchObject({
        id: "c3",
      });
    });

    it("FAIL: updateCategory rejects empty name", async () => {
      await expect(service.updateCategory("c3", "")).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    });

    it("FAIL: deleteCategory throws NOT_FOUND when false", async () => {
      repo.softDeleteCategory.mockResolvedValue(false);

      await expect(service.deleteCategory("c4")).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
      });
    });
  });

  describe("searchMenuItems", () => {
    it("VALID: returns empty when no merchantId", async () => {
      const res = await service.searchMenuItems({}, { cursor: undefined, limit: 10 });
      expect(res.data).toEqual([]);
    });
  });
});
