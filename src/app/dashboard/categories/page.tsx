"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMerchantIdFromStorage,
  setMerchantIdInStorage,
} from "@/lib/merchant-client";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Category {
  id: string;
  name: string;
  menuCount?: number;
}

export default function MerchantCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [merchantId, setMerchantId] = useState<string>("");
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
      setLoading(false);
    };

    initializeMerchantId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: catData } = useQuery({
    queryKey: ["merchant-categories", merchantId],
    queryFn: async () => {
      if (!merchantId) return { categories: [] };
      const response = await fetch(`/api/merchants/${merchantId}/categories`);
      const result = await response.json();
      return { categories: result.success ? result.data.categories || [] : [] };
    },
    enabled: initComplete && !!merchantId,
  });

  useEffect(() => {
    if (catData) {
      setCategories(catData.categories);
      setLoading(false);
    }
  }, [catData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Category name is required", "warning");
      return;
    }

    setProcessing(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/merchants/${merchantId}/categories/${editingId}`
        : `/api/merchants/${merchantId}/categories`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name }),
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["merchant-categories", merchantId],
        });
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: "" });
        showToast(
          editingId ? "Category updated!" : "Category created!",
          "success"
        );
      } else {
        showToast(
          `Failed: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to save category", "error");
    } finally {
      setProcessing(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    showToast("Deleting category...", "info", 0);
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/merchants/${merchantId}/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["merchant-categories", merchantId],
        });
        showToast("Category deleted successfully!", "success");
      } else {
        showToast(
          `Failed: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast("Failed to delete category", "error");
    } finally {
      setProcessing(false);
    }
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

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Organize your menu items</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Category</Button>
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
                <Button type="submit" disabled={processing}>
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={processing}
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
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900">
            {categories.length}
          </p>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Menu Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="text-sm font-medium text-gray-900">
                    {category.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {category.id.slice(-8)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {category.menuCount !== undefined
                      ? `${category.menuCount} items`
                      : "-"}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-3">
                  <Button
                    type="button"
                    onClick={() => handleEdit(category)}
                    disabled={processing}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={() => deleteCategory(category.id)}
                    disabled={processing}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {categories.length === 0 && (
          <CardContent className="p-12 text-center text-gray-500">
            No categories found. Create your first category to organize your
            menu.
          </CardContent>
        )}
      </Card>
    </div>
  );
}
