"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMerchantIdFromStorage,
  setMerchantIdInStorage,
} from "@/lib/merchant-client";
import { useToast } from "@/components/toast-provider";

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

  useEffect(() => {
    const initializeMerchantId = async () => {
      // Try to get from storage first (no network call)
      let id = getMerchantIdFromStorage();

      if (!id) {
        // If not in storage, fetch and cache it
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

      setMerchantId(id);
      await fetchCategories(id);
    };

    initializeMerchantId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchCategories = async (id: string) => {
    try {
      const response = await fetch(`/api/merchants/${id}/categories`);
      const result = await response.json();

      if (result.success) {
        setCategories(result.data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

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
        await fetchCategories(merchantId);
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
        await fetchCategories(merchantId);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
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
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Add Category
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Category" : "Create New Category"}
          </h2>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={processing}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-600">Total Categories</p>
        <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Menu Items
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {category.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {category.id.slice(-8)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {category.menuCount !== undefined
                      ? `${category.menuCount} items`
                      : "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    disabled={processing}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category.id)}
                    disabled={processing}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No categories found. Create your first category to organize your
            menu.
          </div>
        )}
      </div>
    </div>
  );
}
