import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Shared db mock for all repository tests
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

describe("SessionRepositoryImpl (unit)", () => {
  beforeEach(() => {
    db.insert.mockReset();
    db.select.mockReset();
    db.update.mockReset();
    db.delete.mockReset();
  });

  it("createSession: returns created row", async () => {
    const { SessionRepositoryImpl } = require("../../../src/data/repositories/session-repository") as {
      SessionRepositoryImpl: typeof import("../../../src/data/repositories/session-repository").SessionRepositoryImpl;
    };

    const repo = new SessionRepositoryImpl();
    const created = {
      id: "s1",
      tableNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockInsertReturningOnce([created]);

    const res = await repo.createSession({ tableNumber: 1 });
    expect(db.insert).toHaveBeenCalled();
    expect(res).toEqual(created);
  });

  it("findSessionById: returns null when not found", async () => {
    const { SessionRepositoryImpl } = require("../../../src/data/repositories/session-repository") as {
      SessionRepositoryImpl: typeof import("../../../src/data/repositories/session-repository").SessionRepositoryImpl;
    };

    const repo = new SessionRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([]));

    const res = await repo.findSessionById("missing");
    expect(res).toBeNull();
  });

  it("updateSession: returns updated row", async () => {
    const { SessionRepositoryImpl } = require("../../../src/data/repositories/session-repository") as {
      SessionRepositoryImpl: typeof import("../../../src/data/repositories/session-repository").SessionRepositoryImpl;
    };

    const repo = new SessionRepositoryImpl();
    const updated = {
      id: "s1",
      tableNumber: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockUpdateReturningOnce([updated]);

    const res = await repo.updateSession("s1", { tableNumber: 2 });
    expect(db.update).toHaveBeenCalled();
    expect(res).toEqual(updated);
  });

  it("softDeleteSession: returns false when nothing deleted", async () => {
    const { SessionRepositoryImpl } = require("../../../src/data/repositories/session-repository") as {
      SessionRepositoryImpl: typeof import("../../../src/data/repositories/session-repository").SessionRepositoryImpl;
    };

    const repo = new SessionRepositoryImpl();
    mockUpdateReturningOnce([]);

    const res = await repo.softDeleteSession("s1");
    expect(res).toBe(false);
  });

  it("addCartItems: updates existing item", async () => {
    const { SessionRepositoryImpl } = require("../../../src/data/repositories/session-repository") as {
      SessionRepositoryImpl: typeof import("../../../src/data/repositories/session-repository").SessionRepositoryImpl;
    };

    const repo = new SessionRepositoryImpl();

    const existing = {
      id: "c1",
      sessionId: "s1",
      merchantId: "m1",
      menuId: "menu1",
      quantity: 1,
      priceSnapshot: 1000,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    // select existing item
    db.select.mockImplementationOnce(() => makeSelectChain([existing]));

    const updated = { ...existing, quantity: 2 };
    mockUpdateReturningOnce([updated]);

    const res = await repo.addCartItems([
      {
        sessionId: "s1",
        merchantId: "m1",
        menuId: "menu1",
        quantity: 2,
        priceSnapshot: 2000,
        notes: null,
      },
    ]);

    expect(res).toEqual([updated]);
  });

  it("getCartTotal: returns aggregate total", async () => {
    const { SessionRepositoryImpl } = require("../../../src/data/repositories/session-repository") as {
      SessionRepositoryImpl: typeof import("../../../src/data/repositories/session-repository").SessionRepositoryImpl;
    };

    const repo = new SessionRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([{ total: 12345 }]));

    const total = await repo.getCartTotal("s1");
    expect(total).toBe(12345);
  });
});
