"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  merchantId: string;
  createdAt: string;
  menuCount: number;
}

interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [merchantId, setMerchantId] = useState("");
  const [initComplete, setInitComplete] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Initialize merchant ID
  useEffect(() => {
    const initializeMerchantId = async () => {
      const storedId = localStorage.getItem("merchantId");

      if (storedId) {
        setMerchantId(storedId);
        setInitComplete(true);
        return;
      }

      try {
        const response = await fetch("/api/merchants/me");
        if (!response.ok) {
          router.push("/dashboard/login");
          return;
        }

        const { data } = await response.json();
        if (data?.id) {
          const { id } = data;
          localStorage.setItem("merchantId", id);
          setMerchantId(id);
        } else {
          router.push("/dashboard/login");
          return;
        }
      } catch (error) {
        console.error("Error fetching merchant:", error);
        router.push("/dashboard/login");
        return;
      }

      setInitComplete(true);
    };

    initializeMerchantId();
  }, [router]);

  // Fetch categories with pagination
  const {
    data: categoriesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<CategoriesResponse>({
    queryKey: ["merchant-categories", merchantId, page, pageSize],
    queryFn: async () => {
      if (!merchantId)
        return {
          success: false,
          data: {
            categories: [],
            pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
          },
        };

      const url = new URL(
        `/api/merchants/${merchantId}/categories`,
        window.location.origin
      );
      url.searchParams.append("page", String(page));
      url.searchParams.append("pageSize", String(pageSize));

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch categories");
      }

      return result;
    },
    enabled: initComplete && !!merchantId,
  });

  // Save category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (variables: { name: string; id?: string }) => {
      const method = variables.id ? "PATCH" : "POST";
      const url = variables.id
        ? `/api/merchants/${merchantId}/categories/${variables.id}`
        : `/api/merchants/${merchantId}/categories`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: variables.name }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to save category");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["merchant-categories", merchantId],
      });
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "" });
      showToast(
        editingId ? "Category updated!" : "Category created!",
        "success"
      );
    },
    onError: (error) => {
      console.error("Error saving category:", error);
      showToast(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(
        `/api/merchants/${merchantId}/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete category");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["merchant-categories", merchantId],
      });
      showToast("Category deleted successfully!", "success");
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      showToast(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Category name is required", "warning");
      return;
    }

    saveCategoryMutation.mutate({
      name: formData.name,
      id: editingId || undefined,
    });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "" });
  };

  const categories = categoriesResponse?.data?.categories || [];
  const pagination = categoriesResponse?.data?.pagination || {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  };

  if (isLoading && !initComplete) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Organize your menu items</p>
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
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Main Courses, Desserts"
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Menu Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category: Category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.menuCount} items
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          disabled={
                            saveCategoryMutation.isPending ||
                            deleteCategoryMutation.isPending
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deleteCategoryMutation.mutate(category.id)
                          }
                          disabled={
                            deleteCategoryMutation.isPending ||
                            saveCategoryMutation.isPending
                          }
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
            No categories found. Create your first category to organize your
            menu.
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
    </div>
  );
}
