"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  merchantId: string;
  merchantName: string;
  status: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  paymentStatus: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-red-100 text-red-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    unpaid: 0,
  });

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const url =
          filterStatus === "all"
            ? "/api/admin/orders"
            : `/api/admin/orders?status=${filterStatus}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setOrders(result.data);
          if (result.stats) {
            setStats(result.stats);
          }
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filterStatus]);

  const refetchOrders = async () => {
    setLoading(true);
    try {
      const url =
        filterStatus === "all"
          ? "/api/admin/orders"
          : `/api/admin/orders?status=${filterStatus}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data);
        if (result.stats) {
          setStats(result.stats);
        }
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

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (result.success) {
        refetchOrders();
        alert("Order marked as paid!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Failed to mark order as paid");
    } finally {
      setProcessing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Change order status to ${newStatus.toUpperCase()}?`)) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        refetchOrders();
        alert("Order status updated!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update order status");
    } finally {
      setProcessing(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to CANCEL this order?")) {
      return;
    }

    updateOrderStatus(orderId, "cancelled");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Orders Management
          </h1>
          <p className="text-gray-600 mt-1">Manage all customer orders</p>
        </div>
        <button
          type="button"
          onClick={refetchOrders}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Refresh</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unpaid</p>
          <p className="text-2xl font-bold text-orange-600">{stats.unpaid}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {[
            "all",
            "pending",
            "accepted",
            "preparing",
            "ready",
            "completed",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Merchant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.merchantName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-gray-500">
                      {order.customerPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Rp {order.totalAmount.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[order.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        PAYMENT_STATUS_COLORS[
                          order.paymentStatus || "unpaid"
                        ] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus || "unpaid"] ||
                        order.paymentStatus ||
                        "Unpaid"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">No orders found</div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order #{selectedOrder.id}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Close</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Order Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Merchant</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.merchantName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.customerName}
                    </p>
                    <p className="text-gray-500">
                      {selectedOrder.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[selectedOrder.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[selectedOrder.status] ||
                        selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        PAYMENT_STATUS_COLORS[
                          selectedOrder.paymentStatus || "unpaid"
                        ] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[
                        selectedOrder.paymentStatus || "unpaid"
                      ] ||
                        selectedOrder.paymentStatus ||
                        "Unpaid"}
                    </span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Notes</p>
                      <p className="font-medium text-gray-900">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Items
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.menuName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × Rp{" "}
                          {item.unitPrice.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                    <p className="text-lg font-bold text-gray-900">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Rp {selectedOrder.totalAmount.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>

                {selectedOrder.paymentStatus !== "paid" && (
                  <button
                    type="button"
                    onClick={() => {
                      markAsPaid(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                  >
                    Mark as Paid
                  </button>
                )}

                <div className="flex gap-2 flex-wrap">
                  {[
                    "pending",
                    "accepted",
                    "preparing",
                    "ready",
                    "completed",
                  ].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, status);
                        setSelectedOrder(null);
                      }}
                      disabled={processing || selectedOrder.status === status}
                      className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedOrder.status === status
                          ? "bg-gray-300 text-gray-600"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                {selectedOrder.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => {
                      cancelOrder(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
