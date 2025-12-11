/**
 * Shopping cart management utilities
 * Handles cart items with session tracking
 */

import { getBuyerSession } from "./session";

export interface CartItem {
  id: string;
  menuId: string;
  menuName: string;
  merchantId: string;
  merchantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  imageUrl?: string;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt: string;
}

const CART_STORAGE_KEY = "ngantri_cart";

/**
 * Get cart from local storage
 */
export function getCart(): Cart | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartData) return null;

    const cart = JSON.parse(cartData);

    // Validate that cart belongs to current session
    const session = getBuyerSession();
    if (!session || cart.sessionId !== session.id) {
      clearCart();
      return null;
    }

    return cart;
  } catch (error) {
    console.error("Error parsing cart data:", error);
    clearCart();
    return null;
  }
}

/**
 * Save cart to local storage
 */
export function saveCart(cart: Cart): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Dispatch custom event to notify components of cart update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: cart }));
    }
  } catch (error) {
    console.error("Error saving cart:", error);
  }
}

/**
 * Create empty cart for session
 */
export function createEmptyCart(sessionId: string): Cart {
  return {
    sessionId,
    items: [],
    totalItems: 0,
    totalAmount: 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get or create cart for current session
 */
export function getOrCreateCart(): Cart | null {
  const session = getBuyerSession();
  if (!session) return null;

  const existingCart = getCart();
  if (existingCart) return existingCart;

  const newCart = createEmptyCart(session.id);
  saveCart(newCart);
  return newCart;
}

/**
 * Add item to cart
 */
export async function addToCart(
  menuId: string,
  menuName: string,
  merchantId: string,
  merchantName: string,
  unitPrice: number,
  quantity = 1,
  notes?: string,
  imageUrl?: string
): Promise<Cart | null> {
  const cart = getOrCreateCart();
  if (!cart) return null;

  try {
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.menuId === menuId && item.notes === notes
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice =
        cart.items[existingItemIndex].quantity *
        cart.items[existingItemIndex].unitPrice;
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menuId,
        menuName,
        merchantId,
        merchantName,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        notes,
        imageUrl,
      };
      cart.items.push(newItem);
    }

    // Recalculate totals
    updateCartTotals(cart);
    saveCart(cart);

    // Sync with server
    await syncCartWithServer(cart);

    return cart;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return null;
  }
}

/**
 * Update item quantity in cart
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<Cart | null> {
  const cart = getCart();
  if (!cart) return null;

  try {
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return cart;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].totalPrice =
        quantity * cart.items[itemIndex].unitPrice;
    }

    updateCartTotals(cart);
    saveCart(cart);

    // Sync with server
    await syncCartWithServer(cart);

    return cart;
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<Cart | null> {
  return updateCartItemQuantity(itemId, 0);
}

/**
 * Clear entire cart
 */
export function clearCart(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
  // Dispatch custom event to notify components of cart update
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: null }));
  }
}

/**
 * Update cart totals
 */
function updateCartTotals(cart: Cart): void {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  cart.updatedAt = new Date().toISOString();
}

/**
 * Sync cart with server (save cart items to database)
 */
async function syncCartWithServer(cart: Cart): Promise<void> {
  const session = getBuyerSession();
  if (!session) return;

  try {
    // Add all current cart items to server in bulk - upsert instead of delete/insert
    if (cart.items.length > 0) {
      await fetch(`/api/sessions/${session.id}/cart/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            menu_id: item.menuId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            notes: item.notes,
          })),
        }),
      });
    } else {
      // Only delete if cart is completely empty
      await fetch(`/api/sessions/${session.id}/cart`, {
        method: "DELETE",
      });
    }
  } catch (error) {
    console.error("Error syncing cart with server:", error);
  }
}

/**
 * Load cart from server
 */
export async function loadCartFromServer(): Promise<Cart | null> {
  const session = getBuyerSession();
  if (!session) return null;

  try {
    const response = await fetch(`/api/sessions/${session.id}/cart`);
    if (!response.ok) return null;

    const result = await response.json();
    const serverCartItems = result.data?.cartItems || [];

    if (serverCartItems.length === 0) {
      return getOrCreateCart();
    }

    // Convert server cart items to local cart format
    const cart = createEmptyCart(session.id);

    for (const serverItem of serverCartItems) {
      const cartItem: CartItem = {
        id: serverItem.id,
        menuId: serverItem.menuId,
        menuName: serverItem.menu?.name || "Unknown Item",
        merchantId: serverItem.menu?.merchantId || "",
        merchantName: serverItem.menu?.merchant?.name || "Unknown Merchant",
        quantity: serverItem.quantity,
        unitPrice: serverItem.unitPrice,
        totalPrice: serverItem.quantity * serverItem.unitPrice,
        notes: serverItem.notes,
        imageUrl: serverItem.menu?.imageUrl,
      };
      cart.items.push(cartItem);
    }

    updateCartTotals(cart);
    saveCart(cart);
    return cart;
  } catch (error) {
    console.error("Error loading cart from server:", error);
    return getOrCreateCart();
  }
}

/**
 * Get cart item count for display
 */
export function getCartItemCount(): number {
  const cart = getCart();
  return cart?.totalItems || 0;
}
