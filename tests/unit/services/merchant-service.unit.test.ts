import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import type { MerchantRepository } from "../../../src/data/interfaces/merchant-repository";
import type { Merchant } from "../../../src/data/schema";
import type { MerchantService as MerchantServiceType } from "../../../src/services/merchant-service";
import { ERROR_CODES } from "../../../src/lib/errors";

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const bcrypt = {
  hash: jest.fn() as jest.MockedFunction<
    (data: string | Buffer, saltOrRounds: number) => Promise<string>
  >,
  compare: jest.fn() as jest.MockedFunction<
    (data: string | Buffer, encrypted: string) => Promise<boolean>
  >,
};

jest.doMock("bcryptjs", () => ({
  __esModule: true,
  default: bcrypt,
}));

let MerchantService: typeof MerchantServiceType;

const makeMerchant = (overrides: Partial<Merchant> = {}): Merchant => {
  const now = new Date();
  return {
    id: "merch1",
    merchantNumber: 1,
    phoneNumber: "+6281234567890",
    passwordHash: "hash",
    name: "Warung",
    description: null,
    imageUrl: null,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
};

describe("MerchantService (unit)", () => {
  let repo: jest.Mocked<MerchantRepository>;
  let service: MerchantServiceType;

  beforeAll(async () => {
    const mod = await import("../../../src/services/merchant-service");
    MerchantService = mod.MerchantService;
  });

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhoneNumber: jest.fn(),
      findByMerchantNumber: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      updateAvailability: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      exists: jest.fn(),
      getNextMerchantNumber: jest.fn(),
      count: jest.fn(),
    };

    service = new MerchantService(repo);

    bcrypt.hash.mockReset();
    bcrypt.compare.mockReset();
  });

  describe("register", () => {
    it("VALID: registers merchant with hashed password", async () => {
      repo.findByPhoneNumber.mockResolvedValue(null);
      repo.getNextMerchantNumber.mockResolvedValue(10);
      bcrypt.hash.mockResolvedValue("hashed");
      repo.create.mockResolvedValue(
        makeMerchant({ merchantNumber: 10, passwordHash: "hashed" })
      );

      const res = await service.register({
        phoneNumber: "+6281234567000",
        password: "password123",
        name: "New Merchant",
      });

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(repo.getNextMerchantNumber).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: "+6281234567000",
          passwordHash: "hashed",
          merchantNumber: 10,
          isAvailable: true,
        })
      );
      expect(res).toHaveProperty("id");
    });

    it("FAIL: rejects duplicate phone number", async () => {
      repo.findByPhoneNumber.mockResolvedValue(makeMerchant());

      await expect(
        service.register({
          phoneNumber: "+6281234567000",
          password: "password123",
          name: "New Merchant",
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.CONFLICT });
    });

    it("FAIL: rejects weak password", async () => {
      await expect(
        service.register({
          phoneNumber: "+6281234567000",
          password: "short",
          name: "New Merchant",
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });
    });
  });

  describe("login", () => {
    it("VALID: logs in with valid credentials", async () => {
      repo.findByPhoneNumber.mockResolvedValue(makeMerchant());
      bcrypt.compare.mockResolvedValue(true);

      const res = await service.login({
        phoneNumber: "+6281234567890",
        password: "password123",
      });

      expect(res.merchant).toHaveProperty("id", "merch1");
    });

    it("FAIL: invalid credentials when merchant missing", async () => {
      repo.findByPhoneNumber.mockResolvedValue(null);

      await expect(
        service.login({ phoneNumber: "+6281", password: "x" })
      ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_CREDENTIALS });
    });

    it("FAIL: invalid credentials when password mismatch", async () => {
      repo.findByPhoneNumber.mockResolvedValue(makeMerchant());
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login({ phoneNumber: "+6281234567890", password: "wrong" })
      ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_CREDENTIALS });
    });

    it("FAIL: rejects inactive merchant", async () => {
      repo.findByPhoneNumber.mockResolvedValue(
        makeMerchant({ isAvailable: false })
      );
      bcrypt.compare.mockResolvedValue(true);

      await expect(
        service.login({
          phoneNumber: "+6281234567890",
          password: "password123",
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.MERCHANT_INACTIVE });
    });
  });

  describe("validatePassword", () => {
    it("VALID: returns compare result", async () => {
      bcrypt.compare.mockResolvedValue(true);
      await expect(
        service.validatePassword(makeMerchant(), "password123")
      ).resolves.toBe(true);
    });

    it("FAIL: wraps compare errors", async () => {
      bcrypt.compare.mockRejectedValue(new Error("boom"));
      await expect(
        service.validatePassword(makeMerchant(), "password123")
      ).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("find/update/delete", () => {
    it("VALID: findById returns merchant", async () => {
      repo.findById.mockResolvedValue(makeMerchant({ id: "x" }));
      await expect(service.findById("x")).resolves.toMatchObject({ id: "x" });
    });

    it("FAIL: findById throws MERCHANT_NOT_FOUND", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById("missing")).rejects.toMatchObject({
        code: ERROR_CODES.MERCHANT_NOT_FOUND,
      });
    });

    it("VALID: update calls repository", async () => {
      repo.findById.mockResolvedValue(makeMerchant({ id: "x" }));
      repo.update.mockResolvedValue(makeMerchant({ id: "x", name: "Updated" }));

      await expect(
        service.update("x", { name: "Updated" })
      ).resolves.toMatchObject({
        name: "Updated",
      });
    });

    it("VALID: softDelete resolves when repo returns true", async () => {
      repo.findById.mockResolvedValue(makeMerchant({ id: "x" }));
      repo.softDelete.mockResolvedValue(true);

      await expect(service.softDelete("x")).resolves.toBeUndefined();
    });
  });

  describe("activate/deactivate/updateProfileImage", () => {
    it("VALID: activate sets isAvailable true", async () => {
      repo.findById.mockResolvedValue(makeMerchant({ id: "x" }));
      repo.update.mockResolvedValue(
        makeMerchant({ id: "x", isAvailable: true })
      );
      await expect(service.activate("x")).resolves.toMatchObject({
        isAvailable: true,
      });
    });

    it("VALID: deactivate sets isAvailable false", async () => {
      repo.findById.mockResolvedValue(makeMerchant({ id: "x" }));
      repo.update.mockResolvedValue(
        makeMerchant({ id: "x", isAvailable: false })
      );
      await expect(service.deactivate("x")).resolves.toMatchObject({
        isAvailable: false,
      });
    });

    it("VALID: updateProfileImage sets imageUrl", async () => {
      repo.findById.mockResolvedValue(makeMerchant({ id: "x" }));
      repo.update.mockResolvedValue(
        makeMerchant({ id: "x", imageUrl: "/img.png" })
      );
      await expect(
        service.updateProfileImage("x", "/img.png")
      ).resolves.toMatchObject({
        imageUrl: "/img.png",
      });
    });
  });

  describe("isPhoneNumberUnique", () => {
    it("VALID: returns true when not found", async () => {
      repo.findByPhoneNumber.mockResolvedValue(null);
      await expect(service.isPhoneNumberUnique("+6281234567000")).resolves.toBe(
        true
      );
    });

    it("VALID: returns true when excludeId matches", async () => {
      repo.findByPhoneNumber.mockResolvedValue(makeMerchant({ id: "same" }));
      await expect(
        service.isPhoneNumberUnique("+6281234567890", "same")
      ).resolves.toBe(true);
    });

    it("VALID: returns false when belongs to different merchant", async () => {
      repo.findByPhoneNumber.mockResolvedValue(makeMerchant({ id: "other" }));
      await expect(
        service.isPhoneNumberUnique("+6281234567890", "same")
      ).resolves.toBe(false);
    });
  });
});
