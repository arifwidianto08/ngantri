"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "@/components/loader";
import { useToast } from "@/components/toast-provider";
import { getOrCreateBuyerSession, type BuyerSession } from "@/lib/session";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";

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
  status: string;
  paymentStatus: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  merchant?: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800 border-green-300",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  accepted: "bg-blue-100 text-blue-800 border-blue-300",
  preparing: "bg-purple-100 text-purple-800 border-purple-300",
  ready: "bg-orange-100 text-orange-800 border-orange-300",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-5 h-5" />,
  pending: <Clock className="w-5 h-5" />,
  cancelled: <AlertCircle className="w-5 h-5" />,
  accepted: <CheckCircle2 className="w-5 h-5" />,
  preparing: <Clock className="w-5 h-5" />,
  ready: <CheckCircle2 className="w-5 h-5" />,
};

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_DESCRIPTIONS = {
  pending:
    "Your order has been received and is waiting for merchant confirmation",
  accepted: "The merchant has accepted your order and is preparing it",
  preparing: "Your order is being prepared in the kitchen",
  ready: "Your order is ready! Please come to pick it up",
  completed: "Order completed. Thank you for your purchase!",
  cancelled: "This order has been cancelled",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [buyerSession, setBuyerSession] = useState<BuyerSession | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    const initSession = async () => {
      const session = await getOrCreateBuyerSession();
      setBuyerSession(session);
    };
    initSession();
  }, []);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!buyerSession) return null;

      const response = await fetch(
        `/api/orders/${orderId}?session_id=${buyerSession.id}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result?.error?.message || "Failed to fetch order");
      }

      return result.data as Order;
    },
    enabled: !!buyerSession,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      if (!buyerSession) throw new Error("No session found");

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: buyerSession.id }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result?.error?.message || "Failed to cancel order");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      setShowCancelDialog(false);
      showToast("Order cancelled successfully", "success");
    },
    onError: (error) => {
      console.error("Error cancelling order:", error);
      showToast(
        `Failed to cancel order: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loader message="Loading order details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <div className="bg-white rounded-2xl shadow-md p-8 sm:p-12 flex flex-col items-center text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error
                ? "Failed to load order details"
                : "This order does not exist"}
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Order Details
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Status Card */}
        <div
          className={`rounded-2xl shadow-lg p-6 sm:p-8 mb-6 border-2 ${
            STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]
          }`}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {STATUS_ICONS[order.status as keyof typeof STATUS_ICONS]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                </h2>
                <p className="text-sm mt-1 opacity-90">
                  {
                    STATUS_DESCRIPTIONS[
                      order.status as keyof typeof STATUS_DESCRIPTIONS
                    ]
                  }
                </p>
              </div>
            </div>
            {order.paymentStatus && (
              <div
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex-shrink-0 ${
                  order.paymentStatus === "paid"
                    ? "bg-green-100 text-green-800 border-2 border-green-300"
                    : "bg-orange-100 text-orange-800 border-2 border-orange-300"
                }`}
              >
                {order.paymentStatus === "paid" ? "✓ Paid" : "⏳ Unpaid"}
              </div>
            )}
          </div>
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Merchant Info */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Merchant</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Merchant Name</p>
                <p className="text-base font-semibold text-gray-900">
                  {order.merchant?.name || "Merchant"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-sm font-mono text-gray-900 break-all">
                  {order.id}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Customer Info</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-base font-semibold text-gray-900">
                  {order.customerName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-base font-semibold text-blue-600 hover:text-blue-700"
                >
                  {order.customerPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Special Notes */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Notes</h3>
            </div>
            <div className="space-y-3">
              {order.notes ? (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {order.notes}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">No special notes</p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Timeline</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white">
                  ✓
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Order Placed
                </p>
                <p className="text-xs text-gray-600">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-300 text-white">
                    ✓
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Last Updated
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDate(order.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Order Items</h3>
            <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {order.items.length} items
            </span>
          </div>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0"
              >
                {item.menuImageUrl && (
                  <div className="flex-shrink-0 relative w-20 h-20">
                    <Image
                      src={item.menuImageUrl}
                      alt={item.menuName}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {item.menuName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-2">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal</span>
              <span>
                {formatCurrency(
                  order.items.reduce((sum, item) => sum + item.subtotal, 0)
                )}
              </span>
            </div>
            <div className="pt-3 border-t border-blue-400 flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/orders"
            className="flex-1 px-6 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 font-bold transition-all text-center"
          >
            Back to Orders
          </Link>
          {order.status === "pending" && (
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelOrderMutation.isPending}
              className="flex-1 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Cancel Order?
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this order? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={cancelOrderMutation.isPending}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={() => cancelOrderMutation.mutate()}
                  disabled={cancelOrderMutation.isPending}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelOrderMutation.isPending
                    ? "Cancelling..."
                    : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
