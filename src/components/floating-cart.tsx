"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, type Cart } from "../lib/cart";
import Image from "next/image";

interface FloatingCartProps {
  show?: boolean;
}

export default function FloatingCart({ show = true }: FloatingCartProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Initial load
    const loadCart = () => {
      const currentCart = getCart();
      setCart(currentCart);
    };

    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

  if (!show || !cart || cart.items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Floating Button */}
      <div className="fixed bottom-6 right-4 left-4 z-50 md:hidden">
        <Link
          href="/cart"
          className="flex items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Cart</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                {cart.totalItems}
              </span>
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold opacity-90">
                {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}
              </div>
              <div className="text-sm font-bold">
                Rp {cart.totalAmount.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Arrow</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Desktop Floating Cart */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50 w-96">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Cart</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold opacity-90">
                  {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}
                </div>
                <div className="text-sm font-bold">
                  Rp {cart.totalAmount.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Toggle</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="max-h-[500px] overflow-y-auto">
              {/* Items */}
              <div className="divide-y">
                {cart.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex gap-3 hover:bg-gray-50 transition-colors"
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.menuName}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {item.menuName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} × Rp{" "}
                        {item.unitPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      Rp {item.totalPrice.toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
                {cart.items.length > 3 && (
                  <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 font-semibold">
                    +{cart.items.length - 3} more item
                    {cart.items.length - 3 !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* View Cart Button */}
              <div className="p-4 border-t-2 bg-gray-50">
                <Link
                  href="/cart"
                  className="block w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  View Cart & Checkout →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
