"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface MerchantsResponse {
  success: boolean;
  data: Merchant[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminMerchantsPage() {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query: Fetch all merchants with pagination
  const {
    data: merchantsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<MerchantsResponse>({
    queryKey: ["admin-merchants", page, pageSize],
    queryFn: async () => {
      const url = new URL("/api/admin/merchants", window.location.origin);
      url.searchParams.append("page", String(page));
      url.searchParams.append("pageSize", String(pageSize));
      const response = await fetch(url);
      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result?.error || result?.error?.message || "Failed to fetch merchants"
        );
      }
      return result;
    },
  });

  const merchants = merchantsResponse?.data ?? [];
  const pagination = merchantsResponse?.pagination ?? {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  };

  // Mutation: Toggle merchant availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (variables: {
      merchantId: string;
      isAvailable: boolean;
    }) => {
      const response = await fetch(
        `/api/admin/merchants/${variables.merchantId}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable: variables.isAvailable }),
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result?.error ||
            result?.error?.message ||
            "Failed to update availability"
        );
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      toast({
        title: "Success",
        description: "Merchant availability updated!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete merchant
  const deleteMerchantMutation = useMutation({
    mutationFn: async (merchantId: string) => {
      const response = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result?.error || result?.error?.message || "Failed to delete merchant"
        );
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      setSelectedMerchant(null);
      setDeleteId(null);
      toast({
        title: "Merchant deleted",
        description: "The merchant has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (merchantId: string) => {
    setDeleteId(merchantId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    deleteMerchantMutation.mutate(deleteId);
  };

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Merchants</p>
          <p className="text-2xl font-bold text-gray-900">
            {pagination.totalCount}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-gray-900">
            {merchants.filter((m) => m.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-gray-900">
            {merchants.filter((m) => !m.isAvailable).length}
          </p>
        </div>
      </div>

      {/* Merchants Table */}
      <Card>
        {isLoading ? (
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
              <p className="text-gray-600">Loading merchants...</p>
            </div>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {merchant.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {merchant.phoneNumber}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">
                        {merchant.isAvailable && (
                          <BadgeCheck className="fill-blue-600" />
                        )}
                        {merchant.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(merchant.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setSelectedMerchant(merchant)}
                          variant="outline"
                          size="sm"
                        >
                          Details
                        </Button>
                        <Button
                          onClick={() =>
                            toggleAvailabilityMutation.mutate({
                              merchantId: merchant.id,
                              isAvailable: !merchant.isAvailable,
                            })
                          }
                          disabled={toggleAvailabilityMutation.isPending}
                          variant={
                            merchant.isAvailable ? "destructive" : "default"
                          }
                          size="sm"
                        >
                          {merchant.isAvailable ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(merchant.id)}
                          disabled={deleteMerchantMutation.isPending}
                          variant="destructive"
                          size="sm"
                        >
                          {deleteMerchantMutation.isPending
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && merchants.length === 0 && (
          <CardContent className="p-12 text-center text-gray-500">
            No merchants found
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && merchants.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg shadow flex-wrap gap-4">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} (Total:{" "}
            {pagination.totalCount} merchants)
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
                  setPage(Math.min(pagination.totalPages || 1, page + 1))
                }
                disabled={page === pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
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
                        ? "bg-gray-200 text-gray-900"
                        : "bg-gray-300 text-gray-900"
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
                    toggleAvailabilityMutation.mutate({
                      merchantId: selectedMerchant.id,
                      isAvailable: !selectedMerchant.isAvailable,
                    });
                    setSelectedMerchant(null);
                  }}
                  disabled={toggleAvailabilityMutation.isPending}
                  className={`w-full px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
                    selectedMerchant.isAvailable
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {selectedMerchant.isAvailable
                    ? "Set as Unavailable"
                    : "Set as Available"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClick(selectedMerchant.id)}
                  disabled={deleteMerchantMutation.isPending}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
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
        isLoading={deleteMerchantMutation.isPending}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
