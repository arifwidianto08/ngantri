"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  sessionId: string;
}

export default function MerchantOrdersPage() {
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: ordersData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["merchant-orders", filter],
    queryFn: async () => {
      const url =
        filter === "all"
          ? "/api/merchants/dashboard/orders"
          : `/api/merchants/dashboard/orders?status=${filter}`;

      const res = await fetch(url);
      const result = await res.json();

      if (!result.success) throw new Error("Failed to fetch orders");

      return {
        orders: result.data.orders,
        statusCounts: result.data.statusCounts || {},
      };
    },
  });

  const orders = ordersData?.orders ?? [];
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }: {
      orderId: string;
      newStatus: string;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error?.message || "Unknown error");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-orders", filter] });
      toast({ title: "Success", description: "Order status updated!" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading || updateOrderStatusMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
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
        <Button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["merchant-orders", filter],
            })
          }
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

      {/* Filter Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setFilter("all")}
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
            >
              All ({ordersData?.statusCounts?.all || 0})
            </Button>
            <Button
              onClick={() => setFilter("pending")}
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
            >
              Pending ({ordersData?.statusCounts?.pending || 0})
            </Button>
            <Button
              onClick={() => setFilter("accepted")}
              variant={filter === "accepted" ? "default" : "outline"}
              size="sm"
            >
              Accepted ({ordersData?.statusCounts?.accepted || 0})
            </Button>
            <Button
              onClick={() => setFilter("preparing")}
              variant={filter === "preparing" ? "default" : "outline"}
              size="sm"
            >
              Preparing ({ordersData?.statusCounts?.preparing || 0})
            </Button>
            <Button
              onClick={() => setFilter("ready")}
              variant={filter === "ready" ? "default" : "outline"}
              size="sm"
            >
              Ready ({ordersData?.statusCounts?.ready || 0})
            </Button>
            <Button
              onClick={() => setFilter("completed")}
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
            >
              Completed ({ordersData?.statusCounts?.completed || 0})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No orders found for this filter
            </CardContent>
          </Card>
        ) : (
          orders.map((order: Order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
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
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "default"
                          : order.status === "pending"
                          ? "secondary"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "outline"
                      }
                      className="mt-2"
                    >
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {order.status === "pending" && (
                    <>
                      <Button
                        onClick={() =>
                          updateOrderStatusMutation.mutate({
                            orderId: order.id,
                            newStatus: "accepted",
                          })
                        }
                        variant="default"
                        size="sm"
                      >
                        Accept Order
                      </Button>
                      <Button
                        onClick={() =>
                          updateOrderStatusMutation.mutate({
                            orderId: order.id,
                            newStatus: "cancelled",
                          })
                        }
                        variant="destructive"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <Button
                      onClick={() =>
                        updateOrderStatusMutation.mutate({
                          orderId: order.id,
                          newStatus: "preparing",
                        })
                      }
                      variant="default"
                      size="sm"
                    >
                      Start Preparing
                    </Button>
                  )}

                  {order.status === "preparing" && (
                    <Button
                      onClick={() =>
                        updateOrderStatusMutation.mutate({
                          orderId: order.id,
                          newStatus: "ready",
                        })
                      }
                      variant="default"
                      size="sm"
                    >
                      Mark as Ready
                    </Button>
                  )}

                  {order.status === "ready" && (
                    <Button
                      onClick={() =>
                        updateOrderStatusMutation.mutate({
                          orderId: order.id,
                          newStatus: "completed",
                        })
                      }
                      variant="default"
                      size="sm"
                    >
                      Complete Order
                    </Button>
                  )}

                  {order.status === "completed" && (
                    <div className="text-sm text-gray-600">Order completed</div>
                  )}

                  {order.status === "cancelled" && (
                    <div className="text-sm text-gray-900">Order cancelled</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
