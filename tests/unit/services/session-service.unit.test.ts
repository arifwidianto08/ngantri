import { describe, expect, it, beforeEach, jest } from "@jest/globals";

import type { SessionRepository } from "../../../src/data/interfaces/session-repository";
import type { BuyerSession } from "../../../src/data/schema";
import { SessionService } from "../../../src/services/session-service";
import { AppError, ERROR_CODES } from "../../../src/lib/errors";

const makeSession = (overrides: Partial<BuyerSession> = {}): BuyerSession => {
  const now = new Date();
  return {
    id: "00000000-0000-7000-a000-000000000000",
    tableNumber: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
};

describe("SessionService (unit)", () => {
  let repo: jest.Mocked<SessionRepository>;
  let service: SessionService;

  beforeEach(() => {
    repo = {
      createSession: jest.fn(),
      findSessionById: jest.fn(),
      updateSession: jest.fn(),
      softDeleteSession: jest.fn(),

      // Unused by SessionService unit tests
      addCartItem: jest.fn(),
      findCartItems: jest.fn(),
      findCartItemById: jest.fn(),
      updateCartItem: jest.fn(),
      removeCartItem: jest.fn(),
      clearCart: jest.fn(),
      getCartTotal: jest.fn(),
      getCartItemCount: jest.fn(),
      getCartByMerchant: jest.fn(),
      sessionExists: jest.fn(),
      cleanupExpiredSessions: jest.fn(),
    };

    service = new SessionService(repo);
  });

  describe("createSession", () => {
    it("VALID: creates session with tableNumber", async () => {
      const created = makeSession({ id: "s1", tableNumber: 5 });
      repo.createSession.mockResolvedValue(created);

      const res = await service.createSession({ tableNumber: 5 });

      expect(repo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ tableNumber: 5 })
      );
      expect(res).toEqual(created);
    });

    it("VALID: creates session with default tableNumber null", async () => {
      const created = makeSession({ id: "s2", tableNumber: null });
      repo.createSession.mockResolvedValue(created);

      const res = await service.createSession();

      expect(repo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ tableNumber: null })
      );
      expect(res).toEqual(created);
    });

    it("FAIL: rejects invalid tableNumber", async () => {
      await expect(service.createSession({ tableNumber: -1 })).rejects.toMatchObject(
        {
          name: "AppError",
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: 400,
        }
      );
    });

    it("FAIL: wraps repository failures as internal error", async () => {
      repo.createSession.mockRejectedValue(new Error("db down"));

      await expect(service.createSession({ tableNumber: 1 })).rejects.toMatchObject(
        {
          name: "AppError",
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          statusCode: 500,
        }
      );
    });
  });

  describe("findSessionById", () => {
    it("VALID: returns session when found", async () => {
      const session = makeSession({ id: "s3" });
      repo.findSessionById.mockResolvedValue(session);

      await expect(service.findSessionById("s3")).resolves.toEqual(session);
    });

    it("FAIL: throws NOT_FOUND when session missing", async () => {
      repo.findSessionById.mockResolvedValue(null);

      await expect(service.findSessionById("missing")).rejects.toMatchObject({
        name: "AppError",
        code: ERROR_CODES.NOT_FOUND,
        statusCode: 404,
      });
    });

    it("FAIL: wraps unknown errors as internal", async () => {
      repo.findSessionById.mockRejectedValue(new Error("boom"));

      await expect(service.findSessionById("s4")).rejects.toMatchObject({
        name: "AppError",
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        statusCode: 500,
      });
    });
  });

  describe("findOrCreateSession", () => {
    it("VALID: returns existing session without creating", async () => {
      const existing = makeSession({ id: "keep" });
      repo.findSessionById.mockResolvedValue(existing);

      const res = await service.findOrCreateSession("keep");

      expect(res).toEqual(existing);
      expect(repo.createSession).not.toHaveBeenCalled();
    });

    it("VALID: creates session when not found", async () => {
      const created = makeSession({ id: "new" });
      repo.findSessionById.mockResolvedValue(null);
      repo.createSession.mockResolvedValue(created);

      const res = await service.findOrCreateSession("new");

      expect(repo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: "new" })
      );
      expect(res).toEqual(created);
    });

    it("FAIL: rethrows AppError as-is", async () => {
      const appErr = new AppError(
        ERROR_CODES.NOT_FOUND,
        "not found",
        404
      );
      repo.findSessionById.mockRejectedValue(appErr);

      await expect(service.findOrCreateSession("x")).rejects.toBe(appErr);
    });
  });

  describe("updateTableNumber", () => {
    it("VALID: updates table number", async () => {
      const updated = makeSession({ id: "s5", tableNumber: 3 });
      repo.updateSession.mockResolvedValue(updated);

      const res = await service.updateTableNumber("s5", 3);

      expect(repo.updateSession).toHaveBeenCalledWith(
        "s5",
        expect.objectContaining({ tableNumber: 3 })
      );
      expect(res).toEqual(updated);
    });

    it("FAIL: rejects non-positive table number", async () => {
      await expect(service.updateTableNumber("s5", 0)).rejects.toMatchObject({
        name: "AppError",
        code: ERROR_CODES.VALIDATION_ERROR,
        statusCode: 400,
      });
    });

    it("FAIL: rejects too-large table number", async () => {
      await expect(service.updateTableNumber("s5", 1000)).rejects.toMatchObject({
        name: "AppError",
        code: ERROR_CODES.VALIDATION_ERROR,
        statusCode: 400,
      });
    });

    it("FAIL: throws NOT_FOUND when session missing", async () => {
      repo.updateSession.mockResolvedValue(null);

      await expect(service.updateTableNumber("missing", 2)).rejects.toMatchObject({
        name: "AppError",
        code: ERROR_CODES.NOT_FOUND,
        statusCode: 404,
      });
    });
  });

  describe("deleteSession", () => {
    it("VALID: soft deletes existing session", async () => {
      repo.findSessionById.mockResolvedValue(makeSession({ id: "s6" }));
      repo.softDeleteSession.mockResolvedValue(true);

      await expect(service.deleteSession("s6")).resolves.toBeUndefined();
      expect(repo.softDeleteSession).toHaveBeenCalledWith("s6");
    });

    it("FAIL: throws internal error when delete returns false", async () => {
      repo.findSessionById.mockResolvedValue(makeSession({ id: "s7" }));
      repo.softDeleteSession.mockResolvedValue(false);

      await expect(service.deleteSession("s7")).rejects.toMatchObject({
        name: "AppError",
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        statusCode: 500,
      });
    });
  });

  describe("validateSessionData", () => {
    it("VALID: allows undefined tableNumber", async () => {
      await expect(service.validateSessionData({})).resolves.toBeUndefined();
    });

    it("FAIL: rejects invalid tableNumber", async () => {
      await expect(service.validateSessionData({ tableNumber: -5 })).rejects.toMatchObject(
        {
          name: "AppError",
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: 400,
        }
      );
    });
  });

  describe("getActiveSessionsCount", () => {
    it("VALID: returns placeholder 0", async () => {
      await expect(service.getActiveSessionsCount()).resolves.toBe(0);
    });
  });

  describe("getSessionStats", () => {
    it("VALID: returns placeholder stats", async () => {
      const stats = await service.getSessionStats();
      expect(stats).toEqual(
        expect.objectContaining({
          totalSessions: 0,
          activeSessions: 0,
          averageSessionDuration: 0,
          sessionsToday: 0,
        })
      );
    });
  });
});
