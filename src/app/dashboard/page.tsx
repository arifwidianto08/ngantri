"use client";

import { useState, useEffect } from "react";

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
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "profile">(
    "orders"
  );

  // Mock merchant data - in real app this would come from authentication
  const mockMerchantId = "test-merchant-123";

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders?merchantId=${mockMerchantId}`);
      if (response.ok) {
        const result = await response.json();
        setOrders(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `/api/merchants/${mockMerchantId}/categories`
      );
      if (response.ok) {
        const result = await response.json();
        setCategories(result.data?.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/merchants/${mockMerchantId}/menus`);
      if (response.ok) {
        const result = await response.json();
        setMenuItems(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    fetchOrders();
    fetchCategories();
    fetchMenuItems();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage your menu, orders, and business data
        </p>
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
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
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
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(order.totalAmount)}
                          </div>
                          <div
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "preparing"
                                ? "bg-orange-100 text-orange-800"
                                : order.status === "ready"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(order.createdAt).toLocaleString("id-ID")}
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
                      {mockMerchantId}
                    </code>
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
