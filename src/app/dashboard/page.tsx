"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Merchant {
  id: string;
  name: string;
  phoneNumber: string;
  merchantNumber: number;
  imageUrl?: string;
  description?: string;
  isAvailable: boolean;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  sessionId: string;
}

interface MenuCategory {
  id: string;
  name: string;
  merchantId: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: string;
}

export default function MerchantDashboard() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "profile">(
    "orders"
  );
  const router = useRouter();

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await fetch("/api/merchants/me");
      const result = await response.json();

      if (result.success && result.data.merchant) {
        setMerchant(result.data.merchant);
      } else {
        // Not authenticated, redirect to login
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      router.push("/login");
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const handleLogout = async () => {
    try {
      await fetch("/api/merchants/logout", {
        method: "POST",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!merchant?.id) return; // Don't fetch if no merchant authenticated

    setLoading(true);
    try {
      const response = await fetch(`/api/orders`);
      if (response.ok) {
        const result = await response.json();
        setOrders(result.data || []);
      } else if (response.status === 401) {
        // Session expired, redirect to login
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [merchant?.id, router]);

  const fetchCategories = useCallback(async () => {
    if (!merchant?.id) return; // Don't fetch if no merchant authenticated

    try {
      const response = await fetch(`/api/merchants/${merchant.id}/categories`);
      if (response.ok) {
        const result = await response.json();
        setCategories(result.data?.categories || []);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [merchant?.id, router]);

  const fetchMenuItems = useCallback(async () => {
    if (!merchant?.id) return; // Don't fetch if no merchant authenticated

    try {
      const response = await fetch(`/api/merchants/${merchant.id}/menus`);
      if (response.ok) {
        const result = await response.json();
        setMenuItems(result.data?.menus || []);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  }, [merchant?.id, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh orders list to show updated status
        fetchOrders();
      } else {
        alert("Failed to update order status: " + result.error);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  // Fetch data when merchant is loaded
  useEffect(() => {
    if (merchant?.id) {
      fetchOrders();
      fetchCategories();
      fetchMenuItems();
    }
  }, [merchant?.id, fetchOrders, fetchCategories, fetchMenuItems]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Merchant Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {merchant
              ? `Welcome, ${merchant.name}`
              : "Manage your menu, orders, and business data"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📋 Orders
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "menu"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🍽️ Menu Management
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🏪 Profile
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Incoming Orders</h2>
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Refresh Orders"}
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">📝 No orders yet</p>
                  <p className="text-sm mt-1">
                    Orders will appear here when customers place them
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 bg-white shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium">
                            Order #{order.id.slice(-8)}
                          </h3>
                          {order.customerName && (
                            <p className="text-sm text-gray-600">
                              Customer: {order.customerName}
                            </p>
                          )}
                          {order.customerPhone && (
                            <p className="text-sm text-gray-600">
                              Phone: {order.customerPhone}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(order.totalAmount)}
                          </div>
                          <div
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "accepted"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "preparing"
                                ? "bg-orange-100 text-orange-800"
                                : order.status === "ready"
                                ? "bg-green-100 text-green-800"
                                : order.status === "completed"
                                ? "bg-gray-100 text-gray-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </div>
                        </div>
                      </div>

                      {/* Status Update Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                updateOrderStatus(order.id, "accepted")
                              }
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                updateOrderStatus(order.id, "cancelled")
                              }
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {order.status === "accepted" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "preparing")
                            }
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Start Preparing
                          </button>
                        )}

                        {order.status === "preparing" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Mark Ready
                          </button>
                        )}

                        {order.status === "ready" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "completed")
                            }
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "menu" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Menu Management</h2>
                <div className="space-x-2">
                  <button
                    onClick={fetchCategories}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Refresh Categories
                  </button>
                  <button
                    onClick={fetchMenuItems}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Refresh Menu
                  </button>
                </div>
              </div>

              {/* Categories Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">
                  Categories ({categories.length})
                </h3>
                {categories.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No categories found. Create your first category to organize
                    your menu.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="bg-white p-3 rounded border"
                      >
                        <div className="font-medium text-sm">
                          {category.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Items Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">
                  Menu Items ({menuItems.length})
                </h3>
                {menuItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No menu items found. Add your first menu item to get
                    started.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-4 rounded border flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-lg font-semibold text-green-600">
                              {formatCurrency(item.price)}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.isAvailable
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.isAvailable ? "Available" : "Unavailable"}
                            </span>
                          </div>
                        </div>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded ml-4"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Merchant Profile</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">🏪 Merchant Profile</p>
                  <p className="text-sm mt-1">
                    Merchant ID:{" "}
                    <code className="bg-gray-200 px-2 py-1 rounded">
                      {merchant?.id || "Not loaded"}
                    </code>
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Name:</strong> {merchant?.name || "Not loaded"}
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong>{" "}
                    {merchant?.phoneNumber || "Not loaded"}
                  </p>
                  <p className="text-xs mt-2">
                    Profile management features coming soon...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-2">🔧 System Status</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Backend API:</strong> ✅ Ready
          </div>
          <div>
            <strong>Database:</strong> ✅ Connected
          </div>
          <div>
            <strong>Features:</strong> Orders, Menu, Categories
          </div>
        </div>
      </div>
    </div>
  );
}
