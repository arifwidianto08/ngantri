"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, Cart } from "../lib/cart";

export default function CartWidget() {
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    // Initial load
    const loadCart = () => {
      const currentCart = getCart();
      setCart(currentCart);
    };

    loadCart();

    // Listen for cart updates via custom events
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    // Poll for cart changes (as a fallback)
    const interval = setInterval(loadCart, 1000);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      clearInterval(interval);
    };
  }, []);

  const itemCount = cart?.totalItems || 0;

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
    >
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
      <span>Cart</span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
