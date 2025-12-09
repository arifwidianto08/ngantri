"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Merchant {
  id: string;
  phoneNumber: string;
  merchantNumber: number;
  name: string;
  imageUrl?: string;
  description?: string;
  isAvailable: boolean;
  createdAt: string;
}

export default function AdminMerchantsPage() {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: merchants = [], isLoading } = useQuery<Merchant[]>({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const response = await fetch("/api/merchants");
      const result = await response.json();
      return Array.isArray(result.data?.merchants) ? result.data.merchants : [];
    },
  });

  const toggleAvailability = async (
    merchantId: string,
    isAvailable: boolean
  ) => {
    setProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/merchants/${merchantId}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable }),
        }
      );

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
        alert("Merchant availability updated!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update merchant availability");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (merchantId: string) => {
    setDeleteId(merchantId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/merchants/${deleteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
        setSelectedMerchant(null);
        setDeleteId(null);
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting merchant:", error);
      alert("Failed to delete merchant");
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading merchants...</p>
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
            Merchants Management
          </h1>
          <p className="text-gray-600 mt-1">Manage all registered merchants</p>
        </div>
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-merchants"] })
          }
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
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
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Merchants</p>
          <p className="text-2xl font-bold text-gray-900">{merchants.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {merchants.filter((m) => m.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-red-600">
            {merchants.filter((m) => !m.isAvailable).length}
          </p>
        </div>
      </div>

      {/* Merchants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {merchants.map((merchant) => (
          <div
            key={merchant.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {merchant.imageUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={merchant.imageUrl}
                  alt={merchant.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {!merchant.imageUrl && (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>No Image</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {merchant.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    #{merchant.merchantNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    merchant.isAvailable
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {merchant.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                {merchant.phoneNumber}
              </p>

              {merchant.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {merchant.description}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMerchant(merchant)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toggleAvailability(merchant.id, !merchant.isAvailable)
                  }
                  disabled={processing}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium ${
                    merchant.isAvailable
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } disabled:opacity-50`}
                >
                  {merchant.isAvailable ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {merchants.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No merchants found
        </div>
      )}

      {/* Merchant Details Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedMerchant.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedMerchant(null)}
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
              {selectedMerchant.imageUrl && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedMerchant.imageUrl}
                    alt={selectedMerchant.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Merchant Number</p>
                  <p className="font-medium text-gray-900">
                    #{selectedMerchant.merchantNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Phone Number</p>
                  <p className="font-medium text-gray-900">
                    {selectedMerchant.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedMerchant.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedMerchant.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600">Registered</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedMerchant.createdAt).toLocaleDateString(
                      "id-ID"
                    )}
                  </p>
                </div>
                {selectedMerchant.description && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Description</p>
                    <p className="font-medium text-gray-900">
                      {selectedMerchant.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>

                <button
                  type="button"
                  onClick={() => {
                    toggleAvailability(
                      selectedMerchant.id,
                      !selectedMerchant.isAvailable
                    );
                    setSelectedMerchant(null);
                  }}
                  disabled={processing}
                  className={`w-full px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
                    selectedMerchant.isAvailable
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {selectedMerchant.isAvailable
                    ? "Set as Unavailable"
                    : "Set as Available"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClick(selectedMerchant.id)}
                  disabled={processing}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  Delete Merchant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Merchant"
        description="Are you sure you want to DELETE this merchant? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={processing}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
