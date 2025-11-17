"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UtensilsCrossed, Store, CheckCircle2 } from "lucide-react";
import {
  getOrCreateBuyerSession,
  updateSessionTableNumber,
  setBuyerSession,
} from "../lib/session";
import type { BuyerSession } from "../lib/session";
import { getOrCreateCart, addToCart } from "../lib/cart";
import type { Cart } from "../lib/cart";
import OrderStatus from "../components/order-status";
import CartWidget from "../components/cart-widget";
import FloatingCart from "../components/floating-cart";
import Loader from "../components/loader";
import SetupDialog from "../components/setup-dialog";

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
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Initialize session and cart on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get or create buyer session
        const buyerSession = await getOrCreateBuyerSession();
        if (buyerSession) {
          setSession(buyerSession);

          // Show setup dialog if table number not set
          if (!buyerSession.tableNumber) {
            setShowSetupDialog(true);
          }

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
        setMenuLoading(false);
        return;
      }

      setMenuLoading(true);
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
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenuItems();
  }, [selectedMerchant]);

  const handleSetupComplete = async (data: {
    tableNumber: string;
    customerName: string;
    whatsappNumber: string;
  }) => {
    if (!session) return;

    try {
      const success = await updateSessionTableNumber(
        Number.parseInt(data.tableNumber)
      );
      if (success) {
        setSession({
          ...session,
          tableNumber: Number.parseInt(data.tableNumber),
        });
        setCustomerName(data.customerName);
        setCustomerPhone(data.whatsappNumber);
        setShowSetupDialog(false);

        // Store customer info in localStorage
        localStorage.setItem("ngantri_customer_name", data.customerName);
        localStorage.setItem("ngantri_customer_phone", data.whatsappNumber);
      }
    } catch (error) {
      console.error("Error during setup:", error);
    }
  };

  const handleAddToCart = async (menuItem: MenuItem) => {
    if (!session || !cart) {
      return;
    }

    // Check if setup is complete
    if (!session.tableNumber) {
      setShowSetupDialog(true);
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
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  if (loading) {
    return <Loader message="Setting up your session..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Setup Dialog */}
      <SetupDialog open={showSetupDialog} onComplete={handleSetupComplete} />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
                <span>ngantri</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                Food Court Ordering
              </p>
            </div>
            <div className="hidden md:block">
              <CartWidget />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-24 md:pb-6">
        {/* Session & Table Info Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl shadow-lg p-6 sm:p-8 mb-6">
          {/* Session Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Table Number Card */}
            {session?.tableNumber && (
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 h-32 flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                <p className="text-sm font-semibold text-blue-100 mb-1">
                  Table
                </p>
                <p className="text-5xl font-black text-white">
                  {session.tableNumber}
                </p>
              </div>
            )}

            {/* Customer Name Card */}
            {customerName && (
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 h-32 flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                <p className="text-sm font-semibold text-purple-100 mb-1">
                  Customer
                </p>
                <p className="text-2xl font-black text-white truncate">
                  {customerName}
                </p>
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
                  <p className="text-sm font-semibold text-green-100">items</p>
                </div>
                <p className="text-lg font-bold text-white mt-1">
                  Rp {cart.totalAmount.toLocaleString("id-ID")}
                </p>
              </div>
            )}
          </div>

          {/* Edit Info Button */}
          {session?.tableNumber && (
            <div className="mt-6 flex justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => setShowSetupDialog(true)}
                className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
              >
                Update Information
              </button>
            </div>
          )}
        </div>

        {/* Merchants List */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 px-1 flex items-center gap-2">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span>Select Merchant</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {merchants.map((merchant) => (
              <button
                type="button"
                key={merchant.id}
                onClick={() => setSelectedMerchant(merchant)}
                className={`group relative p-4 sm:p-5 rounded-xl border-2 transition-all text-left shadow-md hover:shadow-lg ${
                  selectedMerchant?.id === merchant.id
                    ? "border-blue-600 bg-blue-100 shadow-lg scale-[1.02]"
                    : "border-gray-300 bg-white hover:border-blue-400 active:scale-[0.98]"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      {merchant.name}
                    </h3>
                  </div>
                  {selectedMerchant?.id === merchant.id && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <title>Selected</title>
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {merchant.description && (
                  <p className="text-xs sm:text-sm text-gray-700 font-medium mb-3 line-clamp-2">
                    {merchant.description}
                  </p>
                )}
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border-2 ${
                      merchant.isAvailable
                        ? "bg-green-200 text-green-900 border-green-400"
                        : "bg-red-200 text-red-900 border-red-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        merchant.isAvailable
                          ? "bg-green-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    />
                    {merchant.isAvailable ? "Open Now" : "Closed"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        {selectedMerchant && (
          <div className="">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7" />
                <span>Menu - {selectedMerchant.name}</span>
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Choose your favorite dishes
              </p>
            </div>

            {menuLoading ? (
              <Loader message="Loading menu items..." />
            ) : menuItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="mb-4 flex justify-center">
                  <UtensilsCrossed
                    className="w-24 h-24 sm:w-32 sm:h-32 text-gray-300"
                    strokeWidth={1}
                  />
                </div>
                <p className="text-gray-500 text-lg">
                  No menu items available for this merchant.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 text-base sm:text-lg line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2 min-h-[2.5rem]">
                          {item.description}
                        </p>
                      )}

                      {/* Price & Add Button */}
                      <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900">
                            Rp {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.isAvailable}
                          className={`px-4 py-2.5 rounded-lg font-bold transition-all shadow-md hover:shadow-lg text-sm ${
                            item.isAvailable
                              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {item.isAvailable ? "+ Add" : "Unavailable"}
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

      {/* Floating Cart */}
      <FloatingCart />

      {/* Order Status Tracking */}
      {activeOrderId && (
        <OrderStatus
          orderId={activeOrderId}
          onClose={() => setActiveOrderId(null)}
        />
      )}
    </div>
  );
}
