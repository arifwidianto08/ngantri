"use client";

import { useEffect, useState } from "react";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  sessionId: string;
}

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
  });

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const url =
          filter === "all"
            ? "/api/merchants/dashboard/orders"
            : `/api/merchants/dashboard/orders?status=${filter}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setOrders(result.data.orders);
          if (result.data.statusCounts) {
            setStatusCounts(result.data.statusCounts);
          }
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        // Refetch orders after status update
        const url =
          filter === "all"
            ? "/api/merchants/dashboard/orders"
            : `/api/merchants/dashboard/orders?status=${filter}`;

        const refreshResponse = await fetch(url);
        const refreshResult = await refreshResponse.json();

        if (refreshResult.success) {
          setOrders(refreshResult.data.orders);
          if (refreshResult.data.statusCounts) {
            setStatusCounts(refreshResult.data.statusCounts);
          }
        }

        alert("Order status updated!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage your incoming orders</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetch(
              filter === "all"
                ? "/api/merchants/dashboard/orders"
                : `/api/merchants/dashboard/orders?status=${filter}`
            )
              .then((res) => res.json())
              .then((result) => {
                if (result.success) {
                  setOrders(result.data.orders);
                  if (result.data.statusCounts) {
                    setStatusCounts(result.data.statusCounts);
                  }
                }
              })
              .catch((error) => console.error("Error fetching orders:", error))
              .finally(() => setLoading(false));
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "pending"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            type="button"
            onClick={() => setFilter("accepted")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "accepted"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Accepted ({statusCounts.accepted})
          </button>
          <button
            type="button"
            onClick={() => setFilter("preparing")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "preparing"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Preparing ({statusCounts.preparing})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ready")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "ready"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ready ({statusCounts.ready})
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "completed"
                ? "bg-gray-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed ({statusCounts.completed})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No orders found for this filter
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(order.createdAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Session: {order.sessionId.slice(-8)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : order.status === "accepted"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "preparing"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "ready"
                        ? "bg-green-100 text-green-800"
                        : order.status === "completed"
                        ? "bg-gray-100 text-gray-800"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {order.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "accepted")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Accept Order
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {order.status === "accepted" && (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    Start Preparing
                  </button>
                )}

                {order.status === "preparing" && (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Mark as Ready
                  </button>
                )}

                {order.status === "ready" && (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "completed")}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                  >
                    Complete Order
                  </button>
                )}

                {order.status === "completed" && (
                  <div className="text-sm text-gray-600">Order completed</div>
                )}

                {order.status === "cancelled" && (
                  <div className="text-sm text-red-600">Order cancelled</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
