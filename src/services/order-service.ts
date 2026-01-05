/**
 * Order service interface and implementation
 * Handles business logic for order operations
 */

import type { OrderRepository } from "../data/interfaces/order-repository";
import type { Order, NewOrder, OrderItem, NewOrderItem } from "../data/schema";
import type {
  PaginatedResult,
  CursorPaginationParams,
} from "../lib/pagination";
import { buildPaginatedResult } from "../lib/pagination";
import { AppError, errors } from "../lib/errors";
import { calculateOrderTotal } from "../lib/currency";
import { db } from "../lib/db";
import {
  buyerSessions,
  merchants,
  menus,
  orders,
  orderItems,
} from "../data/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

// Service-specific types
export interface OrderItemData {
  menuId: string;
  menuName: string;
  menuImageUrl?: string;
  quantity: number;
  unitPrice: number; // Price in IDR
}

export interface CreateOrderData {
  sessionId: string;
  merchantId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItemData[];
  notes?: string;
}

export interface BatchOrderItem {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  menuImageUrl?: string;
}

export interface BatchOrderData {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  ordersByMerchant: Record<
    string,
    {
      merchantName: string;
      items: BatchOrderItem[];
    }
  >;
}

export interface BatchOrderResult {
  merchantId: string;
  merchantName: string;
  orderId: string;
  totalAmount: number;
}

export interface OrderSearchOptions {
  merchantId?: string;
  sessionId?: string;
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

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  paymentStatus: string;
  merchant: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

export interface OrderWithSessionDetails extends Order {
  items: OrderItem[];
  paymentStatus: string;
  merchant: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusBreakdown: Record<string, number>;
}

/**
 * Order service interface
 */
export interface IOrderService {
  // Order operations
  createOrder(data: CreateOrderData): Promise<Order>;
  createBatchOrders(data: BatchOrderData): Promise<BatchOrderResult[]>;
  findOrderById(id: string): Promise<Order>;
  findOrdersByMerchant(
    merchantId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<OrderWithDetails>>;
  findOrdersBySession(
    sessionId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<OrderWithSessionDetails>>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  cancelOrder(id: string, reason?: string): Promise<Order>;

  // Order item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Search and analytics
  searchOrders(
    options: OrderSearchOptions,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<OrderWithDetails | OrderWithSessionDetails>>;
  getOrderStats(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OrderStats>;

  // Validation methods
  validateOrderData(data: CreateOrderData): Promise<void>;
  validateOrderItems(items: OrderItemData[]): Promise<void>;
}

/**
 * Order service implementation
 */
export class OrderService implements IOrderService {
  constructor(private orderRepository: OrderRepository) {}

  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    // Validate order data
    await this.validateOrderData(data);

    // Calculate order totals
    const calculation = calculateOrderTotal(data.items);

    // Create order (no minimum order requirement)
    const orderData: NewOrder = {
      sessionId: data.sessionId,
      merchantId: data.merchantId,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      totalAmount: calculation.totalAmount,
      status: "pending",
      notes: data.notes || null,
    };

    try {
      const order = await this.orderRepository.create(orderData);

      // Create order items in bulk
      const orderItemsData: NewOrderItem[] = data.items.map((item) => ({
        orderId: order.id,
        menuId: item.menuId,
        menuName: item.menuName,
        menuImageUrl: item.menuImageUrl || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      }));

      await this.orderRepository.addOrderItems(orderItemsData);

      return order;
    } catch (error) {
      throw errors.internal("Failed to create order", error);
    }
  }

  /**
   * Create multiple orders for different merchants in a single transaction
   * All orders succeed or all fail (atomic transaction)
   */
  async createBatchOrders(data: BatchOrderData): Promise<BatchOrderResult[]> {
    const { sessionId, customerName, customerPhone, notes, ordersByMerchant } =
      data;

    // Validate input
    if (!sessionId?.trim()) {
      throw errors.validation("Session ID is required");
    }

    if (!customerName?.trim()) {
      throw errors.validation("Customer name is required");
    }

    if (!customerPhone?.trim()) {
      throw errors.validation("Customer phone is required");
    }

    if (!ordersByMerchant || Object.keys(ordersByMerchant).length === 0) {
      throw errors.validation("No orders provided");
    }

    // Validate phone number format
    this.validatePhoneNumber(customerPhone);

    // Validate merchant IDs are not undefined or empty
    for (const merchantId of Object.keys(ordersByMerchant)) {
      if (!merchantId || merchantId === "undefined") {
        throw errors.validation("Invalid merchant ID provided");
      }
    }

    try {
      // Verify session exists
      const session = await db
        .select()
        .from(buyerSessions)
        .where(eq(buyerSessions.id, sessionId))
        .limit(1);

      if (session.length === 0) {
        throw errors.notFound("Session not found");
      }

      // Execute all orders in a single transaction
      const results = await db.transaction(async (tx) => {
        const merchantEntries = Object.entries(ordersByMerchant);
        const merchantIds = merchantEntries.map(([merchantId]) => merchantId);

        // Preload merchants and menus in parallel (independent queries)
        const [merchantsById, menusById] = await Promise.all([
          this.preloadBatchMerchants(tx, merchantIds),
          this.preloadBatchMenus(tx, merchantEntries),
        ]);

        // Validate all merchants
        this.validateBatchMerchants(merchantEntries, merchantsById);

        // Flatten all items and generate order IDs
        const allItemsFlat = this.flattenBatchItems(merchantEntries);
        const { orderIdByMerchant, totalsByMerchant } =
          this.generateBatchOrderIds(merchantEntries);

        // Validate all items and prepare order items
        const allOrderItems = this.validateAndPrepareBatchItems(
          allItemsFlat,
          menusById,
          orderIdByMerchant,
          totalsByMerchant
        );

        // Build orders and results
        const { ordersToInsert, createdOrders } = this.buildBatchOrders(
          merchantEntries,
          orderIdByMerchant,
          totalsByMerchant,
          sessionId,
          customerName,
          customerPhone,
          notes
        );

        // SINGLE bulk insert for ALL orders and items in parallel (independent operations)
        await Promise.all([
          tx.insert(orders).values(ordersToInsert),
          tx.insert(orderItems).values(allOrderItems),
        ]);

        return createdOrders;
      });

      return results;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to create batch orders", error);
    }
  }

  /**
   * Find order by ID
   */
  async findOrderById(id: string): Promise<Order> {
    try {
      const order = await this.orderRepository.findById(id);
      if (!order) {
        throw errors.orderNotFound(id);
      }
      return order;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to find order", error);
    }
  }

  /**
   * Find orders by merchant with pagination
   */
  async findOrdersByMerchant(
    merchantId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<OrderWithDetails>> {
    try {
      const result = await this.orderRepository.findByMerchantWithDetails(
        merchantId,
        {
          cursor: params.cursor,
          limit: params.limit,
          status: params.status,
        }
      );

      return buildPaginatedResult(result.data, params);
    } catch (error) {
      throw errors.internal("Failed to fetch orders by merchant", error);
    }
  }

  /**
   * Find orders by session with pagination
   */
  async findOrdersBySession(
    sessionId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<OrderWithSessionDetails>> {
    try {
      const result = await this.orderRepository.findBySessionWithDetails(
        sessionId,
        {
          cursor: params.cursor,
          limit: params.limit,
          status: params.status,
        }
      );

      return buildPaginatedResult(result.data, params);
    } catch (error) {
      throw errors.internal("Failed to fetch orders by session", error);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    // Validate order exists
    await this.findOrderById(id);

    // Validate status
    const validStatuses = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      throw errors.validation(
        `Invalid order status. Valid statuses: ${validStatuses.join(", ")}`
      );
    }

    try {
      // When order is completed, automatically set payment status to paid
      let paymentStatus: string | undefined;
      if (status === "completed") {
        paymentStatus = "paid";
      }

      const updatedOrder = await this.orderRepository.updateStatusWithPayment(
        id,
        status,
        paymentStatus
      );
      if (!updatedOrder) {
        throw errors.orderNotFound(id);
      }
      return updatedOrder;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to update order status", error);
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string): Promise<Order> {
    const order = await this.findOrderById(id);

    // Check if order can be cancelled
    if (["completed", "cancelled"].includes(order.status)) {
      throw errors.badRequest(
        `Cannot cancel order with status: ${order.status}`
      );
    }

    try {
      const updatedOrder = await this.orderRepository.updateStatus(
        id,
        "cancelled"
      );
      if (!updatedOrder) {
        throw errors.orderNotFound(id);
      }

      // TODO: Add cancellation reason to order notes or separate field
      return updatedOrder;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to cancel order", error);
    }
  }

  /**
   * Get order items for an order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    // Validate order exists
    await this.findOrderById(orderId);

    try {
      return await this.orderRepository.findOrderItems(orderId);
    } catch (error) {
      throw errors.internal("Failed to fetch order items", error);
    }
  }

  /**
   * Search orders with filters
   */
  async searchOrders(
    options: OrderSearchOptions,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<OrderWithDetails | OrderWithSessionDetails>> {
    try {
      // For now, use merchant-based search as basic implementation
      // TODO: Implement proper search in repository layer
      if (options.merchantId) {
        return await this.findOrdersByMerchant(options.merchantId, params);
      }

      if (options.sessionId) {
        return await this.findOrdersBySession(options.sessionId, params);
      }

      // Return empty result if no search criteria provided
      const emptyResult = {
        data: [],
        nextCursor: undefined,
        hasMore: false,
      };
      return buildPaginatedResult(emptyResult.data, params);
    } catch (error) {
      throw errors.internal("Failed to search orders", error);
    }
  }

  /**
   * Get order statistics for a merchant
   */
  async getOrderStats(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OrderStats> {
    try {
      const stats = await this.orderRepository.getOrderStats(merchantId, {
        dateFrom: startDate,
        dateTo: endDate,
      });

      return {
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        averageOrderValue: stats.averageOrderValue,
        statusBreakdown: stats.ordersByStatus,
      };
    } catch (error) {
      throw errors.internal("Failed to fetch order statistics", error);
    }
  }

  /**
   * Validate order data
   */
  async validateOrderData(data: CreateOrderData): Promise<void> {
    // Validate required fields
    if (!data.sessionId?.trim()) {
      throw errors.validation("Session ID is required");
    }

    if (!data.merchantId?.trim()) {
      throw errors.validation("Merchant ID is required");
    }

    if (!data.items || data.items.length === 0) {
      throw errors.validation("Order must contain at least one item");
    }

    // Validate phone number format if provided
    if (data.customerPhone?.trim()) {
      this.validatePhoneNumber(data.customerPhone);
    }

    // Validate order items
    await this.validateOrderItems(data.items);
  }

  /**
   * Validate order items
   */
  async validateOrderItems(items: OrderItemData[]): Promise<void> {
    for (const item of items) {
      // Validate required fields
      if (!item.menuId?.trim()) {
        throw errors.validation("Menu ID is required for all items");
      }

      if (!item.menuName?.trim()) {
        throw errors.validation("Menu name is required for all items");
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw errors.validation("Quantity must be a positive integer");
      }

      if (typeof item.unitPrice !== "number" || item.unitPrice <= 0) {
        throw errors.validation("Unit price must be a positive number");
      }

      // Validate quantity limits
      if (item.quantity > 100) {
        throw errors.validation("Maximum quantity per item is 100");
      }
    }
  }

  /**
   * Validate Indonesian phone number format
   */
  private validatePhoneNumber(phoneNumber: string): void {
    const cleanPhone = phoneNumber.replace(/[-\s]/g, "");

    // Accept formats: 0812xxx, +62812xxx, or 812xxx (without leading 0)
    const phoneRegex = /^(\+62|62|0)?[0-9]{9,13}$/;

    if (!phoneRegex.test(cleanPhone)) {
      throw errors.validation("Invalid Indonesian phone number format");
    }

    // Additional validation: must have at least 10 digits total (including prefix)
    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      throw errors.validation("Invalid Indonesian phone number format");
    }
  }

  /**
   * Preload merchants for batch orders in bulk
   */
  private async preloadBatchMerchants(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    merchantIds: string[]
  ): Promise<Map<string, { name: string; isAvailable: boolean }>> {
    const merchantRows = await tx
      .select({
        id: merchants.id,
        name: merchants.name,
        isAvailable: merchants.isAvailable,
      })
      .from(merchants)
      .where(
        and(inArray(merchants.id, merchantIds), isNull(merchants.deletedAt))
      );

    return new Map(
      merchantRows.map(
        (m: { id: string; name: string; isAvailable: boolean }) => [
          m.id,
          { name: m.name, isAvailable: m.isAvailable },
        ]
      )
    );
  }

  /**
   * Preload menus for batch orders in bulk
   */
  private async preloadBatchMenus(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    merchantEntries: Array<
      [string, { merchantName: string; items: BatchOrderItem[] }]
    >
  ): Promise<
    Map<string, { name: string; isAvailable: boolean; merchantId: string }>
  > {
    const allMenuIds = Array.from(
      new Set(
        merchantEntries.flatMap(([, { items }]) =>
          (items ?? []).map((i) => i.menuId)
        )
      )
    );

    const menuRows = allMenuIds.length
      ? await tx
          .select({
            id: menus.id,
            name: menus.name,
            isAvailable: menus.isAvailable,
            merchantId: menus.merchantId,
          })
          .from(menus)
          .where(and(inArray(menus.id, allMenuIds), isNull(menus.deletedAt)))
      : [];

    return new Map(
      menuRows.map(
        (m: {
          id: string;
          name: string;
          isAvailable: boolean;
          merchantId: string;
        }) => [
          m.id,
          {
            name: m.name,
            isAvailable: m.isAvailable,
            merchantId: m.merchantId,
          },
        ]
      )
    );
  }

  /**
   * Validate all merchants for batch orders
   */
  private validateBatchMerchants(
    merchantEntries: Array<
      [string, { merchantName: string; items: BatchOrderItem[] }]
    >,
    merchantsById: Map<string, { name: string; isAvailable: boolean }>
  ): void {
    for (const [merchantId, { merchantName, items }] of merchantEntries) {
      if (!items || items.length === 0) {
        throw errors.validation(
          `No items provided for merchant ${merchantName}`
        );
      }

      const merchantRecord = merchantsById.get(merchantId);
      if (!merchantRecord) {
        throw errors.notFound(`Merchant not found: ${merchantId}`);
      }

      if (!merchantRecord.isAvailable) {
        throw errors.badRequest(
          `Merchant ${merchantRecord.name} is not available`
        );
      }
    }
  }

  /**
   * Flatten all items from all merchants for batch orders
   */
  private flattenBatchItems(
    merchantEntries: Array<
      [string, { merchantName: string; items: BatchOrderItem[] }]
    >
  ): Array<{ merchantId: string; merchantName: string; item: BatchOrderItem }> {
    return merchantEntries.flatMap(([merchantId, { merchantName, items }]) =>
      (items ?? []).map((item) => ({ merchantId, merchantName, item }))
    );
  }

  /**
   * Generate order IDs for each merchant in batch
   */
  private generateBatchOrderIds(
    merchantEntries: Array<
      [string, { merchantName: string; items: BatchOrderItem[] }]
    >
  ): {
    orderIdByMerchant: Map<string, string>;
    totalsByMerchant: Map<string, number>;
  } {
    const orderIdByMerchant = new Map<string, string>();
    const totalsByMerchant = new Map<string, number>();

    for (const [merchantId] of merchantEntries) {
      orderIdByMerchant.set(merchantId, uuidv7());
      totalsByMerchant.set(merchantId, 0);
    }

    return { orderIdByMerchant, totalsByMerchant };
  }

  /**
   * Validate all items and prepare order items for batch orders
   */
  private validateAndPrepareBatchItems(
    allItemsFlat: Array<{
      merchantId: string;
      merchantName: string;
      item: BatchOrderItem;
    }>,
    menusById: Map<
      string,
      { name: string; isAvailable: boolean; merchantId: string }
    >,
    orderIdByMerchant: Map<string, string>,
    totalsByMerchant: Map<string, number>
  ): Array<{
    id: string;
    orderId: string;
    menuId: string;
    menuName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    menuImageUrl: string | null;
    createdAt: Date;
  }> {
    const allOrderItems: Array<{
      id: string;
      orderId: string;
      menuId: string;
      menuName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      menuImageUrl: string | null;
      createdAt: Date;
    }> = [];

    for (const { merchantId, item } of allItemsFlat) {
      const menuRecord = menusById.get(item.menuId);
      if (!menuRecord || menuRecord.merchantId !== merchantId) {
        throw errors.notFound(`Menu not found: ${item.menuId}`);
      }

      if (!menuRecord.isAvailable) {
        throw errors.badRequest(
          `Menu ${menuRecord.name || item.menuName} is not available`
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw errors.validation("Quantity must be a positive integer");
      }

      if (item.quantity > 100) {
        throw errors.validation("Maximum quantity per item is 100");
      }

      if (typeof item.unitPrice !== "number" || item.unitPrice <= 0) {
        throw errors.validation("Unit price must be a positive number");
      }

      const orderId = orderIdByMerchant.get(merchantId)!;
      const subtotal = item.quantity * item.unitPrice;

      // Accumulate total for this merchant
      totalsByMerchant.set(
        merchantId,
        (totalsByMerchant.get(merchantId) || 0) + subtotal
      );

      allOrderItems.push({
        id: uuidv7(),
        orderId,
        menuId: item.menuId,
        menuName: item.menuName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
        menuImageUrl: item.menuImageUrl || null,
        createdAt: new Date(),
      });
    }

    return allOrderItems;
  }

  /**
   * Build orders and results for batch orders
   */
  private buildBatchOrders(
    merchantEntries: Array<
      [string, { merchantName: string; items: BatchOrderItem[] }]
    >,
    orderIdByMerchant: Map<string, string>,
    totalsByMerchant: Map<string, number>,
    sessionId: string,
    customerName: string,
    customerPhone: string,
    notes?: string
  ): {
    ordersToInsert: Array<{
      id: string;
      sessionId: string;
      merchantId: string;
      customerName: string;
      customerPhone: string;
      totalAmount: number;
      notes: string | null;
      status: "pending";
      createdAt: Date;
      updatedAt: Date;
      deletedAt: null;
    }>;
    createdOrders: BatchOrderResult[];
  } {
    const ordersToInsert: Array<{
      id: string;
      sessionId: string;
      merchantId: string;
      customerName: string;
      customerPhone: string;
      totalAmount: number;
      notes: string | null;
      status: "pending";
      createdAt: Date;
      updatedAt: Date;
      deletedAt: null;
    }> = [];
    const createdOrders: BatchOrderResult[] = [];

    for (const [merchantId, { merchantName }] of merchantEntries) {
      const orderId = orderIdByMerchant.get(merchantId)!;
      const totalAmount = totalsByMerchant.get(merchantId) || 0;

      ordersToInsert.push({
        id: orderId,
        sessionId,
        merchantId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        totalAmount,
        notes: notes || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      createdOrders.push({
        merchantId,
        merchantName,
        orderId,
        totalAmount,
      });
    }

    return { ordersToInsert, createdOrders };
  }
}
