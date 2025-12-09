"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

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

interface AdminMenusData {
  menus: Menu[];
  merchants: Merchant[];
}

export default function AdminMenusPage() {
  const [selectedMerchant, setSelectedMerchant] = useState<string>("all");
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AdminMenusData>({
    queryKey: ["admin-menus"],
    queryFn: async () => {
      const [menusRes, merchantsRes] = await Promise.all([
        fetch("/api/admin/menus"),
        fetch("/api/merchants"),
      ]);

      const menusResult = await menusRes.json();
      const merchantsResult = await merchantsRes.json();

      return {
        menus: menusResult.success ? menusResult.data : [],
        merchants: merchantsResult.success ? merchantsResult.data : [],
      };
    },
  });

  const menus = data?.menus ?? [];
  const merchants = data?.merchants ?? [];

  const toggleAvailability = async (menuId: string, isAvailable: boolean) => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/menus/${menuId}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAvailable }),
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
        alert("Menu availability updated!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update menu availability");
    } finally {
      setProcessing(false);
    }
  };

  const deleteMenu = async (menuId: string) => {
    if (!confirm("Are you sure you want to DELETE this menu?")) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/menus/${menuId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
        setSelectedMenu(null);
        alert("Menu deleted successfully!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting menu:", error);
      alert("Failed to delete menu");
    } finally {
      setProcessing(false);
    }
  };

  const filteredMenus =
    selectedMerchant === "all"
      ? menus
      : menus.filter((m) => m.merchantId === selectedMerchant);

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
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-menus"] })
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
                  onClick={() => setSelectedMenu(menu)}
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

      {/* Menu Details Modal */}
      {selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedMenu.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedMenu(null)}
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
              {selectedMenu.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMenu.imageUrl}
                  alt={selectedMenu.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Merchant</p>
                  <p className="font-medium text-gray-900">
                    {selectedMenu.merchantName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">
                    {selectedMenu.categoryName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    Rp {selectedMenu.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedMenu.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedMenu.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                {selectedMenu.description && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Description</p>
                    <p className="font-medium text-gray-900">
                      {selectedMenu.description}
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
                      selectedMenu.id,
                      !selectedMenu.isAvailable
                    );
                    setSelectedMenu(null);
                  }}
                  disabled={processing}
                  className={`w-full px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
                    selectedMenu.isAvailable
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {selectedMenu.isAvailable
                    ? "Set as Unavailable"
                    : "Set as Available"}
                </button>

                <button
                  type="button"
                  onClick={() => deleteMenu(selectedMenu.id)}
                  disabled={processing}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  Delete Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
