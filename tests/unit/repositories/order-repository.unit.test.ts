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

  it("updateStatus: returns updated order", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    const updated = {
      id: "o1",
      sessionId: "s1",
      merchantId: "m1",
      status: "ready",
      totalAmount: 1000,
      customerName: null,
      customerPhone: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockUpdateReturningOnce([updated]);

    const res = await repo.updateStatus("o1", "ready");
    expect(db.update).toHaveBeenCalled();
    expect(res).toEqual(updated);
  });

  it("updateStatus: returns null when not found", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    mockUpdateReturningOnce([]);

    const res = await repo.updateStatus("missing", "ready");
    expect(res).toBeNull();
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

  it("addOrderItem: returns created order item", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    const created = {
      id: "i1",
      orderId: "o1",
      menuId: "menu1",
      menuName: "Nasi",
      menuImageUrl: null,
      quantity: 2,
      unitPrice: 10000,
      subtotal: 20000,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockInsertReturningOnce([created]);

    const res = await repo.addOrderItem({
      orderId: created.orderId,
      menuId: created.menuId,
      menuName: created.menuName,
      menuImageUrl: null,
      quantity: created.quantity,
      unitPrice: created.unitPrice,
      subtotal: created.subtotal,
    });

    expect(db.insert).toHaveBeenCalled();
    expect(res).toEqual(created);
  });

  it("addOrderItems: returns created order items", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    const created = [
      {
        id: "i1",
        orderId: "o1",
        menuId: "menu1",
        menuName: "Nasi",
        menuImageUrl: null,
        quantity: 1,
        unitPrice: 10000,
        subtotal: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: "i2",
        orderId: "o1",
        menuId: "menu2",
        menuName: "Teh",
        menuImageUrl: null,
        quantity: 2,
        unitPrice: 5000,
        subtotal: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    mockInsertReturningOnce(created);

    const res = await repo.addOrderItems(
      created.map((row) => ({
        orderId: row.orderId,
        menuId: row.menuId,
        menuName: row.menuName,
        menuImageUrl: null,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        subtotal: row.subtotal,
      }))
    );

    expect(db.insert).toHaveBeenCalled();
    expect(res).toEqual(created);
  });

  it("updateOrderItem: returns updated item", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    const updated = {
      id: "i1",
      orderId: "o1",
      menuId: "menu1",
      menuName: "Nasi",
      menuImageUrl: null,
      quantity: 3,
      unitPrice: 10000,
      subtotal: 30000,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockUpdateReturningOnce([updated]);

    const res = await repo.updateOrderItem("i1", {
      quantity: 3,
      subtotal: 30000,
    });

    expect(db.update).toHaveBeenCalled();
    expect(res).toEqual(updated);
  });

  it("updateOrderItem: returns null when not found", async () => {
    const { OrderRepositoryImpl } = await import(
      "../../../src/data/repositories/order-repository"
    );

    const repo = new OrderRepositoryImpl();
    mockUpdateReturningOnce([]);

    const res = await repo.updateOrderItem("missing", { quantity: 2 });
    expect(res).toBeNull();
  });
});
