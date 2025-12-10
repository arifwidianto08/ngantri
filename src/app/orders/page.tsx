"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/loader";
import { Package, Loader2, PartyPopper, CheckCircle2 } from "lucide-react";
import { getOrCreateBuyerSession } from "@/lib/session";

interface OrderItem {
  id: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  menuImageUrl?: string;
}

interface Order {
  id: string;
  merchantId: string;
  merchantName?: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "pending";

  const {
    data: orders = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["orders", currentView],
    queryFn: async () => {
      const buyerSession = await getOrCreateBuyerSession();

      if (!buyerSession) {
        return [];
      }

      const params = new URLSearchParams({
        session_id: buyerSession.id,
      });

      // Filter by view: active or history
      // Active orders: pending, accepted, preparing, ready
      // History: completed, failed, cancelled
      if (currentView === "pending") {
        params.append("status", "pending,accepted,preparing,ready");
      } else if (currentView === "history") {
        params.append("status", "completed,failed,cancelled");
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        return [];
      }

      return result.data;
    },
    refetchInterval: 5000, // Short-polling: Poll every 5 seconds (UC 3.2.8)
    staleTime: 3000,
  });

  const lastUpdate = new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loader message="Loading your orders..." />
      </div>
    );
  }

  const allCompleted = orders.every(
    (order: Order) => order.status === "completed"
  );
  const anyReady = orders.some((order: Order) => order.status === "ready");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                <span>Order Status</span>
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                <span>Track in real-time</span>
                {isFetching && (
                  <span className="inline-flex items-center gap-1 text-blue-600">
                    <Loader2 className="animate-spin h-3 w-3" />
                    <span className="hidden sm:inline">Updating...</span>
                  </span>
                )}
                {!isFetching && (
                  <span className="text-xs text-gray-400">
                    {lastUpdate.toLocaleTimeString("id-ID")}
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* View Tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => {
              router.push("/orders?view=pending");
            }}
            className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm sm:text-base ${
              currentView === "pending"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
            }`}
          >
            Ongoing
          </button>
          <button
            type="button"
            onClick={() => {
              router.push("/orders?view=history");
            }}
            className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm sm:text-base ${
              currentView === "history"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
            }`}
          >
            History
          </button>
        </div>

        {/* Success Message - Only show for pending orders */}
        {currentView === "pending" && orders.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-2">
                  Order Placed Successfully!
                </h2>
                <p className="text-sm sm:text-base text-gray-900 mb-3">
                  Your order{orders.length > 1 ? "s have" : " has"} been sent to
                  the merchant{orders.length > 1 ? "s" : ""}. Please wait for
                  confirmation.
                </p>
                <div className="flex flex-wrap gap-2">
                  {orders.map((order: Order) => (
                    <span
                      key={order.id}
                      className="inline-block px-3 py-1.5 bg-white border-2 border-green-300 rounded-full text-xs sm:text-sm font-mono text-green-900 shadow-sm"
                    >
                      #{order.id.slice(0, 12)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {currentView === "pending" && anyReady && !allCompleted && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 mb-4 sm:mb-6">
            <p className="text-green-900 font-bold text-sm sm:text-base flex items-center gap-2">
              <PartyPopper className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
              <span>Some of your orders are ready for pickup!</span>
            </p>
          </div>
        )}

        {allCompleted && (
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl p-4 mb-4 sm:mb-6">
            <p className="text-gray-900 font-bold text-sm sm:text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              <span>All orders completed! Thank you for your order.</span>
            </p>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3 sm:space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 sm:p-16 flex flex-col items-center text-center">
              <div className="mb-4">
                <Package
                  className="w-20 h-20 sm:w-24 sm:h-24 text-gray-300"
                  strokeWidth={1}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                No orders found
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {currentView === "pending"
                  ? "You don't have any active orders"
                  : "You don't have any order history"}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all"
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
            orders.map((order: Order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 border-gray-200 hover:border-blue-300 active:scale-[0.99]"
              >
                {/* Order Card */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                        {order.merchantName || "Merchant"}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-mono">
                        #{order.id.slice(0, 12)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${
                          STATUS_COLORS[
                            order.status as keyof typeof STATUS_COLORS
                          ]
                        }`}
                      >
                        {
                          STATUS_LABELS[
                            order.status as keyof typeof STATUS_LABELS
                          ]
                        }
                      </span>
                      {order.paymentStatus && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            order.paymentStatus === "paid"
                              ? "bg-green-50 text-gray-800 border-green-200"
                              : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}
                        >
                          {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
                    <div className="text-xs sm:text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-gray-900">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Actions */}
        {orders.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <span>Order More</span>
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
        )}
      </div>
    </div>
  );
}
