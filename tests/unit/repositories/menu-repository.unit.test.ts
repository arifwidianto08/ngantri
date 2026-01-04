import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const db = {
  insert: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock("../../../src/lib/db", () => ({
  __esModule: true,
  db,
}));

const makeSelectChain = <T>(results: T[]) => {
  const chain: any = {
    from: jest.fn(() => chain),
    where: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    leftJoin: jest.fn(() => chain),
    limit: jest.fn(async () => results),
  };
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(results).then(resolve, reject);
  return chain;
};

const mockInsertReturningOnce = <T>(rows: T[]) => {
  db.insert.mockImplementationOnce(() => ({
    values: jest.fn(() => ({
      returning: jest.fn(async () => rows),
    })),
  }));
};

const mockUpdateReturningOnce = <T>(rows: T[]) => {
  db.update.mockImplementationOnce(() => ({
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(async () => rows),
      })),
    })),
  }));
};

describe("MenuRepositoryImpl (unit)", () => {
  beforeEach(() => {
    db.insert.mockReset();
    db.select.mockReset();
    db.update.mockReset();
    db.delete.mockReset();
  });

  it("createCategory: returns created category", async () => {
    const { MenuRepositoryImpl } = require("../../../src/data/repositories/menu-repository") as {
      MenuRepositoryImpl: typeof import("../../../src/data/repositories/menu-repository").MenuRepositoryImpl;
    };

    const repo = new MenuRepositoryImpl();
    const created = {
      id: "cat1",
      merchantId: "m1",
      name: "Food",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockInsertReturningOnce([created]);
    const res = await repo.createCategory({ merchantId: "m1", name: "Food" });

    expect(db.insert).toHaveBeenCalled();
    expect(res).toEqual(created);
  });

  it("findByMerchant: returns paginated result", async () => {
    const { MenuRepositoryImpl } = require("../../../src/data/repositories/menu-repository") as {
      MenuRepositoryImpl: typeof import("../../../src/data/repositories/menu-repository").MenuRepositoryImpl;
    };

    const repo = new MenuRepositoryImpl();

    const rows = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ] as any[];

    db.select.mockImplementationOnce(() => makeSelectChain(rows));

    const res = await repo.findByMerchant("m1", { limit: 2 });
    expect(res.data).toHaveLength(2);
    expect(res.hasMore).toBe(true);
    expect(res.nextCursor).toBeDefined();
  });

  it("update: returns null when not found", async () => {
    const { MenuRepositoryImpl } = require("../../../src/data/repositories/menu-repository") as {
      MenuRepositoryImpl: typeof import("../../../src/data/repositories/menu-repository").MenuRepositoryImpl;
    };

    const repo = new MenuRepositoryImpl();
    mockUpdateReturningOnce([]);

    const res = await repo.update("missing", { name: "x" } as any);
    expect(res).toBeNull();
  });

  it("categoryExists: returns true when found", async () => {
    const { MenuRepositoryImpl } = require("../../../src/data/repositories/menu-repository") as {
      MenuRepositoryImpl: typeof import("../../../src/data/repositories/menu-repository").MenuRepositoryImpl;
    };

    const repo = new MenuRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([{ id: "cat" }]));

    const exists = await repo.categoryExists("m1", "Food");
    expect(exists).toBe(true);
  });
});
