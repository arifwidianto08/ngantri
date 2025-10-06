/**
 * Order service interface and implementation
 * Handles business logic for order operations
 */

import { OrderRepository } from "../data/interfaces/OrderRepository";
import { Order, NewOrder, OrderItem, NewOrderItem } from "../data/schema";
import {
  PaginatedResult,
  CursorPaginationParams,
  buildPaginatedResult,
} from "../lib/pagination";
import { AppError, errors } from "../lib/errors";
import { calculateOrderTotal } from "../lib/currency";

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
  findOrderById(id: string): Promise<Order>;
  findOrdersByMerchant(
    merchantId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Order>>;
  findOrdersBySession(
    sessionId: string,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Order>>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  cancelOrder(id: string, reason?: string): Promise<Order>;

  // Order item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Search and analytics
  searchOrders(
    options: OrderSearchOptions,
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Order>>;
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
    const calculation = calculateOrderTotal(
      data.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );

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

      // Create order items
      for (const item of data.items) {
        const orderItemData: NewOrderItem = {
          orderId: order.id,
          menuId: item.menuId,
          menuName: item.menuName,
          menuImageUrl: item.menuImageUrl || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        };

        await this.orderRepository.addOrderItem(orderItemData);
      }

      return order;
    } catch (error) {
      throw errors.internal("Failed to create order", error);
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
  ): Promise<PaginatedResult<Order>> {
    try {
      const result = await this.orderRepository.findByMerchant(merchantId, {
        cursor: params.cursor,
        limit: params.limit,
      });

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
  ): Promise<PaginatedResult<Order>> {
    try {
      const result = await this.orderRepository.findBySession(sessionId, {
        cursor: params.cursor,
        limit: params.limit,
      });

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
      const updatedOrder = await this.orderRepository.updateStatus(id, status);
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
  async cancelOrder(id: string, reason?: string): Promise<Order> {
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
  ): Promise<PaginatedResult<Order>> {
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
      // TODO: Implement proper stats calculation
      // This would require aggregation queries in the repository
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {},
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
    const phoneRegex = /^(\+62|0)[0-9]{8,13}$/;
    const cleanPhone = phoneNumber.replace(/[-\s]/g, "");

    if (!phoneRegex.test(cleanPhone)) {
      throw errors.validation("Invalid Indonesian phone number format");
    }
  }
}
