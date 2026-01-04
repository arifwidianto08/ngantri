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

describe("MerchantRepositoryImpl (unit)", () => {
  beforeEach(() => {
    db.insert.mockReset();
    db.select.mockReset();
    db.update.mockReset();
    db.delete.mockReset();
  });

  it("create: returns created merchant", async () => {
    const { MerchantRepositoryImpl } = require("../../../src/data/repositories/merchant-repository") as {
      MerchantRepositoryImpl: typeof import("../../../src/data/repositories/merchant-repository").MerchantRepositoryImpl;
    };

    const repo = new MerchantRepositoryImpl();
    const created = {
      id: "m1",
      phoneNumber: "+628123",
      passwordHash: "hash",
      merchantNumber: 1,
      name: "Warung",
      imageUrl: null,
      description: null,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockInsertReturningOnce([created]);
    const res = await repo.create({
      phoneNumber: created.phoneNumber,
      passwordHash: created.passwordHash,
      merchantNumber: created.merchantNumber,
      name: created.name,
      imageUrl: null,
      description: null,
      isAvailable: true,
    });

    expect(db.insert).toHaveBeenCalled();
    expect(res).toEqual(created);
  });

  it("getNextMerchantNumber: returns max + 1", async () => {
    const { MerchantRepositoryImpl } = require("../../../src/data/repositories/merchant-repository") as {
      MerchantRepositoryImpl: typeof import("../../../src/data/repositories/merchant-repository").MerchantRepositoryImpl;
    };

    const repo = new MerchantRepositoryImpl();
    db.select.mockImplementationOnce(() => makeSelectChain([{ maxNumber: 41 }]));

    const next = await repo.getNextMerchantNumber();
    expect(next).toBe(42);
  });
});
