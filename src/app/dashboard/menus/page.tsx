"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMerchantIdFromStorage,
  setMerchantIdInStorage,
} from "@/lib/merchant-client";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

export default function MerchantMenusPage() {
  const [merchantId, setMerchantId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  });
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [initComplete, setInitComplete] = useState(false);

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
            router.push("/login");
            return;
          }
        } catch (error) {
          console.error("Error fetching merchant:", error);
          router.push("/login");
          return;
        }
      }

      setMerchantId(id || "");
      setInitComplete(true);
    };

    initializeMerchantId();
  }, [router]);

  const {
    data: menuData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["merchant-menus", merchantId],
    queryFn: async () => {
      if (!merchantId) return { menus: [], categories: [] };

      const [menusRes, categoriesRes] = await Promise.all([
        fetch(`/api/merchants/${merchantId}/menus`),
        fetch(`/api/merchants/${merchantId}/categories`),
      ]);

      const menusResult = await menusRes.json();
      const categoriesResult = await categoriesRes.json();

      return {
        menus: menusResult.success ? menusResult.data.menus || [] : [],
        categories: categoriesResult.success
          ? categoriesResult.data.categories || []
          : [],
      };
    },
    enabled: initComplete && !!merchantId,
  });

  const menus = menuData?.menus ?? [];
  const categories = menuData?.categories ?? [];

  const saveMenuMutation = useMutation({
    mutationFn: async (variables: {
      name: string;
      description: string | null;
      price: number;
      categoryId: string;
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
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to save menu");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["merchant-menus", merchantId],
      });
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", description: "", price: "", categoryId: "" });
      showToast(editingId ? "Menu updated!" : "Menu created!", "success");
    },
    onError: (error) => {
      console.error("Error saving menu:", error);
      showToast(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (variables: { menuId: string; isAvailable: boolean }) => {
      const response = await fetch(
        `/api/merchants/${merchantId}/menus/${variables.menuId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: variables.isAvailable }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to update menu");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["merchant-menus", merchantId],
      });
      showToast("Menu availability updated!", "success");
    },
    onError: (error) => {
      console.error("Error updating menu:", error);
      showToast(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });

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

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["merchant-menus", merchantId],
      });
      showToast("Menu deleted successfully!", "success");
    },
    onError: (error) => {
      console.error("Error deleting menu:", error);
      showToast(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      showToast("Name, price, and category are required", "warning");
      return;
    }

    saveMenuMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      price: Number.parseFloat(formData.price),
      categoryId: formData.categoryId,
      id: editingId || undefined,
    });
  };

  const handleEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setFormData({
      name: menu.name,
      description: menu.description || "",
      price: menu.price.toString(),
      categoryId: menu.categoryId,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", description: "", price: "", categoryId: "" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menus</h1>
          <p className="text-gray-600 mt-1">Manage your menu items</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Menu</Button>
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
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Menus</p>
            <p className="text-2xl font-bold text-gray-900">{menus.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-gray-900">
              {menus.filter((m: Menu) => m.isAvailable).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Unavailable</p>
            <p className="text-2xl font-bold text-gray-900">
              {menus.filter((m: Menu) => !m.isAvailable).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu: Menu) => (
          <Card key={menu.id} className="overflow-hidden">
            {menu.imageUrl ? (
              <div className="relative w-full h-48">
                <Image
                  src={menu.imageUrl}
                  alt={menu.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">
                  No image available
                </span>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {menu.name}
                  </h3>
                  {menu.categoryName && (
                    <p className="text-xs text-gray-500">{menu.categoryName}</p>
                  )}
                </div>
                <Badge variant={menu.isAvailable ? "default" : "destructive"}>
                  {menu.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>{" "}
              {menu.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {menu.description}
                </p>
              )}
              <p className="text-xl font-bold text-gray-900 mb-3">
                {formatCurrency(menu.price)}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(menu)}
                  disabled={
                    saveMenuMutation.isPending || deleteMenuMutation.isPending
                  }
                  variant="default"
                  size="sm"
                  className="flex-1"
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
                  disabled={
                    toggleAvailabilityMutation.isPending ||
                    saveMenuMutation.isPending ||
                    deleteMenuMutation.isPending
                  }
                  variant={menu.isAvailable ? "outline" : "default"}
                  size="sm"
                  className="flex-1"
                >
                  {menu.isAvailable ? "Disable" : "Enable"}
                </Button>
                <Button
                  onClick={() => deleteMenuMutation.mutate(menu.id)}
                  disabled={
                    deleteMenuMutation.isPending ||
                    saveMenuMutation.isPending ||
                    toggleAvailabilityMutation.isPending
                  }
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {menus.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          No menu items found. Create your first menu item to get started.
        </Card>
      )}
    </div>
  );
}
