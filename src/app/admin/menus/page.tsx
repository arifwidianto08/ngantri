"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Menu {
  id: string;
  merchantId: string;
  merchantName?: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  imageUrl?: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
}

interface Merchant {
  id: string;
  name: string;
}

const fetchMenus = async (): Promise<{ data: Menu[] }> => {
  const res = await fetch("/api/admin/menus");
  return res.json();
};

const fetchMerchants = async (): Promise<{ data: Merchant[] }> => {
  const res = await fetch("/api/merchants");
  return res.json();
};

export default function AdminMenusPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedMerchant, setSelectedMerchant] = useState("all");
  const [processing, setProcessing] = useState(false);
  const [deleteMenuId, setDeleteMenuId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [menusQuery, merchantsQuery] = useQueries({
    queries: [
      {
        queryKey: ["admin-menus"],
        queryFn: fetchMenus,
      },
      {
        queryKey: ["merchants"],
        queryFn: fetchMerchants,
      },
    ],
  });

  const menus = menusQuery.data?.data ?? [];
  const merchants = merchantsQuery.data?.data ?? [];

  const isLoading = menusQuery.isLoading || merchantsQuery.isLoading;
  const isFetching = menusQuery.isFetching || merchantsQuery.isFetching;

  const refetch = () =>
    Promise.all([menusQuery.refetch(), merchantsQuery.refetch()]);

  const toggleAvailability = async (menuId: string, isAvailable: boolean) => {
    try {
      setProcessing(true);

      const res = await fetch(`/api/admin/menus/${menuId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });

      const result = await res.json();
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      }
    } catch (err) {
      console.error("Error updating availability:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMenuId) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/menus/${deleteMenuId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
        setShowDeleteDialog(false);
        setDeleteMenuId(null);
      }
    } catch (err) {
      console.error("Error deleting menu:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* --------------------------------
     Merchant Filter
  ----------------------------------*/
  const filteredMenus =
    selectedMerchant === "all"
      ? menus
      : menus.filter((m) => m.merchantId === selectedMerchant);

  /* --------------------------------
     Loading State
  ----------------------------------*/
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading menus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menus Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all menus across all merchants
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/menus/create")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Menu</span>
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isFetching ? (
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Menus</p>
          <p className="text-2xl font-bold text-gray-900">{menus.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {menus.filter((m) => m.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-red-600">
            {menus.filter((m) => !m.isAvailable).length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <label
          htmlFor="merchantFilter"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filter by Merchant
        </label>
        <select
          id="merchantFilter"
          value={selectedMerchant}
          onChange={(e) => setSelectedMerchant(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Merchants</option>
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {menu.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menu.imageUrl}
                alt={menu.name}
                className="w-full h-48 object-cover"
              />
            )}
            {!menu.imageUrl && (
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {menu.name}
                  </h3>
                  <p className="text-sm text-gray-600">{menu.merchantName}</p>
                  <p className="text-xs text-gray-500">{menu.categoryName}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    menu.isAvailable
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {menu.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              {menu.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {menu.description}
                </p>
              )}

              <p className="text-xl font-bold text-indigo-600 mb-3">
                Rp {menu.price.toLocaleString("id-ID")}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/admin/menus/${menu.id}`)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => toggleAvailability(menu.id, !menu.isAvailable)}
                  disabled={processing}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium ${
                    menu.isAvailable
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } disabled:opacity-50`}
                >
                  {menu.isAvailable ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenus.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No menus found
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Menu"
        description="Are you sure you want to delete this menu? This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        variant="danger"
      />
    </div>
  );
}
