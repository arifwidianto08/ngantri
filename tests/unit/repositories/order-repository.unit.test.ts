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

describe("OrderRepositoryImpl (unit)", () => {
  beforeEach(() => {
    db.insert.mockReset();
    db.select.mockReset();
    db.update.mockReset();
    db.delete.mockReset();
  });

  it("create: returns created order", async () => {
    const { OrderRepositoryImpl } = require("../../../src/data/repositories/order-repository") as {
      OrderRepositoryImpl: typeof import("../../../src/data/repositories/order-repository").OrderRepositoryImpl;
    };

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
    const { OrderRepositoryImpl } = require("../../../src/data/repositories/order-repository") as {
      OrderRepositoryImpl: typeof import("../../../src/data/repositories/order-repository").OrderRepositoryImpl;
    };

    const repo = new OrderRepositoryImpl();

    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }] as any[];
    db.select.mockImplementationOnce(() => makeSelectChain(rows));

    const res = await repo.findBySession("s1", { limit: 2, status: "pending,ready" });
    expect(res.data).toHaveLength(2);
    expect(res.hasMore).toBe(true);
  });

  it("removeOrderItem: returns false when delete throws", async () => {
    const { OrderRepositoryImpl } = require("../../../src/data/repositories/order-repository") as {
      OrderRepositoryImpl: typeof import("../../../src/data/repositories/order-repository").OrderRepositoryImpl;
    };

    const repo = new OrderRepositoryImpl();
    db.delete.mockImplementationOnce(() => ({
      where: jest.fn(async () => {
        throw new Error("boom");
      }),
    }));

    await expect(repo.removeOrderItem("x")).resolves.toBe(false);
  });

  it("findPaymentsByOrderId: returns [] when no junction rows", async () => {
    const { OrderRepositoryImpl } = require("../../../src/data/repositories/order-repository") as {
      OrderRepositoryImpl: typeof import("../../../src/data/repositories/order-repository").OrderRepositoryImpl;
    };

    const repo = new OrderRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([]));

    const res = await repo.findPaymentsByOrderId("o1");
    expect(res).toEqual([]);
  });
});
