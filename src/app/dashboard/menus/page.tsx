"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const router = useRouter();

  useEffect(() => {
    fetchMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMenus = async () => {
    try {
      const merchantResponse = await fetch("/api/merchants/me");
      const merchantResult = await merchantResponse.json();

      if (!merchantResult.success) {
        router.push("/login");
        return;
      }

      const merchantId = merchantResult.data.merchant.id;
      const response = await fetch(`/api/merchants/${merchantId}/menus`);
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
      const merchantResponse = await fetch("/api/merchants/me");
      const merchantResult = await merchantResponse.json();
      const merchantId = merchantResult.data.merchant.id;

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
        fetchMenus();
        alert("Menu availability updated!");
      } else {
        alert(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating menu:", error);
      alert("Failed to update menu");
    } finally {
      setProcessing(false);
    }
  };

  const deleteMenu = async (menuId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    setProcessing(true);
    try {
      const merchantResponse = await fetch("/api/merchants/me");
      const merchantResult = await merchantResponse.json();
      const merchantId = merchantResult.data.merchant.id;

      const response = await fetch(
        `/api/merchants/${merchantId}/menus/${menuId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        fetchMenus();
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
          onClick={fetchMenus}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Refresh
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
                <span className="text-4xl">🍽️</span>
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
