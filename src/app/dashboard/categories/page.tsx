"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  menuCount?: number;
}

export default function MerchantCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const merchantResponse = await fetch("/api/merchants/me");
      const merchantResult = await merchantResponse.json();

      if (!merchantResult.success) {
        router.push("/login");
        return;
      }

      const merchantId = merchantResult.data.merchant.id;
      const response = await fetch(`/api/merchants/${merchantId}/categories`);
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

  const deleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This will also affect all menus in this category."
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const merchantResponse = await fetch("/api/merchants/me");
      const merchantResult = await merchantResponse.json();
      const merchantId = merchantResult.data.merchant.id;

      const response = await fetch(
        `/api/merchants/${merchantId}/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        fetchCategories();
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
          onClick={fetchCategories}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
