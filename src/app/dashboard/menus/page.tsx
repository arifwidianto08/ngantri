"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getMerchantIdFromStorage,
  setMerchantIdInStorage,
} from "@/lib/merchant-client";
import { useToast } from "@/components/toast-provider";

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
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [merchantId, setMerchantId] = useState<string>("");
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
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

      if (id) {
        setMerchantId(id);
        await fetchMenus(id);
        await fetchCategories(id);
      }
    };

    initializeMerchantId();
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
    }
  };

  const fetchMenus = async (id: string) => {
    try {
      const response = await fetch(`/api/merchants/${id}/menus`);
      const result = await response.json();

      if (result.success) {
        setMenus(result.data.menus || []);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (menuId: string, isAvailable: boolean) => {
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/merchants/${merchantId}/menus/${menuId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable }),
        }
      );

      const result = await response.json();

      if (result.success) {
        await fetchMenus(merchantId);
        showToast("Menu availability updated!", "success");
      } else {
        showToast(
          `Failed: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating menu:", error);
      showToast("Failed to update menu", "error");
    } finally {
      setProcessing(false);
    }
  };

  const deleteMenu = async (menuId: string) => {
    showToast("Deleting menu item...", "info", 0);
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/merchants/${merchantId}/menus/${menuId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        await fetchMenus(merchantId);
        showToast("Menu deleted successfully!", "success");
      } else {
        showToast(
          `Failed: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting menu:", error);
      showToast("Failed to delete menu", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      showToast("Name, price, and category are required", "warning");
      return;
    }

    setProcessing(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/merchants/${merchantId}/menus/${editingId}`
        : `/api/merchants/${merchantId}/menus`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: Number.parseFloat(formData.price),
          categoryId: formData.categoryId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchMenus(merchantId);
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: "", description: "", price: "", categoryId: "" });
        showToast(editingId ? "Menu updated!" : "Menu created!", "success");
      } else {
        showToast(
          `Failed: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to save menu", "error");
    } finally {
      setProcessing(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Menus</h1>
          <p className="text-gray-600 mt-1">Manage your menu items</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Add Menu
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Menu" : "Create New Menu"}
          </h2>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
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

      {/* Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
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
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {menu.description}
                </p>
              )}

              <p className="text-xl font-bold text-green-600 mb-3">
                {formatCurrency(menu.price)}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(menu)}
                  disabled={processing}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleAvailability(menu.id, !menu.isAvailable)}
                  disabled={processing}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium ${
                    menu.isAvailable
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } disabled:opacity-50`}
                >
                  {menu.isAvailable ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteMenu(menu.id)}
                  disabled={processing}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menus.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No menu items found. Create your first menu item to get started.
        </div>
      )}
    </div>
  );
}
