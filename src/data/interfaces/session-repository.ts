import {
  BuyerSession,
  NewBuyerSession,
  CartItem,
  NewCartItem,
} from "../schema";

export interface SessionRepository {
  // Buyer Session operations
  createSession(session: NewBuyerSession): Promise<BuyerSession>;
  findSessionById(id: string): Promise<BuyerSession | null>;
  updateSession(
    id: string,
    updates: Partial<Omit<BuyerSession, "id" | "createdAt">>
  ): Promise<BuyerSession | null>;
  softDeleteSession(id: string): Promise<boolean>;

  // Cart operations
  addCartItem(cartItem: NewCartItem): Promise<CartItem>;
  findCartItems(
    sessionId: string,
    options?: {
      merchantId?: string;
      cursor?: string;
      limit?: number;
    }
  ): Promise<{
    data: CartItem[];
    nextCursor?: string;
    hasMore: boolean;
  }>;
  findCartItemById(id: string): Promise<CartItem | null>;
  updateCartItem(
    id: string,
    updates: Partial<Omit<CartItem, "id" | "sessionId" | "createdAt">>
  ): Promise<CartItem | null>;
  removeCartItem(id: string): Promise<boolean>;
  clearCart(sessionId: string, merchantId?: string): Promise<boolean>;

  // Cart analytics
  getCartTotal(sessionId: string, merchantId?: string): Promise<number>;
  getCartItemCount(sessionId: string, merchantId?: string): Promise<number>;
  getCartByMerchant(sessionId: string): Promise<
    Record<
      string,
      {
        merchantId: string;
        items: CartItem[];
        total: number;
        itemCount: number;
      }
    >
  >;

  // Utility operations
  sessionExists(id: string): Promise<boolean>;
  cleanupExpiredSessions(olderThanHours: number): Promise<number>;
}
