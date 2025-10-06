"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getOrCreateBuyerSession,
  updateSessionTableNumber,
  BuyerSession,
} from "../lib/session";
import { getOrCreateCart, addToCart, Cart } from "../lib/cart";

interface Merchant {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: string;
  merchantId: string;
}

export default function Home() {
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Initialize session and cart on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get or create buyer session
        const buyerSession = await getOrCreateBuyerSession();
        if (buyerSession) {
          setSession(buyerSession);

          // Initialize cart
          const buyerCart = getOrCreateCart();
          setCart(buyerCart);
        }

        // Load merchants
        const response = await fetch("/api/merchants");
        const result = await response.json();
        if (result.success) {
          setMerchants(result.data.merchants);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error initializing app:", error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load menu items when merchant is selected
  useEffect(() => {
    const loadMenuItems = async () => {
      if (!selectedMerchant) {
        setMenuItems([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/merchants/${selectedMerchant.id}/menus`
        );
        const result = await response.json();
        if (result.success) {
          setMenuItems(result.data.menus || []);
        }
      } catch (error) {
        console.error("Error loading menu items:", error);
      }
    };

    loadMenuItems();
  }, [selectedMerchant]);

  const handleTableNumberUpdate = async () => {
    if (!session || !tableNumber || tableNumber.trim() === "") {
      alert("Please enter a valid table number");
      return;
    }

    try {
      const success = await updateSessionTableNumber(parseInt(tableNumber));
      if (success) {
        // Update session in state
        const updatedSession = {
          ...session,
          tableNumber: parseInt(tableNumber),
        };
        setSession(updatedSession);
        alert("Table number updated successfully!");
      } else {
        alert("Failed to update table number");
      }
    } catch (error) {
      console.error("Error updating table number:", error);
      alert("Failed to update table number");
    }
  };

  const handleAddToCart = async (menuItem: MenuItem) => {
    if (!session || !cart) {
      alert("Session not initialized");
      return;
    }

    try {
      const updatedCart = await addToCart(
        menuItem.id,
        menuItem.name,
        menuItem.merchantId,
        selectedMerchant?.name || "Unknown Merchant",
        menuItem.price,
        1,
        undefined,
        menuItem.imageUrl
      );
      setCart(updatedCart);
      alert(`${menuItem.name} added to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ngantri - Food Court Ordering
          </h1>

          {/* Session Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">
              Session ID: <span className="font-mono">{session?.id}</span>
            </p>
            {session?.tableNumber && (
              <p className="text-sm text-gray-600">
                Table Number:{" "}
                <span className="font-semibold">{session.tableNumber}</span>
              </p>
            )}
          </div>

          {/* Table Number Input */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Number
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter your table number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleTableNumberUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Update Table
            </button>
          </div>
        </header>

        {/* Cart Summary */}
        {cart && cart.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cart ({cart.items.length} items)
            </h2>
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div
                  key={item.menuId}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <div>
                    <span className="font-medium">{item.menuName}</span>
                    <span className="text-gray-500 ml-2">×{item.quantity}</span>
                  </div>
                  <span className="font-semibold">
                    Rp {item.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-semibold text-lg">
                <span>Total:</span>
                <span>Rp {cart.totalAmount.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Merchants List */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Choose a Merchant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchants.map((merchant) => (
              <button
                key={merchant.id}
                onClick={() => setSelectedMerchant(merchant)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedMerchant?.id === merchant.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <h3 className="font-semibold text-gray-900">{merchant.name}</h3>
                {merchant.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {merchant.description}
                  </p>
                )}
                <div className="mt-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      merchant.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {merchant.isAvailable ? "Available" : "Closed"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        {selectedMerchant && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Menu - {selectedMerchant.name}
            </h2>

            {menuItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No menu items available for this merchant.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.isAvailable}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            item.isAvailable
                              ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {item.isAvailable ? "Add to Cart" : "Unavailable"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
