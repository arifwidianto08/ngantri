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

describe("MerchantRepositoryImpl (unit)", () => {
  beforeEach(() => {
    db.insert.mockReset();
    db.select.mockReset();
    db.update.mockReset();
    db.delete.mockReset();
  });

  it("create: returns created merchant", async () => {
    const { MerchantRepositoryImpl } = await import(
      "../../../src/data/repositories/merchant-repository"
    );

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
    const { MerchantRepositoryImpl } = await import(
      "../../../src/data/repositories/merchant-repository"
    );

    const repo = new MerchantRepositoryImpl();
    db.select.mockImplementationOnce(() =>
      makeSelectChain([{ maxNumber: 41 }])
    );

    const next = await repo.getNextMerchantNumber();
    expect(next).toBe(42);
  });
});
