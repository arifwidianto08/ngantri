"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Merchant {
  id: string;
  name: string;
  phoneNumber: string;
  merchantNumber: number;
  imageUrl?: string;
  description?: string;
  isAvailable: boolean;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalMenus: number;
  availableMenus: number;
  totalCategories: number;
}

interface OrderStatus {
  status: string;
  count: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
}

export default function MerchantDashboard() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<OrderStatus[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<RevenueDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch merchant info
      const merchantResponse = await fetch("/api/merchants/me");
      const merchantResult = await merchantResponse.json();

      if (merchantResult.success) {
        setMerchant(merchantResult.data.merchant);
      }

      // Fetch stats
      const statsResponse = await fetch("/api/merchants/dashboard/stats");
      const statsResult = await statsResponse.json();

      if (statsResult.success) {
        setStats(statsResult.data.stats);
        setOrdersByStatus(statsResult.data.ordersByStatus);
        setRevenueByDay(statsResult.data.revenueByDay);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your business performance
        </p>
      </div>

      {/* Merchant Profile Card */}
      {merchant && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-start gap-6">
            {merchant.imageUrl ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-4 border-white/20">
                <Image
                  src={merchant.imageUrl}
                  alt={merchant.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 border-4 border-white/20">
                <span className="text-4xl">🏪</span>
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{merchant.name}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    merchant.isAvailable
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {merchant.isAvailable ? "🟢 Available" : "🔴 Unavailable"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-white/80">Merchant Number</p>
                  <p className="text-lg font-semibold">
                    #{merchant.merchantNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/80">Phone Number</p>
                  <p className="text-lg font-semibold">
                    {merchant.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/80">Merchant ID</p>
                  <p className="text-sm font-mono">
                    {merchant.id.slice(0, 8)}...
                  </p>
                </div>
              </div>

              {merchant.description && (
                <div className="mt-4">
                  <p className="text-sm text-white/80">Description</p>
                  <p className="text-base">{merchant.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalOrders || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats?.pendingOrders || 0}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.completedOrders || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Orders by Status
          </h3>
          <div className="space-y-3">
            {ordersByStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.count} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === "completed"
                          ? "bg-green-500"
                          : item.status === "pending"
                          ? "bg-orange-500"
                          : item.status === "cancelled"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${
                          (item.count / (stats?.totalOrders || 1)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {ordersByStatus.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No order data available
              </p>
            )}
          </div>
        </div>

        {/* Revenue by Day */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue (Last 7 Days)
          </h3>
          <div className="space-y-2">
            {revenueByDay.map((item) => (
              <div
                key={item.date}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {new Date(item.date).toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
            {revenueByDay.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No revenue data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Menu Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Menus</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.totalMenus || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Available Menus</p>
          <p className="text-3xl font-bold text-green-600">
            {stats?.availableMenus || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Categories</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.totalCategories || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
