"use client";

import { useState } from "react";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface MerchantsResponse {
  success: boolean;
  data: Merchant[];
}

export default function AdminCategoriesPage() {
  const [selectedMerchant, setSelectedMerchant] = useState<string>("all");
  const [processing, setProcessing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formMerchantId, setFormMerchantId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [categoriesQuery, merchantsQuery] = useQueries({
    queries: [
      {
        queryKey: ["admin-categories", selectedMerchant, page, pageSize],
        queryFn: async (): Promise<CategoriesResponse> => {
          const url = new URL("/api/admin/categories", window.location.origin);
          url.searchParams.append("page", String(page));
          url.searchParams.append("pageSize", String(pageSize));
          if (selectedMerchant !== "all") {
            url.searchParams.append("merchantId", selectedMerchant);
          }
          const res = await fetch(url);
          return res.json();
        },
      },
      {
        queryKey: ["admin-merchants"],
        queryFn: async (): Promise<MerchantsResponse> => {
          const res = await fetch("/api/merchants");
          return res.json();
        },
      },
    ],
  });

  const categories = categoriesQuery.data?.data ?? [];
  const pagination = categoriesQuery.data?.pagination ?? {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  };
  const merchants = merchantsQuery.data?.data ?? [];
  const isLoading = categoriesQuery.isLoading || merchantsQuery.isLoading;
  const isFetching = categoriesQuery.isFetching || merchantsQuery.isFetching;

  const refetch = async () => {
    await Promise.all([categoriesQuery.refetch(), merchantsQuery.refetch()]);
  };

  // Mutation: Save category (create or update)
  const saveCategoryMutation = useMutation({
    mutationFn: async (variables: {
      name: string;
      merchantId: string;
      id?: string;
    }) => {
      if (variables.id) {
        // Update existing category
        const response = await fetch(`/api/admin/categories/${variables.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: variables.name,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMessage =
            typeof result.error === "string"
              ? result.error
              : result.error?.message || "Failed to update category";
          throw new Error(errorMessage);
        }

        if (!result.success) {
          throw new Error(
            result?.error ||
              result?.error?.message ||
              "Failed to update category"
          );
        }

        return result.data;
      }

      // Create new category
      const response = await fetch("/api/admin/categories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: variables.name,
          merchantId: variables.merchantId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : result.error?.message || "Failed to create category";
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(
          result?.error || result?.error?.message || "Failed to create category"
        );
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "" });
      setFormMerchantId("");
      toast({
        title: "Success",
        description: editingId ? "Category updated!" : "Category created!",
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

  const handleDeleteClick = (categoryId: string) => {
    setDeleteId(categoryId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/categories/${deleteId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        void queryClient.invalidateQueries({
          queryKey: ["admin-categories"],
        });
        setDeleteId(null);

        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed: ${
            result?.error || result.error?.message || "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name });
    setFormMerchantId(category.merchantId);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "" });
    setFormMerchantId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formMerchantId) {
      toast({
        title: "Validation Error",
        description: "Category name and merchant are required",
        variant: "destructive",
      });
      return;
    }

    saveCategoryMutation.mutate({
      name: formData.name,
      merchantId: formMerchantId,
      id: editingId || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
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
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Category</span>
          </Button>
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
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Category" : "Create New Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant
                </label>
                <select
                  value={formMerchantId}
                  onChange={(e) => setFormMerchantId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select a merchant</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="e.g., Main Course"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saveCategoryMutation.isPending}>
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={saveCategoryMutation.isPending}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900">
            {pagination.totalCount}
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
          onChange={(e) => {
            setSelectedMerchant(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
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
      <Card>
        {isLoading ? (
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
              <p className="text-gray-600">Loading categories...</p>
            </div>
          </CardContent>
        ) : (
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
                {categories.map((category) => (
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
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEdit(category)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(category.id)}
                          disabled={processing}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && categories.length === 0 && (
          <CardContent className="p-12 text-center text-gray-500">
            No categories found
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && categories.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg shadow flex-wrap gap-4">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} (Total:{" "}
            {pagination.totalCount} categories)
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category"
        description="Are you sure you want to DELETE this category? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={processing}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
