import type {
  Order,
  NewOrder,
  OrderItem,
  NewOrderItem,
  OrderPayment,
} from "../schema";

export interface OrderRepository {
  // Order operations
  create(order: NewOrder): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findBySession(
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
  }>;
  findByMerchant(
    merchantId: string,
    options?: {
      cursor?: string;
      limit?: number;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{
    data: Order[];
    nextCursor?: string;
    hasMore: boolean;
  }>;

  // Order status management
  updateStatus(id: string, status: string): Promise<Order | null>;
  updateCustomerInfo(
    id: string,
    customerName?: string,
    customerPhone?: string,
    notes?: string
  ): Promise<Order | null>;

  // Order Items operations
  addOrderItem(orderItem: NewOrderItem): Promise<OrderItem>;
  addOrderItems(orderItems: NewOrderItem[]): Promise<OrderItem[]>;
  findOrderItems(orderId: string): Promise<OrderItem[]>;
  updateOrderItem(
    id: string,
    updates: Partial<Omit<OrderItem, "id" | "orderId" | "createdAt">>
  ): Promise<OrderItem | null>;
  removeOrderItem(id: string): Promise<boolean>;

  // Utility operations
  getTotalAmount(orderId: string): Promise<number>;
  getOrderWithItems(orderId: string): Promise<{
    order: Order;
    items: OrderItem[];
  } | null>;
  findPaymentsByOrderId(orderId: string): Promise<OrderPayment[]>;
  count(
    merchantId?: string,
    options?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<number>;

  // Analytics operations
  getOrderStats(
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
  }>;
}
