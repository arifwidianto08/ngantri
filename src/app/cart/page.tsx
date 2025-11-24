"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
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

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      const updatedCart = await updateCartItemQuantity(itemId, newQuantity);
      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updatedCart = await removeFromCart(itemId);
      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear your entire cart?")) {
      clearCart();
      setCart(getOrCreateCart());
    }
  };

  // Group items by merchant for better display
  const itemsByMerchant =
    cart?.items.reduce((acc, item) => {
      if (!acc[item.merchantId]) {
        acc[item.merchantId] = {
          merchantName: item.merchantName,
          items: [],
        };
      }
      acc[item.merchantId].items.push(item);
      return acc;
    }, {} as Record<string, { merchantName: string; items: typeof cart.items }>) ||
    {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loader message="Loading cart..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 text-sm sm:text-base"
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
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  🛒 Your Cart
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
                className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-32 sm:pb-6">
        {/* Session Info */}
        {session && (
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl shadow-lg p-6 sm:p-8 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Table Number Card */}
              {session.tableNumber ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 h-32 flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                  <p className="text-sm font-semibold text-blue-100 mb-1">
                    Table
                  </p>
                  <p className="text-5xl font-black text-white">
                    {session.tableNumber}
                  </p>
                </div>
              ) : (
                <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-2xl shadow-lg h-32 flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                  <p className="text-sm font-semibold text-orange-100 mb-2">
                    No Table Set
                  </p>
                  <Link
                    href="/"
                    className="text-sm font-bold text-white hover:underline"
                  >
                    Set Table Number →
                  </Link>
                </div>
              )}

              {/* Cart Info Card */}
              {cart && cart.items.length > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 h-32 flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                  <p className="text-sm font-semibold text-green-100 mb-1">
                    Cart
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-white">
                      {cart.totalItems}
                    </p>
                    <p className="text-sm font-semibold text-green-100">
                      items
                    </p>
                  </div>
                  <p className="text-lg font-bold text-white mt-1">
                    Rp {cart.totalAmount.toLocaleString("id-ID")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty Cart */}
        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 sm:p-16 text-center">
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all"
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
          <>
            {/* Cart Items by Merchant */}
            <div className="space-y-4 sm:space-y-6 mb-6 pb-8">
              {Object.entries(itemsByMerchant).map(
                ([merchantId, { merchantName, items }]) => {
                  const merchantTotal = items.reduce(
                    (sum, item) => sum + item.totalPrice,
                    0
                  );

                  return (
                    <div
                      key={merchantId}
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                    >
                      {/* Merchant Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                              {merchantName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-base sm:text-lg">
                                {merchantName}
                              </h3>
                              <p className="text-xs sm:text-sm text-blue-100">
                                {items.length} item
                                {items.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-blue-100">Subtotal</p>
                            <p className="text-base sm:text-lg font-bold text-white">
                              Rp {merchantTotal.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y">
                        {items.map((item) => (
                          <div key={item.id} className="p-4 sm:p-6">
                            <div className="flex gap-3 sm:gap-4">
                              {/* Item Image */}
                              {item.imageUrl && (
                                <div className="flex-shrink-0">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.menuName}
                                    width={80}
                                    height={80}
                                    className="rounded-xl object-cover w-20 h-20 sm:w-24 sm:h-24"
                                  />
                                </div>
                              )}

                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">
                                  {item.menuName}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                                  Rp {item.unitPrice.toLocaleString("id-ID")}{" "}
                                  each
                                </p>

                                {/* Quantity Controls */}
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateQuantity(
                                          item.id,
                                          item.quantity - 1
                                        )
                                      }
                                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-700 font-bold text-lg active:scale-95 transition-all"
                                      disabled={item.quantity <= 1}
                                    >
                                      −
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm sm:text-base">
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
                                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-700 font-bold text-lg active:scale-95 transition-all"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-semibold hover:bg-red-50 px-4 py-2.5 rounded-lg transition-colors active:scale-95"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>

                              {/* Item Total */}
                              <div className="text-right">
                                <p className="font-bold text-gray-900 text-base sm:text-lg">
                                  Rp {item.totalPrice.toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom Bar - Mobile & Desktop */}
      {cart && cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-30">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
            <div className="flex flex-col gap-3">
              {/* Total Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total ({cart.totalItems} items)
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Rp {cart.totalAmount.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <Link
                href={session?.tableNumber ? "/checkout" : "/"}
                className={`w-full py-4 px-6 text-center rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                  session?.tableNumber
                    ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
                onClick={(e) => {
                  if (!session?.tableNumber) {
                    e.preventDefault();
                    router.push("/");
                  }
                }}
              >
                <span>
                  {session?.tableNumber
                    ? "Proceed to Checkout"
                    : "Set Table Number First"}
                </span>
                {session?.tableNumber && <ArrowRight className="w-5 h-5" />}
              </Link>

              <p className="text-xs text-gray-500 text-center">
                You will pay in person at the merchant counter
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
