"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
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
  paymentStatus: string;
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminPaymentPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth");
      if (response.ok) {
        setAuthenticated(true);
        fetchOrders();
      } else if (response.status === 401) {
        // Trigger browser basic auth dialog
        const authResponse = await fetch("/api/admin/orders", {
          headers: {
            Authorization: `Basic ${btoa(
              `${prompt("Username:")}:${prompt("Password:")}`
            )}`,
          },
        });

        if (authResponse.ok) {
          setAuthenticated(true);
          fetchOrders();
        } else {
          alert("Invalid credentials");
          router.push("/");
        }
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      const result = await response.json();

      console.log("Result Admin ", result);

      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (orderId: string) => {
    if (!confirm("Mark this order as PAID?")) {
      return;
    }

    setProcessingOrderId(orderId);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (result.success) {
        // Refetch orders to get updated payment status from join
        fetchOrders();
        alert("Order marked as paid and completed!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Failed to mark order as paid");
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const unpaidOrders = orders.filter(
    (order) => order.paymentStatus === "pending"
  );
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🔐 Admin - Payment Management
          </h1>
          <p className="text-sm text-gray-600">Mark orders as paid</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Unpaid Orders */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Unpaid Orders ({unpaidOrders.length})
          </h2>
          {unpaidOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              No unpaid orders
            </div>
          ) : (
            <div className="space-y-4">
              {unpaidOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {order.merchantName || "Unknown Merchant"}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            STATUS_COLORS[
                              order.status as keyof typeof STATUS_COLORS
                            ]
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-mono mb-1">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-700">
                        Customer: {order.customerName} ({order.customerPhone})
                      </p>
                      {order.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Note: {order.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </p>
                      <button
                        type="button"
                        onClick={() => markAsPaid(order.id)}
                        disabled={processingOrderId === order.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        {processingOrderId === order.id
                          ? "Processing..."
                          : "Mark as Paid"}
                      </button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-gray-500 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.quantity}x {item.menuName}
                          </span>
                          <span className="text-gray-900 font-medium">
                            Rp{" "}
                            {(item.quantity * item.unitPrice).toLocaleString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-gray-500">
                      Created:{" "}
                      {new Date(order.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paid Orders */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Paid Orders ({paidOrders.length})
          </h2>
          {paidOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              No paid orders
            </div>
          ) : (
            <div className="space-y-4">
              {paidOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50 rounded-lg p-4 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {order.merchantName || "Unknown Merchant"}
                        </h3>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                          ✓ PAID
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-mono">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-700">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
