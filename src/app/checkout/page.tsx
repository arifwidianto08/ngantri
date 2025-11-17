"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateCart, clearCart } from "../../lib/cart";
import type { Cart } from "../../lib/cart";
import { getBuyerSession } from "../../lib/session";
import type { BuyerSession } from "../../lib/session";
import Image from "next/image";
import Loader from "@/components/loader";
import { CheckCircle } from "lucide-react";

interface ValidationErrors {
  name?: string;
  whatsapp?: string;
}

interface CartItem {
  id: string;
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  merchantId: string;
  merchantName: string;
}

interface MerchantGroup {
  merchantName: string;
  items: CartItem[];
  total: number;
}

interface OrdersByMerchant {
  merchantName: string;
  items: CartItem[];
}

interface OrderResult {
  success: boolean;
  merchantName: string;
  orderId?: string;
  error?: unknown;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  useEffect(() => {
    const initializeCheckout = () => {
      try {
        const currentCart = getOrCreateCart();
        const currentSession = getBuyerSession();

        if (!currentCart || currentCart.items.length === 0) {
          router.push("/cart");
          return;
        }

        if (!currentSession) {
          router.push("/");
          return;
        }

        if (!currentSession.tableNumber) {
          alert("Please set your table number first");
          router.push("/");
          return;
        }

        setCart(currentCart);
        setSession(currentSession);

        // Load cached customer info from localStorage
        const cachedName = localStorage.getItem("customerName");
        const cachedWhatsapp = localStorage.getItem("customerWhatsapp");

        if (cachedName) {
          setCustomerName(cachedName);
        }

        if (cachedWhatsapp) {
          setWhatsappNumber(cachedWhatsapp);
        }
      } catch (error) {
        console.error("Error initializing checkout:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [router]);

  // Group items by merchant with totals
  const merchantGroups =
    cart?.items.reduce((acc, item) => {
      if (!acc[item.merchantId]) {
        acc[item.merchantId] = {
          merchantName: item.merchantName,
          items: [],
          total: 0,
        };
      }
      acc[item.merchantId].items.push(item);
      acc[item.merchantId].total += item.quantity * item.unitPrice;
      return acc;
    }, {} as Record<string, MerchantGroup>) || {};

  const grandTotal = Object.values(merchantGroups).reduce(
    (sum, group) => sum + group.total,
    0
  );

  const validateInputs = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate name
    if (!customerName.trim()) {
      newErrors.name = "Username tidak boleh kosong";
    } else if (customerName.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Validate WhatsApp number
    if (!whatsappNumber.trim()) {
      newErrors.whatsapp = "Nomor WhatsApp belum diisi";
    } else {
      // Remove non-digit characters
      const cleaned = whatsappNumber.replace(/\D/g, "");
      if (cleaned.length < 10) {
        newErrors.whatsapp = "WhatsApp number must be at least 10 digits";
      } else if (cleaned.length > 15) {
        newErrors.whatsapp = "WhatsApp number is too long";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrdersForMerchants = async (
    cleanedWhatsapp: string,
    ordersByMerchant: Record<string, OrdersByMerchant>
  ): Promise<OrderResult[]> => {
    const orderPromises = Object.entries(ordersByMerchant).map(
      async ([merchantId, { merchantName, items }]) => {
        if (!session) {
          return { success: false, merchantName, error: "No session" };
        }

        const orderData = {
          sessionId: session.id,
          merchantId: merchantId,
          customerName: customerName.trim(),
          customerPhone: cleanedWhatsapp,
          items: items.map((item) => ({
            menuId: item.menuId,
            menuName: item.menuName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            menuImageUrl: item.imageUrl,
          })),
          notes: `Table ${session.tableNumber}`,
        };

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        const result = await response.json();

        if (result.success) {
          return {
            success: true,
            merchantName,
            orderId: result.data.order.id,
          };
        }
        return { success: false, merchantName, error: result.error };
      }
    );

    return await Promise.all(orderPromises);
  };

  const handlePlaceOrder = async () => {
    if (!validateInputs()) {
      return;
    }

    if (!session || !cart || cart.items.length === 0) {
      alert("No items in cart");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Save customer info to localStorage for future use
      localStorage.setItem("customerName", customerName.trim());
      localStorage.setItem("customerWhatsapp", whatsappNumber.trim());

      // Clean WhatsApp number (remove non-digits)
      const cleanedWhatsapp = whatsappNumber.replace(/\D/g, "");

      // Group items by merchant
      const ordersByMerchant = cart.items.reduce((acc, item) => {
        if (!acc[item.merchantId]) {
          acc[item.merchantId] = {
            merchantName: item.merchantName,
            items: [],
          };
        }
        acc[item.merchantId].items.push(item);
        return acc;
      }, {} as Record<string, OrdersByMerchant>);

      // Create orders for each merchant
      const results = await createOrdersForMerchants(
        cleanedWhatsapp,
        ordersByMerchant
      );

      // Check if all orders succeeded
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        // Some orders failed
        const failedMerchants = failed.map((r) => r.merchantName).join(", ");
        alert(
          `Some orders failed for: ${failedMerchants}\n\nPlease try again or contact support.`
        );
        return;
      }

      clearCart();
      window.dispatchEvent(new Event("cart-updated"));

      // Show success dialog
      setShowSuccessDialog(true);

      // Countdown and redirect
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          router.push("/orders?view=pending");
        }
      }, 1000);
    } catch (error) {
      console.error("Error placing orders:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to place orders";
      alert(`${errorMessage}. Please try again.`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return <Loader message="Loading checkout..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Placed Successfully! 🎉
              </h2>
              <p className="text-gray-600">
                Your order has been confirmed and sent to the merchant.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next Step:</strong> Please pay at the merchant counter
                when your order is ready.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to your orders in{" "}
              <span className="font-bold text-blue-600">{countdown}</span>{" "}
              seconds...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💳 Checkout</h1>
              <p className="text-sm text-gray-600">
                Complete your order details
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Cart
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Info */}
            {session && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Session Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Session ID</p>
                    <p className="text-xs font-mono text-gray-800">
                      {session.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Table Number</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {session.tableNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Information Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter your name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* WhatsApp Input */}
                <div>
                  <label
                    htmlFor="whatsappNumber"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">
                      +62
                    </span>
                    <input
                      type="tel"
                      id="whatsappNumber"
                      value={whatsappNumber}
                      onChange={(e) => {
                        setWhatsappNumber(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          whatsapp: undefined,
                        }));
                      }}
                      placeholder="812-3456-7890"
                      className={`w-full pl-14 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.whatsapp ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.whatsapp && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.whatsapp}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    We&apos;ll send order updates via WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items by Merchant */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-4">
                {Object.entries(merchantGroups).map(
                  ([merchantId, { merchantName, items, total }]) => (
                    <div
                      key={merchantId}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {merchantName}
                          </h3>
                          <p className="text-sm font-semibold text-gray-900">
                            Rp {total.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3"
                          >
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
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.menuName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.quantity} x Rp{" "}
                                {item.unitPrice.toLocaleString("id-ID")}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              Rp{" "}
                              {(item.quantity * item.unitPrice).toLocaleString(
                                "id-ID"
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Total & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Summary
              </h2>

              {/* Items Breakdown */}
              <div className="space-y-3 mb-4 pb-4 border-b">
                {Object.entries(merchantGroups).map(
                  ([merchantId, { merchantName, total }]) => (
                    <div
                      key={merchantId}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600">{merchantName}</span>
                      <span className="font-medium text-gray-900">
                        Rp {total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Payment Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  💳 <strong>Payment:</strong> You will be redirected to secure
                  payment page.
                </p>
              </div>

              {/* Place Order Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isPlacingOrder ? "Processing..." : "Continue to Payment"}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing this order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
