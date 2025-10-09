"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getOrCreateCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  Cart,
} from "../../lib/cart";
import { getBuyerSession, BuyerSession } from "../../lib/session";
import Image from "next/image";

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
      alert("Failed to update quantity");
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
      alert("Failed to remove item");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Menu
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
            </div>
            {cart && cart.items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Session Info */}
        {session && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Session ID: <span className="font-mono">{session.id}</span>
                </p>
                {session.tableNumber ? (
                  <p className="text-sm text-gray-900 font-semibold mt-1">
                    Table Number: {session.tableNumber}
                  </p>
                ) : (
                  <p className="text-sm text-orange-600 font-semibold mt-1">
                    ⚠️ No table number set
                  </p>
                )}
              </div>
              {!session.tableNumber && (
                <Link
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Set Table Number →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Empty Cart */}
        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some delicious items from our merchants!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items by Merchant */}
            <div className="space-y-6 mb-6">
              {Object.entries(itemsByMerchant).map(
                ([merchantId, { merchantName, items }]) => (
                  <div
                    key={merchantId}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Merchant Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b">
                      <h3 className="font-semibold text-gray-900">
                        {merchantName}
                      </h3>
                    </div>

                    {/* Items */}
                    <div className="divide-y">
                      {items.map((item) => (
                        <div key={item.id} className="p-6">
                          <div className="flex gap-4">
                            {/* Item Image */}
                            {item.imageUrl && (
                              <div className="flex-shrink-0">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.menuName}
                                  width={80}
                                  height={80}
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            )}

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {item.menuName}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Rp {item.unitPrice.toLocaleString("id-ID")}{" "}
                                each
                              </p>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 font-medium"
                                    disabled={item.quantity <= 1}
                                  >
                                    −
                                  </button>
                                  <span className="w-12 text-center font-medium">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 font-medium"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-lg">
                                Rp {item.totalPrice.toLocaleString("id-ID")}
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

            {/* Cart Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky bottom-0">
              <div className="space-y-4">
                {/* Total Items */}
                <div className="flex justify-between text-gray-600">
                  <span>Total Items:</span>
                  <span className="font-medium">{cart.totalItems}</span>
                </div>

                {/* Total Amount */}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t">
                  <span>Total:</span>
                  <span>Rp {cart.totalAmount.toLocaleString("id-ID")}</span>
                </div>

                {/* Warning if no table number */}
                {!session?.tableNumber && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800">
                      ⚠️ Please set your table number on the homepage before
                      checkout
                    </p>
                  </div>
                )}

                {/* Proceed to Checkout Button */}
                <Link
                  href={session?.tableNumber ? "/checkout" : "/"}
                  className={`block w-full py-4 text-center rounded-lg font-semibold text-lg transition-colors ${
                    session?.tableNumber
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                  onClick={(e) => {
                    if (!session?.tableNumber) {
                      e.preventDefault();
                      alert("Please set your table number first");
                    }
                  }}
                >
                  {session?.tableNumber
                    ? "Proceed to Checkout"
                    : "Set Table Number First"}
                </Link>

                <p className="text-xs text-gray-500 text-center">
                  You will pay in person at the merchant counter
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
