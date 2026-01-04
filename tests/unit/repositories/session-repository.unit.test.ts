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

interface MockSelectChain<T> {
  from: jest.Mock;
  where: jest.Mock;
  orderBy: jest.Mock;
  leftJoin: jest.Mock;
  limit: jest.Mock;
  then: (resolve: (value: T[]) => void) => Promise<T[]>;
}

const makeSelectChain = <T>(results: T[]): MockSelectChain<T> => {
  const chain = {
    from: jest.fn(function (this: MockSelectChain<T>) {
      return this;
    }),
    where: jest.fn(function (this: MockSelectChain<T>) {
      return this;
    }),
    orderBy: jest.fn(function (this: MockSelectChain<T>) {
      return this;
    }),
    leftJoin: jest.fn(function (this: MockSelectChain<T>) {
      return this;
    }),
    limit: jest.fn(async () => results),
  } as MockSelectChain<T>;

  chain.then = (resolve: (value: T[]) => void): Promise<T[]> => {
    resolve(results);
    return Promise.resolve(results);
  };

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
    const { SessionRepositoryImpl } = await import(
      "../../../src/data/repositories/session-repository"
    );

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
    const { SessionRepositoryImpl } = await import(
      "../../../src/data/repositories/session-repository"
    );

    const repo = new SessionRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([]));

    const res = await repo.findSessionById("missing");
    expect(res).toBeNull();
  });

  it("updateSession: returns updated row", async () => {
    const { SessionRepositoryImpl } = await import(
      "../../../src/data/repositories/session-repository"
    );

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
    const { SessionRepositoryImpl } = await import(
      "../../../src/data/repositories/session-repository"
    );

    const repo = new SessionRepositoryImpl();
    mockUpdateReturningOnce([]);

    const res = await repo.softDeleteSession("s1");
    expect(res).toBe(false);
  });

  it("addCartItems: updates existing item", async () => {
    const { SessionRepositoryImpl } = await import(
      "../../../src/data/repositories/session-repository"
    );

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
    const { SessionRepositoryImpl } = await import(
      "../../../src/data/repositories/session-repository"
    );

    const repo = new SessionRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([{ total: 12345 }]));

    const total = await repo.getCartTotal("s1");
    expect(total).toBe(12345);
  });
});
