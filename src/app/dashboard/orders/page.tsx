"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  sessionId: string;
  paymentStatus: string;
  items?: Array<{
    id: string;
    menuName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    statusCounts: Record<string, number>;
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

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

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-orange-100 text-orange-800",
};

export default function MerchantOrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmState, setConfirmState] = useState<{
    type: "mark-paid" | "mark-unpaid" | null;
    orderId: string | null;
  }>({
    type: null,
    orderId: null,
  });

  const { showToast } = useToast();

  const {
    data: ordersResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<OrdersResponse>({
    queryKey: ["merchant-orders", filterStatus, page, pageSize],
    queryFn: async () => {
      const url = new URL(
        "/api/merchants/dashboard/orders",
        window.location.origin
      );
      if (filterStatus !== "all") {
        url.searchParams.append("status", filterStatus);
      }
      url.searchParams.append("page", page.toString());
      url.searchParams.append("pageSize", pageSize.toString());

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!result.success) {
        throw new Error("Failed to fetch orders");
      }

      return result;
    },
  });

  // Mutation for updating order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error?.message || "Failed to update order status"
        );
      }

      return result;
    },
    onSuccess: () => {
      showToast("Order status updated successfully", "success");
      void refetch();
    },
    onError: (error) => {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update order status",
        "error"
      );
    },
  });

  // Mutation for marking order as paid
  const markAsPaidMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(
        `/api/merchants/dashboard/orders/${orderId}/payment`,
        {
          method: "PATCH",
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result?.error?.message || "Failed to mark as paid");
      }

      return result;
    },
    onSuccess: () => {
      showToast("Order marked as paid successfully", "success");
      setConfirmState({ type: null, orderId: null });
      setSelectedOrder(null);
      void refetch();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Failed to mark order as paid",
        "error"
      );
    },
  });

  // Mutation for marking order as unpaid
  const markAsUnpaidMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(
        `/api/merchants/dashboard/orders/${orderId}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "unpaid" }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result?.error?.message || "Failed to mark as unpaid");
      }

      return result;
    },
    onSuccess: () => {
      showToast("Order marked as unpaid successfully", "success");
      setConfirmState({ type: null, orderId: null });
      setSelectedOrder(null);
      void refetch();
    },
    onError: (error) => {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to mark order as unpaid",
        "error"
      );
    },
  });

  const orders = ordersResponse?.data?.orders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage your incoming orders</p>
        </div>

        <Button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading || isFetching}
          variant="outline"
        >
          {isLoading || isFetching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
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
              <span>Refresh</span>
            </>
          )}
        </Button>
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
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent className="p-12 text-center">
            <p className="text-red-600 font-medium">Error loading orders</p>
            <p className="text-gray-600 text-sm mt-1">
              Please try refreshing the page
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      #{order.id.slice(0, 12)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          STATUS_COLORS[order.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[
                          order.paymentStatus || "unpaid"
                        ] ||
                          order.paymentStatus ||
                          "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Details
                        </Button>
                        {order.paymentStatus === "unpaid" && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setConfirmState({
                                type: "mark-paid",
                                orderId: order.id,
                              });
                            }}
                            disabled={markAsPaidMutation.isPending}
                          >
                            Mark as Paid
                          </Button>
                        )}
                        {order.paymentStatus === "paid" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setConfirmState({
                                type: "mark-unpaid",
                                orderId: order.id,
                              });
                            }}
                            disabled={markAsUnpaidMutation.isPending}
                          >
                            Mark as Unpaid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && !error && orders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            No orders found
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg shadow flex-wrap gap-4">
          <div className="text-sm text-gray-600">
            Page {page} of {ordersResponse?.data?.pagination?.totalPages || 1}{" "}
            (Total: {ordersResponse?.data?.pagination?.totalCount || 0} orders)
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-600">
                Per page:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <Button
                onClick={() =>
                  setPage(
                    Math.min(
                      ordersResponse?.data?.pagination?.totalPages || 1,
                      page + 1
                    )
                  )
                }
                disabled={
                  page === (ordersResponse?.data?.pagination?.totalPages || 1)
                }
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

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
                    <p className="text-gray-600">Status</p>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
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
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedOrder.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[
                        selectedOrder.paymentStatus || "unpaid"
                      ] ||
                        selectedOrder.paymentStatus ||
                        "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
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
              )}

              {/* Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>

                {selectedOrder.paymentStatus === "unpaid" && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmState({
                        type: "mark-paid",
                        orderId: selectedOrder.id,
                      });
                    }}
                    disabled={markAsPaidMutation.isPending}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 font-medium"
                  >
                    Mark as Paid
                  </button>
                )}

                {selectedOrder.paymentStatus === "paid" && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmState({
                        type: "mark-unpaid",
                        orderId: selectedOrder.id,
                      });
                    }}
                    disabled={markAsUnpaidMutation.isPending}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 font-medium"
                  >
                    Mark as Unpaid
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
                        void updateStatusMutation.mutateAsync({
                          orderId: selectedOrder.id,
                          status,
                        });
                        setSelectedOrder(null);
                      }}
                      disabled={
                        updateStatusMutation.isPending ||
                        selectedOrder.status === status
                      }
                      className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedOrder.status === status
                          ? "bg-gray-300 text-gray-600"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmState.type === "mark-paid"}
        onOpenChange={(open) =>
          !open && setConfirmState({ type: null, orderId: null })
        }
        title="Mark Order as Paid"
        description="Are you sure you want to mark this order as PAID?"
        onConfirm={() => {
          if (confirmState.orderId) {
            void markAsPaidMutation.mutateAsync(confirmState.orderId);
          }
        }}
        isLoading={markAsPaidMutation.isPending}
        variant="primary"
        confirmText="Mark as Paid"
      />

      <ConfirmDialog
        open={confirmState.type === "mark-unpaid"}
        onOpenChange={(open) =>
          !open && setConfirmState({ type: null, orderId: null })
        }
        title="Mark Order as Unpaid"
        description="Are you sure you want to mark this order as UNPAID?"
        onConfirm={() => {
          if (confirmState.orderId) {
            void markAsUnpaidMutation.mutateAsync(confirmState.orderId);
          }
        }}
        isLoading={markAsUnpaidMutation.isPending}
        variant="primary"
        confirmText="Mark as Unpaid"
      />
    </div>
  );
}
