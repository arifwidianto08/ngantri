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

describe("MenuRepositoryImpl (unit)", () => {
  beforeEach(() => {
    db.insert.mockReset();
    db.select.mockReset();
    db.update.mockReset();
    db.delete.mockReset();
  });

  it("createCategory: returns created category", async () => {
    const { MenuRepositoryImpl } = await import(
      "../../../src/data/repositories/menu-repository"
    );

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
    const { MenuRepositoryImpl } = await import(
      "../../../src/data/repositories/menu-repository"
    );

    const repo = new MenuRepositoryImpl();

    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }] as Record<
      string,
      string
    >[];

    db.select.mockImplementationOnce(() => makeSelectChain(rows));

    const res = await repo.findByMerchant("m1", { limit: 2 });
    expect(res.data).toHaveLength(2);
    expect(res.hasMore).toBe(true);
    expect(res.nextCursor).toBeDefined();
  });

  it("update: returns null when not found", async () => {
    const { MenuRepositoryImpl } = await import(
      "../../../src/data/repositories/menu-repository"
    );

    const repo = new MenuRepositoryImpl();
    mockUpdateReturningOnce([]);

    const res = await repo.update("missing", { name: "x" } as Record<
      string,
      unknown
    >);
    expect(res).toBeNull();
  });

  it("categoryExists: returns true when found", async () => {
    const { MenuRepositoryImpl } = await import(
      "../../../src/data/repositories/menu-repository"
    );

    const repo = new MenuRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([{ id: "cat" }]));

    const exists = await repo.categoryExists("m1", "Food");
    expect(exists).toBe(true);
  });
});
