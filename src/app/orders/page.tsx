"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/loader";

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
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 border-purple-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS = {
  pending: "⏳ Pending",
  accepted: "✓ Accepted",
  preparing: "🍳 Preparing",
  ready: "✓ Ready for Pickup",
  completed: "✓ Completed",
  cancelled: "✗ Cancelled",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "pending";

  useEffect(() => {
    const fetchOrders = async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      }

      try {
        const sessionId = searchParams.get("session_id");
        const view = searchParams.get("view") || "pending";

        if (!sessionId) {
          setLoading(false);
          return;
        }

        // Build query params
        const params = new URLSearchParams({
          session_id: sessionId,
        });

        // Filter by view: active or history
        if (view === "pending") {
          // Active orders: pending, accepted, preparing, ready
          params.append("status", "pending,accepted,preparing,ready");
        } else if (view === "history") {
          // History: completed, failed, cancelled
          params.append("status", "completed,failed,cancelled");
        }

        // Single API call with filters
        const response = await fetch(`/api/orders?${params.toString()}`);
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
          setOrders([]);
        } else {
          setOrders(result.data);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchOrders();

    // Short-polling: Poll for order updates every 5 seconds (UC 3.2.8)
    const interval = setInterval(() => fetchOrders(true), 5000);

    return () => clearInterval(interval);
  }, [searchParams]);

  if (loading) {
    return <Loader message="Loading your orders..." />;
  }

  const allCompleted = orders.every((order) => order.status === "completed");
  const anyReady = orders.some((order) => order.status === "ready");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📦 Order Status
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Track your orders in real-time</span>
                {refreshing && (
                  <span className="inline-flex items-center gap-1 text-blue-600">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <title>Loading</title>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating...
                  </span>
                )}
                {!refreshing && (
                  <span className="text-xs text-gray-500">
                    Last updated: {lastUpdate.toLocaleTimeString("id-ID")}
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", "pending");
              router.push(`/orders?${params.toString()}`);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === "pending"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border"
            }`}
          >
            Ongoing
          </button>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", "history");
              router.push(`/orders?${params.toString()}`);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === "history"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border"
            }`}
          >
            History
          </button>
        </div>

        {/* Success Message - Only show for pending orders */}
        {currentView === "pending" && orders.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✓</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-green-900 mb-2">
                  Order Placed Successfully!
                </h2>
                <p className="text-green-800 mb-4">
                  Your order{orders.length > 1 ? "s have" : " has"} been sent to
                  the merchant{orders.length > 1 ? "s" : ""}. Please wait for
                  confirmation.
                </p>
                <div className="flex flex-wrap gap-2">
                  {orders.map((order) => (
                    <span
                      key={order.id}
                      className="inline-block px-3 py-1 bg-white border border-green-300 rounded-full text-sm font-mono text-green-900"
                    >
                      #{order.id.slice(0, 8)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {currentView === "pending" && anyReady && !allCompleted && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
            <p className="text-green-900 font-semibold">
              🎉 Some of your orders are ready for pickup!
            </p>
          </div>
        )}

        {allCompleted && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
            <p className="text-gray-900 font-semibold">
              ✓ All orders completed! Thank you for your order.
            </p>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No orders found
              </h2>
              <p className="text-gray-600">
                {currentView === "pending"
                  ? "You don't have any active orders"
                  : "You don't have any order history"}
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Order Card */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {order.merchantName || "Merchant"}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono">
                        #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
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
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString("id-ID")}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Order More
          </Link>
        </div>
      </div>
    </div>
  );
}
