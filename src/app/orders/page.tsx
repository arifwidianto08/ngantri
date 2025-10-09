"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orderIds = searchParams.get("ids");

        if (!orderIds) {
          setError("No orders found");
          setLoading(false);
          return;
        }

        const ids = orderIds.split(",");
        const orderPromises = ids.map((id) =>
          fetch(`/api/orders/${id}`).then((res) => res.json())
        );

        const results = await Promise.all(orderPromises);

        const fetchedOrders = results
          .filter((result) => result.success)
          .map((result) => result.data.order);

        if (fetchedOrders.length === 0) {
          setError("Failed to load orders");
        } else {
          setOrders(fetchedOrders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Poll for order updates every 10 seconds
    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading orders...</div>
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {error || "No orders found"}
          </h2>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors mt-4"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
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
              <p className="text-sm text-gray-600">
                Track your orders in real-time
              </p>
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
        {/* Success Message */}
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

        {/* Status Banner */}
        {anyReady && !allCompleted && (
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
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">
                    {order.merchantName || "Merchant"}
                  </h3>
                  <span
                    className={`px-4 py-2 rounded-lg border font-semibold ${
                      STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]
                    }`}
                  >
                    {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <span>Order ID: #{order.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>
                    {new Date(order.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold text-gray-900">
                      {order.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp</p>
                    <p className="font-semibold text-gray-900">
                      +{order.customerPhone}
                    </p>
                  </div>
                </div>
                {order.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-gray-900">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="px-6 py-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Order Items
                </h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.menuName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x Rp{" "}
                          {item.unitPrice.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    Rp {order.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="px-6 py-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Order Progress
                </h4>
                <div className="flex items-center justify-between">
                  {[
                    "pending",
                    "accepted",
                    "preparing",
                    "ready",
                    "completed",
                  ].map((status, index) => {
                    const isActive =
                      ["pending", "accepted", "preparing", "ready", "completed"].indexOf(
                        order.status
                      ) >= index;
                    const isCurrent = order.status === status;

                    return (
                      <div key={status} className="flex-1 relative">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              isCurrent
                                ? "bg-blue-600 text-white ring-4 ring-blue-200"
                                : isActive
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isActive ? "✓" : index + 1}
                          </div>
                          <p
                            className={`text-xs mt-2 text-center ${
                              isCurrent
                                ? "font-bold text-blue-600"
                                : isActive
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </p>
                        </div>
                        {index < 4 && (
                          <div
                            className={`absolute top-5 left-1/2 w-full h-0.5 ${
                              isActive ? "bg-green-600" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              {order.status === "ready" && (
                <div className="px-6 py-4 bg-green-50 border-t border-green-200">
                  <p className="text-green-900 font-semibold text-center">
                    🎉 Your order is ready! Please pick it up at the merchant
                    counter.
                  </p>
                </div>
              )}
            </div>
          ))}
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
