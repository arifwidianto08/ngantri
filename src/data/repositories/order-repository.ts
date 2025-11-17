import { eq, desc, gt, and, isNull, sql, gte, lte, inArray } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  orders,
  orderItems,
  orderPayments,
  orderPaymentItems,
  type Order,
  type NewOrder,
  type OrderItem,
  type NewOrderItem,
  type OrderPayment,
} from "../schema";
import type { OrderRepository } from "../interfaces/order-repository";

export class OrderRepositoryImpl implements OrderRepository {
  async create(order: NewOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async findById(id: string): Promise<Order | null> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .limit(1);

    return order || null;
  }

  async findBySession(
    sessionId: string,
    options?: {
      cursor?: string;
      limit?: number;
      status?: string;
    }
  ): Promise<{
    data: Order[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const limit = Math.min(options?.limit ?? 20, 100);
    const conditions = [
      eq(orders.sessionId, sessionId),
      isNull(orders.deletedAt),
    ];

    if (options?.cursor) {
      conditions.push(gt(orders.id, options.cursor));
    }

    const results = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.id))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[limit - 1].id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async findByMerchant(
    merchantId: string,
    options?: {
      cursor?: string;
      limit?: number;
      status?:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled";
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    data: Order[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const limit = Math.min(options?.limit ?? 20, 100);
    const conditions = [
      eq(orders.merchantId, merchantId),
      isNull(orders.deletedAt),
    ];

    if (options?.cursor) {
      conditions.push(gt(orders.id, options.cursor));
    }

    if (options?.status) {
      conditions.push(eq(orders.status, options.status));
    }

    if (options?.startDate) {
      conditions.push(gte(orders.createdAt, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(orders.createdAt, options.endDate));
    }

    const results = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.id))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[limit - 1].id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async update(
    id: string,
    updates: Partial<Omit<Order, "id" | "createdAt">>
  ): Promise<Order | null> {
    const [updated] = await db
      .update(orders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .returning();

    return updated || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(orders)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .returning();

    return !!deleted;
  }

  // Order Items methods
  async createOrderItem(orderItem: NewOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(orderItem).returning();
    return created;
  }

  async createOrderItems(items: NewOrderItem[]): Promise<OrderItem[]> {
    const created = await db.insert(orderItems).values(items).returning();
    return created;
  }

  async findOrderItems(orderId: string): Promise<OrderItem[]> {
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return items;
  }

  async updateOrderItem(
    id: string,
    updates: Partial<Omit<OrderItem, "id" | "orderId">>
  ): Promise<OrderItem | null> {
    const [updated] = await db
      .update(orderItems)
      .set(updates)
      .where(eq(orderItems.id, id))
      .returning();

    return updated || null;
  }

  // Additional interface methods (basic implementations)
  async updateStatus(id: string, status: string): Promise<Order | null> {
    return this.update(id, { status });
  }

  async updateCustomerInfo(
    id: string,
    customerName?: string,
    customerPhone?: string,
    notes?: string
  ): Promise<Order | null> {
    return this.update(id, { customerName, customerPhone, notes });
  }

  async addOrderItem(orderItem: NewOrderItem): Promise<OrderItem> {
    return this.createOrderItem(orderItem);
  }

  async removeOrderItem(id: string): Promise<boolean> {
    try {
      await db.delete(orderItems).where(eq(orderItems.id, id));
      return true;
    } catch {
      return false;
    }
  }

  async getTotalAmount(orderId: string): Promise<number> {
    const items = await this.findOrderItems(orderId);
    return items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
  }

  async getOrderWithItems(orderId: string): Promise<{
    order: Order;
    items: OrderItem[];
  } | null> {
    const order = await this.findById(orderId);
    if (!order) return null;

    const items = await this.findOrderItems(orderId);
    return { order, items };
  }

  async count(
    merchantId?: string,
    options?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<number> {
    const conditions = [isNull(orders.deletedAt)];

    if (merchantId) {
      conditions.push(eq(orders.merchantId, merchantId));
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));

    return Number(result?.count || 0);
  }

  async getOrderStats(
    merchantId: string,
    options?: {
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
  }> {
    // Basic implementation - return zeros for now
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersByStatus: {},
    };
  }

  async findPaymentsByOrderId(orderId: string): Promise<OrderPayment[]> {
    // Find payment IDs linked to this order through junction table
    const paymentItems = await db
      .select()
      .from(orderPaymentItems)
      .where(eq(orderPaymentItems.orderId, orderId));

    if (paymentItems.length === 0) {
      return [];
    }

    const paymentIds = paymentItems.map((item) => item.paymentId);

    // Get the payment records
    const payments = await db
      .select()
      .from(orderPayments)
      .where(
        and(
          inArray(orderPayments.id, paymentIds),
          isNull(orderPayments.deletedAt)
        )
      )
      .orderBy(desc(orderPayments.createdAt));

    return payments;
  }
}
