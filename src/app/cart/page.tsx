"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import {
  getOrCreateCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "../../lib/cart";
import type { Cart } from "../../lib/cart";
import { getBuyerSession } from "../../lib/session";
import type { BuyerSession } from "../../lib/session";
import Image from "next/image";
import Loader from "@/components/loader";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClearCartConfirmOpen, setClearCartConfirmOpen] = useState(false);
  const router = useRouter();
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingUpdatesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const initializeCart = () => {
      try {
        const buyerSession = getBuyerSession();
        if (!buyerSession) {
          router.push("/");
          return;
        }

        setSession(buyerSession);
        const buyerCart = getOrCreateCart();
        setCart(buyerCart);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing cart:", error);
        setLoading(false);
      }
    };

    initializeCart();
  }, [router]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      // Store the pending quantity
      pendingUpdatesRef.current[itemId] = newQuantity;

      // Clear existing timer for this item
      if (debounceTimersRef.current[itemId]) {
        clearTimeout(debounceTimersRef.current[itemId]);
      }

      // Update UI immediately with the new quantity
      setCart((prevCart) => {
        if (!prevCart) return prevCart;

        const updatedItems = prevCart.items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: item.unitPrice * newQuantity,
            };
          }
          return item;
        });

        // Recalculate totals
        const newTotalAmount = updatedItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const newTotalItems = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        return {
          ...prevCart,
          items: updatedItems,
          totalAmount: newTotalAmount,
          totalItems: newTotalItems,
        };
      });

      // Set new timer with longer delay (1000ms)
      debounceTimersRef.current[itemId] = setTimeout(async () => {
        const latestQuantity = pendingUpdatesRef.current[itemId];
        // Only send to backend if quantity is valid
        if (latestQuantity && latestQuantity > 0) {
          const updatedCart = await updateCartItemQuantity(
            itemId,
            latestQuantity
          );
          if (updatedCart) {
            // Merge backend response and recalculate totals
            setCart((prevCart) => {
              if (!prevCart) return updatedCart;

              const mergedItems = prevCart.items.map((item) => {
                const updatedItem = updatedCart.items.find(
                  (i) => i.id === item.id
                );
                return updatedItem ? updatedItem : item;
              });

              // Recalculate totals after merge
              const newTotalAmount = mergedItems.reduce(
                (sum, item) => sum + item.totalPrice,
                0
              );
              const newTotalItems = mergedItems.reduce(
                (sum, item) => sum + item.quantity,
                0
              );

              return {
                ...prevCart,
                items: mergedItems,
                totalAmount: newTotalAmount,
                totalItems: newTotalItems,
              };
            });
          }
        }
        delete debounceTimersRef.current[itemId];
        delete pendingUpdatesRef.current[itemId];
      }, 500);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      // Clear any pending quantity updates for this item
      if (debounceTimersRef.current[itemId]) {
        clearTimeout(debounceTimersRef.current[itemId]);
      }
      delete pendingUpdatesRef.current[itemId];

      // Optimistic update - remove from UI immediately
      setCart((prevCart) => {
        if (!prevCart) return prevCart;

        const updatedItems = prevCart.items.filter(
          (item) => item.id !== itemId
        );

        // Recalculate totals
        const newTotalAmount = updatedItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const newTotalItems = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        return {
          ...prevCart,
          items: updatedItems,
          totalAmount: newTotalAmount,
          totalItems: newTotalItems,
        };
      });

      // Then update the backend
      const updatedCart = await removeFromCart(itemId);
      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
      // Refetch cart on error to sync state
      const refreshedCart = getOrCreateCart();
      setCart(refreshedCart);
    }
  };

  const handleClearCart = () => {
    setClearCartConfirmOpen(true);
  };

  const confirmClearCart = () => {
    clearCart();
    setCart(getOrCreateCart());
    setClearCartConfirmOpen(false);
  };

  // Group items by merchant for better display
  const itemsByMerchant =
    cart?.items.reduce((acc, item) => {
      // Use merchantId if available, fallback to merchantName for legacy cart data
      const merchantKey = item.merchantId || item.merchantName;
      if (!acc[merchantKey]) {
        acc[merchantKey] = {
          merchantName: item.merchantName,
          items: [],
        };
      }
      acc[merchantKey].items.push(item);
      return acc;
    }, {} as Record<string, { merchantName: string; items: typeof cart.items }>) ||
    {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader message="Loading cart..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmDialog
        open={isClearCartConfirmOpen}
        onOpenChange={setClearCartConfirmOpen}
        title="Clear Cart"
        description="Are you sure you want to clear your entire cart? This action cannot be undone."
        onConfirm={confirmClearCart}
        variant="danger"
        confirmText="Clear Cart"
      />
      {/* Sticky Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-gray-900 hover:text-gray-800 font-semibold flex items-center gap-1 text-sm sm:text-base"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Back</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Your Cart
                </h1>
                {cart && cart.items.length > 0 && (
                  <p className="text-xs sm:text-sm text-gray-600">
                    {cart.totalItems} items
                  </p>
                )}
              </div>
            </div>
            {cart && cart.items.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                data-testid="clear-cart-btn"
                className="text-gray-900 hover:text-gray-900 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:py-6">
        {!cart || cart.items.length === 0 ? (
          <div
            className="bg-white rounded-2xl shadow-sm p-12 sm:p-16 text-center"
            data-testid="empty-cart-message"
          >
            <div className="mb-6 flex justify-center">
              <ShoppingCart
                className="w-24 h-24 sm:w-32 sm:h-32 text-gray-300"
                strokeWidth={1}
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 text-sm sm:text-base">
              Add some delicious items from our merchants!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <span>Browse Menu</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Arrow</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Cart Items Card */}
            <Card className="shadow-md border border-gray-200">
              {/* Table Header - Hidden on Mobile */}
              <div className="hidden sm:block px-4 sm:px-6 py-4 border-b bg-white">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6 font-bold text-gray-900 text-sm">
                    Product
                  </div>
                  <div className="col-span-3 font-bold text-gray-900 text-center text-sm">
                    Quantity
                  </div>
                  <div className="col-span-3 font-bold text-gray-900 text-right text-sm">
                    Price
                  </div>
                </div>
              </div>

              {/* Cart Items by Merchant */}
              <div className="divide-y">
                {Object.entries(itemsByMerchant).map(
                  ([merchantId, { merchantName, items }]) => (
                    <div key={merchantId}>
                      {/* Merchant Section Header */}
                      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b">
                        <p className="text-sm font-semibold text-gray-700">
                          {merchantName}
                        </p>
                      </div>

                      {/* Items for this merchant */}
                      <div className="divide-y">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            data-testid="cart-item"
                            className="px-4 sm:px-6 py-4"
                          >
                            <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
                              {/* Desktop Layout */}
                              <div className="col-span-6">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    data-testid="remove-item-btn"
                                    className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>

                                  {item.imageUrl && (
                                    <div className="flex-shrink-0">
                                      <Image
                                        src={item.imageUrl}
                                        alt={item.menuName}
                                        width={60}
                                        height={60}
                                        className="rounded-lg object-cover w-14 h-14"
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                      {item.menuName}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Rp{" "}
                                      {item?.unitPrice?.toLocaleString("id-ID")}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="col-span-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
                                    disabled={item.quantity <= 1}
                                  >
                                    −
                                  </button>
                                  <span
                                    className="w-8 text-center font-semibold text-gray-900 text-sm"
                                    data-testid="item-quantity-input"
                                  >
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div className="col-span-3 text-right">
                                <p
                                  className="font-semibold text-gray-900 text-sm"
                                  data-testid="item-total"
                                >
                                  Rp {item?.totalPrice?.toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>

                            {/* Mobile Layout */}
                            <div className="sm:hidden space-y-2">
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  data-testid="remove-item-btn"
                                  className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>

                                {item.imageUrl && (
                                  <div className="flex-shrink-0">
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.menuName}
                                      width={60}
                                      height={60}
                                      className="rounded-lg object-cover w-14 h-14"
                                    />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">
                                    {item.menuName}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Rp{" "}
                                    {item?.unitPrice?.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-3 w-full">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors text-sm"
                                    disabled={item.quantity <= 1}
                                  >
                                    −
                                  </button>
                                  <span
                                    className="px-3 font-semibold text-gray-900"
                                    data-testid="item-quantity-input"
                                  >
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors text-sm"
                                  >
                                    +
                                  </button>
                                </div>
                                <p
                                  className="font-bold text-gray-900 text-lg ml-auto"
                                  data-testid="item-total"
                                >
                                  Rp {item?.totalPrice?.toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* Order Summary Card */}
            <Card className="shadow-md border border-gray-200">
              <div className="px-4 sm:px-6 py-6">
                {/* Summary Rows */}
                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      Rp {cart?.totalAmount?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping Cost</span>
                    <span className="font-semibold text-gray-900">Rp 0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-semibold text-gray-900">Rp 0</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6 pb-6 border-b">
                  <span className="font-bold text-gray-900">Total Payable</span>
                  <span className="font-bold text-gray-900">
                    Rp {cart?.totalAmount?.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Checkout Button */}
                <Link
                  href={session?.tableNumber ? "/checkout" : "/"}
                  data-testid="checkout-btn"
                  className="block w-full mb-4"
                  onClick={(e) => {
                    if (!session?.tableNumber) {
                      e.preventDefault();
                      router.push("/");
                    }
                  }}
                >
                  <Button
                    type="button"
                    className={`w-full py-3 sm:py-4 text-base font-bold rounded-lg transition-all ${
                      session?.tableNumber
                        ? "bg-gray-900 hover:bg-gray-800 text-white"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    {session?.tableNumber
                      ? "Checkout Now"
                      : "Set Table Number First"}
                  </Button>
                </Link>

                <p className="text-xs text-gray-500 text-center">
                  You will pay in person at the merchant counter
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
