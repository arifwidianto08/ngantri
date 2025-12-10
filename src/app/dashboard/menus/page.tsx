"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMerchantIdFromStorage,
  setMerchantIdInStorage,
} from "@/lib/merchant-client";
import type { MenuCategory } from "@/data/schema";

interface Menu {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: string;
  categoryName?: string;
  createdAt: string;
}

interface MenusResponse {
  success: boolean;
  data: Menu[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface CategoriesResponse {
  success: boolean;
  data: MenuCategory[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function MerchantMenusPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [merchantId, setMerchantId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [initComplete, setInitComplete] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
  });

  // Initialize merchant ID from storage
  useEffect(() => {
    const initializeMerchantId = async () => {
      let id = getMerchantIdFromStorage();

      if (!id) {
        try {
          const response = await fetch("/api/merchants/me");
          const result = await response.json();

          if (result.success && result.data.merchant?.id) {
            id = result.data.merchant.id;
            setMerchantIdInStorage(id);
          } else {
            router.push("/dashboard/login");
            return;
          }
        } catch (error) {
          console.error("Error fetching merchant:", error);
          router.push("/dashboard/login");
          return;
        }
      }

      setMerchantId(id || "");
      setInitComplete(true);
    };

    initializeMerchantId();
  }, [router]);

  // Query: Fetch menus with pagination
  const {
    data: menusResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<MenusResponse>({
    queryKey: ["merchant-menus", merchantId, page, pageSize],
    queryFn: async () => {
      if (!merchantId) {
        return {
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 10,
            totalCount: 0,
            totalPages: 0,
          },
        };
      }

      const url = new URL(
        `/api/merchants/${merchantId}/menus`,
        window.location.origin
      );
      url.searchParams.append("page", String(page));
      url.searchParams.append("pageSize", String(pageSize));
      const response = await fetch(url);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch menus");
      }
      return result;
    },
    enabled: initComplete && !!merchantId,
  });

  // Query: Fetch categories for form
  const { data: categoriesResponse } = useQuery<CategoriesResponse>({
    queryKey: ["merchant-categories", merchantId],
    queryFn: async () => {
      if (!merchantId) {
        return {
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 1000,
            totalCount: 0,
            totalPages: 0,
          },
        };
      }

      const url = new URL(
        `/api/merchants/${merchantId}/categories`,
        window.location.origin
      );
      url.searchParams.append("page", "1");
      url.searchParams.append("pageSize", "1000");
      const response = await fetch(url);
      return response.json();
    },
    enabled: initComplete && !!merchantId,
  });

  const allMenus = menusResponse?.data ?? [];
  const pagination = menusResponse?.pagination ?? {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  };
  const categories = categoriesResponse?.data ?? [];

  // Mutation: Save menu (create or update)
  const saveMenuMutation = useMutation({
    mutationFn: async (variables: {
      name: string;
      description: string | null;
      price: number;
      categoryId: string;
      imageUrl?: string;
      id?: string;
    }) => {
      const method = variables.id ? "PATCH" : "POST";
      const url = variables.id
        ? `/api/merchants/${merchantId}/menus/${variables.id}`
        : `/api/merchants/${merchantId}/menus`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: variables.name,
          description: variables.description,
          price: variables.price,
          categoryId: variables.categoryId,
          imageUrl: variables.imageUrl || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to save menu");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["merchant-menus"] });
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        imageUrl: "",
      });
      toast({
        title: "Success",
        description: editingId ? "Menu updated!" : "Menu created!",
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

  // Mutation: Toggle menu availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (variables: { menuId: string; isAvailable: boolean }) => {
      const response = await fetch(
        `/api/merchants/${merchantId}/menus/${variables.menuId}`,
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
          result.error?.message || "Failed to update availability"
        );
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["merchant-menus"] });
      toast({
        title: "Success",
        description: "Menu availability updated!",
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

  // Mutation: Delete menu
  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const response = await fetch(
        `/api/merchants/${merchantId}/menus/${menuId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete menu");
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["merchant-menus"] });
      setDeleteId(null);
      toast({
        title: "Menu deleted",
        description: "The menu has been removed successfully.",
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

  const handleDeleteClick = (menuId: string) => {
    setDeleteId(menuId);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMenuMutation.mutate(deleteId);
  };

  const handleEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setFormData({
      name: menu.name,
      description: menu.description || "",
      price: menu.price.toString(),
      categoryId: menu.categoryId,
      imageUrl: menu.imageUrl || "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      imageUrl: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Name, price, and category are required",
        variant: "destructive",
      });
      return;
    }

    saveMenuMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      price: Number.parseFloat(formData.price),
      categoryId: formData.categoryId,
      imageUrl: formData.imageUrl || undefined,
      id: editingId || undefined,
    });
  };

  /* --------------------------------
     Loading State
  ----------------------------------*/
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold text-gray-900">Menus</h1>
          <p className="text-gray-600 mt-1">Manage your menu items</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Menu</span>
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
            <CardTitle>{editingId ? "Edit Menu" : "Create New Menu"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Nasi Goreng"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (IDR)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="e.g., 25000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat: MenuCategory) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your menu item..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {formData.imageUrl && (
                  <div className="mt-3 flex justify-center">
                    <div className="relative w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={formData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        onError={() => {
                          console.error("Failed to load image");
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMenuMutation.isPending}>
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={saveMenuMutation.isPending}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Menus</p>
          <p className="text-2xl font-bold text-gray-900">
            {pagination.totalCount}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-gray-900">
            {allMenus.filter((m) => m.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-gray-900">
            {allMenus.filter((m) => !m.isAvailable).length}
          </p>
        </div>
      </div>

      {/* Menus Table */}
      <Card>
        {isLoading ? (
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
              <p className="text-gray-600">Loading menus...</p>
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
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allMenus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {menu.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {menu.categoryName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Rp {menu.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={menu.isAvailable ? "default" : "destructive"}
                      >
                        {menu.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEdit(menu)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            toggleAvailabilityMutation.mutate({
                              menuId: menu.id,
                              isAvailable: !menu.isAvailable,
                            })
                          }
                          disabled={toggleAvailabilityMutation.isPending}
                          variant={menu.isAvailable ? "destructive" : "default"}
                          size="sm"
                        >
                          {menu.isAvailable ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(menu.id)}
                          disabled={deleteMenuMutation.isPending}
                          variant="destructive"
                          size="sm"
                        >
                          {deleteMenuMutation.isPending
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

        {!isLoading && allMenus.length === 0 && (
          <CardContent className="p-12 text-center text-gray-500">
            No menus found
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && allMenus.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg shadow flex-wrap gap-4">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} (Total:{" "}
            {pagination.totalCount} menus)
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Menu"
        description="Are you sure you want to delete this menu? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteMenuMutation.isPending}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
