"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  merchantId: string;
  merchantName?: string;
  name: string;
  createdAt: string;
}

interface Merchant {
  id: string;
  name: string;
}

export default function AdminCategoriesPage() {
  const [selectedMerchant, setSelectedMerchant] = useState<string>("all");
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    categories: Category[];
    merchants: Merchant[];
  }>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const [categoriesRes, merchantsRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/merchants"),
      ]);

      const categoriesResult = await categoriesRes.json();
      const merchantsResult = await merchantsRes.json();

      return {
        categories: categoriesResult.success ? categoriesResult.data : [],
        merchants: merchantsResult.success ? merchantsResult.data : [],
      };
    },
  });

  const categories = data?.categories ?? [];
  const merchants = data?.merchants ?? [];

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to DELETE this category?")) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        alert("Category deleted successfully!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    } finally {
      setProcessing(false);
    }
  };

  const filteredCategories =
    selectedMerchant === "all"
      ? categories
      : categories.filter((c) => c.merchantId === selectedMerchant);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage menu categories across all merchants
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900">
            {categories.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Merchants</p>
          <p className="text-2xl font-bold text-gray-900">{merchants.length}</p>
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

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Merchant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.merchantName || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(category.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => deleteCategory(category.id)}
                      disabled={processing}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories found
          </div>
        )}
      </div>
    </div>
  );
}
