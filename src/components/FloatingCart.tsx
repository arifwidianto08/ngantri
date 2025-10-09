"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, Cart } from "../lib/cart";
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
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Link
          href="/cart"
          className="flex items-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div className="text-left">
            <div className="text-xs font-medium">
              {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}
            </div>
            <div className="text-sm font-bold">
              Rp {cart.totalAmount.toLocaleString("id-ID")}
            </div>
          </div>
        </Link>
      </div>

      {/* Desktop Floating Cart */}
      <div className="hidden md:block fixed bottom-4 right-4 z-50 w-80">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div className="text-left">
                <div className="text-xs font-medium">
                  {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}
                </div>
                <div className="text-sm font-bold">
                  Rp {cart.totalAmount.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
            <div className="max-h-96 overflow-y-auto">
              {/* Items */}
              <div className="divide-y">
                {cart.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-3 flex gap-3">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.menuName}
                        width={48}
                        height={48}
                        className="rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.menuName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.quantity} x Rp{" "}
                        {item.unitPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Rp {item.totalPrice.toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
                {cart.items.length > 3 && (
                  <div className="p-3 text-center text-sm text-gray-500">
                    +{cart.items.length - 3} more item
                    {cart.items.length - 3 !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* View Cart Button */}
              <div className="p-4 border-t bg-gray-50">
                <Link
                  href="/cart"
                  className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  View Cart & Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
