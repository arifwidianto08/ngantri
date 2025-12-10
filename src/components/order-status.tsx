"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/currency";

interface OrderStatusProps {
  orderId: string;
  onClose?: () => void;
}

interface OrderDetails {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  merchantId: string;
}

const statusSteps = [
  {
    key: "pending",
    label: "Order Placed",
    description: "Waiting for merchant confirmation",
  },
  {
    key: "accepted",
    label: "Confirmed",
    description: "Merchant accepted your order",
  },
  {
    key: "preparing",
    label: "Preparing",
    description: "Your order is being prepared",
  },
  {
    key: "ready",
    label: "Ready",
    description: "Your order is ready for pickup",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Order completed successfully",
  },
];

const cancelledStep = {
  key: "cancelled",
  label: "Cancelled",
  description: "Order was cancelled",
};

export default function OrderStatus({ orderId, onClose }: OrderStatusProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderStatus = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch order status");
      }

      const data = await response.json();
      setOrderDetails(data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching order status:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderStatus();

      // Poll for updates every 30 seconds
      const interval = setInterval(fetchOrderStatus, 30000);

      return () => clearInterval(interval);
    }
  }, [orderId, fetchOrderStatus]);

  const getStatusStepIndex = (status: string) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "accepted":
        return "text-blue-600 bg-blue-100";
      case "preparing":
        return "text-orange-600 bg-orange-100";
      case "ready":
        return "text-green-600 bg-green-100";
      case "completed":
        return "text-green-800 bg-green-200";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-300 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Error</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Order
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={fetchOrderStatus}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                Try Again
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return null;
  }

  const currentStepIndex = getStatusStepIndex(orderDetails.status);
  const isCancelled = orderDetails.status === "cancelled";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
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
          )}
        </div>

        {/* Order Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Order ID</span>
            <span className="font-mono text-sm">
              {orderDetails.id.slice(0, 12)}...
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="font-semibold">
              {formatCurrency(orderDetails.totalAmount)}
            </span>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="text-center mb-6">
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
              orderDetails.status
            )}`}
          >
            {isCancelled
              ? cancelledStep.label
              : statusSteps.find((step) => step.key === orderDetails.status)
                  ?.label || orderDetails.status}
          </span>
        </div>

        {/* Status Timeline */}
        <div className="space-y-4">
          {isCancelled ? (
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Cancelled</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{cancelledStep.label}</p>
              <p className="text-gray-600 text-sm">
                {cancelledStep.description}
              </p>
            </div>
          ) : (
            statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex items-start">
                  <div className="flex-shrink-0 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? isCurrent
                            ? "bg-blue-500 text-white"
                            : "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted && !isCurrent ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <title>Completed</title>
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute top-8 left-4 w-0.5 h-6 ${
                          isCompleted ? "bg-green-300" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3
                      className={`font-medium ${
                        isCompleted ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isCompleted ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Status updates automatically every 30 seconds
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={fetchOrderStatus}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Status
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
