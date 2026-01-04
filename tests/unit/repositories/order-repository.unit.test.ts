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

describe("OrderRepositoryImpl (unit)", () => {
  beforeEach(() => {
    db.insert.mockReset();
    db.select.mockReset();
    db.update.mockReset();
    db.delete.mockReset();
  });

  it("create: returns created order", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    const created = {
      id: "o1",
      sessionId: "s1",
      merchantId: "m1",
      status: "pending",
      totalAmount: 1000,
      customerName: null,
      customerPhone: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockInsertReturningOnce([created]);

    const res = await repo.create({
      sessionId: created.sessionId,
      merchantId: created.merchantId,
      status: created.status,
      totalAmount: created.totalAmount,
      customerName: null,
      customerPhone: null,
      notes: null,
    });

    expect(res).toEqual(created);
  });

  it("findBySession: paginates results", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();

    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }] as Record<
      string,
      string
    >[];
    db.select.mockImplementationOnce(() => makeSelectChain(rows));

    const res = await repo.findBySession("s1", {
      limit: 2,
      status: "pending,ready",
    });
    expect(res.data).toHaveLength(2);
    expect(res.hasMore).toBe(true);
  });

  it("removeOrderItem: returns false when delete throws", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    db.delete.mockImplementationOnce(() => ({
      where: jest.fn(async () => {
        throw new Error("boom");
      }),
    }));

    await expect(repo.removeOrderItem("x")).resolves.toBe(false);
  });

  it("findPaymentsByOrderId: returns [] when no junction rows", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([]));

    const res = await repo.findPaymentsByOrderId("o1");
    expect(res).toEqual([]);
  });
});
