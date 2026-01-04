import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { OrderRepository } from "../../../src/data/interfaces/order-repository";
import type { Order, OrderItem } from "../../../src/data/schema";
import { OrderService } from "../../../src/services/order-service";
import { ERROR_CODES } from "../../../src/lib/errors";

const makeOrder = (overrides: Partial<Order> = {}): Order => {
  const now = new Date();
  return {
    id: "o1",
    sessionId: "s1",
    merchantId: "m1",
    customerName: null,
    customerPhone: null,
    totalAmount: 10000,
    status: "pending",
    notes: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
};

const makeItem = (overrides: Partial<OrderItem> = {}): OrderItem => {
  const now = new Date();
  return {
    id: "i1",
    orderId: "o1",
    menuId: "menu1",
    menuName: "Menu",
    menuImageUrl: null,
    quantity: 1,
    unitPrice: 10000,
    subtotal: 10000,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
};

describe("OrderService (unit)", () => {
  let repo: jest.Mocked<OrderRepository>;
  let service: OrderService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySession: jest.fn(),
      findByMerchant: jest.fn(),
      updateStatus: jest.fn(),
      updateStatusWithPayment: jest.fn(),
      updateCustomerInfo: jest.fn(),
      addOrderItem: jest.fn(),
      addOrderItems: jest.fn(),
      findOrderItems: jest.fn(),
      updateOrderItem: jest.fn(),
      removeOrderItem: jest.fn(),
      getTotalAmount: jest.fn(),
      getOrderWithItems: jest.fn(),
      findPaymentsByOrderId: jest.fn(),
      count: jest.fn(),
      getOrderStats: jest.fn(),
    };

    service = new OrderService(repo);
  });

  describe("createOrder", () => {
    it("VALID: creates order and items", async () => {
      repo.create.mockResolvedValue(makeOrder({ id: "o2", totalAmount: 20000 }));
      repo.addOrderItems.mockResolvedValue([makeItem({ orderId: "o2" })]);

      const res = await service.createOrder({
        sessionId: "s1",
        merchantId: "m1",
        customerName: "Test",
        customerPhone: "+6281234567890",
        items: [
          { menuId: "menu1", menuName: "Menu", quantity: 2, unitPrice: 10000 },
        ],
      });

      expect(repo.create).toHaveBeenCalled();
      expect(repo.addOrderItems).toHaveBeenCalled();
      expect(res).toHaveProperty("id", "o2");
    });

    it("FAIL: rejects missing sessionId", async () => {
      await expect(
        service.createOrder({
          // @ts-expect-error intentional invalid test
          sessionId: "",
          merchantId: "m1",
          items: [{ menuId: "menu1", menuName: "Menu", quantity: 1, unitPrice: 1 }],
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });
    });

    it("FAIL: wraps repository errors", async () => {
      repo.create.mockRejectedValue(new Error("db"));

      await expect(
        service.createOrder({
          sessionId: "s1",
          merchantId: "m1",
          items: [{ menuId: "menu1", menuName: "Menu", quantity: 1, unitPrice: 1 }],
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.INTERNAL_SERVER_ERROR });
    });
  });

  describe("findOrderById", () => {
    it("VALID: returns order", async () => {
      repo.findById.mockResolvedValue(makeOrder({ id: "o3" }));
      await expect(service.findOrderById("o3")).resolves.toMatchObject({ id: "o3" });
    });

    it("FAIL: throws ORDER_NOT_FOUND", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOrderById("missing")).rejects.toMatchObject({
        code: ERROR_CODES.ORDER_NOT_FOUND,
      });
    });
  });

  describe("updateOrderStatus", () => {
    it("VALID: updates status", async () => {
      repo.findById.mockResolvedValue(makeOrder({ id: "o4" }));
      repo.updateStatusWithPayment.mockResolvedValue(makeOrder({ id: "o4", status: "ready" }));

      await expect(service.updateOrderStatus("o4", "ready")).resolves.toMatchObject({
        status: "ready",
      });
    });

    it("VALID: sets paymentStatus when completed", async () => {
      repo.findById.mockResolvedValue(makeOrder({ id: "o4" }));
      repo.updateStatusWithPayment.mockResolvedValue(
        makeOrder({ id: "o4", status: "completed" })
      );

      await service.updateOrderStatus("o4", "completed");
      expect(repo.updateStatusWithPayment).toHaveBeenCalledWith(
        "o4",
        "completed",
        "paid"
      );
    });

    it("FAIL: rejects invalid status", async () => {
      repo.findById.mockResolvedValue(makeOrder({ id: "o4" }));
      await expect(service.updateOrderStatus("o4", "bogus")).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    });
  });

  describe("cancelOrder", () => {
    it("VALID: cancels when not completed/cancelled", async () => {
      repo.findById.mockResolvedValue(makeOrder({ id: "o5", status: "pending" }));
      repo.updateStatus.mockResolvedValue(makeOrder({ id: "o5", status: "cancelled" }));

      await expect(service.cancelOrder("o5")).resolves.toMatchObject({ status: "cancelled" });
    });

    it("FAIL: cannot cancel completed", async () => {
      repo.findById.mockResolvedValue(makeOrder({ id: "o6", status: "completed" }));
      await expect(service.cancelOrder("o6")).rejects.toMatchObject({
        code: ERROR_CODES.BAD_REQUEST,
      });
    });
  });

  describe("getOrderItems", () => {
    it("VALID: returns items", async () => {
      repo.findById.mockResolvedValue(makeOrder({ id: "o7" }));
      repo.findOrderItems.mockResolvedValue([makeItem({ orderId: "o7" })]);

      const items = await service.getOrderItems("o7");
      expect(items).toHaveLength(1);
    });
  });

  describe("validateOrderItems", () => {
    it("FAIL: rejects quantity > 100", async () => {
      await expect(
        service.validateOrderItems([
          { menuId: "m", menuName: "n", quantity: 101, unitPrice: 1000 },
        ])
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });
    });

    it("FAIL: rejects invalid phone number", async () => {
      await expect(
        service.validateOrderData({
          sessionId: "s",
          merchantId: "m",
          customerPhone: "not-a-phone",
          items: [{ menuId: "m", menuName: "n", quantity: 1, unitPrice: 1000 }],
        })
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });
    });
  });

  describe("getOrderStats", () => {
    it("VALID: maps repository stats", async () => {
      repo.getOrderStats.mockResolvedValue({
        totalOrders: 2,
        totalRevenue: 1000,
        averageOrderValue: 500,
        ordersByStatus: { pending: 2 },
      });

      const stats = await service.getOrderStats("m1");
      expect(stats).toEqual(
        expect.objectContaining({
          totalOrders: 2,
          totalRevenue: 1000,
          averageOrderValue: 500,
          statusBreakdown: { pending: 2 },
        })
      );
    });
  });
});
