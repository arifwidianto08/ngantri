"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  Store,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

interface DashboardData {
  merchant: Merchant;
  stats: Stats;
  ordersByStatus: OrderStatus[];
  revenueByDay: RevenueDay[];
}

export default function MerchantDashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["merchant-dashboard"],
    queryFn: async () => {
      // Fetch merchant info
      const merchantResponse = await fetch("/api/merchants/me");
      const merchantResult = await merchantResponse.json();

      if (!merchantResult.success) {
        throw new Error("Failed to fetch merchant info");
      }

      // Fetch stats
      const statsResponse = await fetch("/api/merchants/dashboard/stats");
      const statsResult = await statsResponse.json();

      if (!statsResult.success) {
        throw new Error("Failed to fetch stats");
      }

      return {
        merchant: merchantResult.data.merchant,
        stats: statsResult.data.stats,
        ordersByStatus: statsResult.data.ordersByStatus,
        revenueByDay: statsResult.data.revenueByDay,
      };
    },
  });

  const merchant = data?.merchant;
  const stats = data?.stats;
  const ordersByStatus = data?.ordersByStatus || [];
  const revenueByDay = data?.revenueByDay || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading dashboard</p>
          <p className="text-gray-600 text-sm mt-1">
            Please try refreshing the page
          </p>
        </div>
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
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-start gap-6">
            {merchant.imageUrl ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200">
                <Image
                  src={merchant.imageUrl}
                  alt={merchant.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                <Store className="w-12 h-12 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {merchant.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    merchant.isAvailable
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {merchant.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Merchant Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    #{merchant.merchantNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {merchant.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Merchant ID</p>
                  <p className="text-lg font-semibold font-mono text-gray-900">
                    {merchant.id.slice(0, 8)}...
                  </p>
                </div>
              </div>

              {merchant.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-base text-gray-900">
                    {merchant.description}
                  </p>
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
              <ShoppingCart className="w-6 h-6 text-blue-600" />
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
              <DollarSign className="w-6 h-6 text-green-600" />
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
              <Clock className="w-6 h-6 text-orange-600" />
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
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Orders by Status
          </h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus.map((item) => ({
                    ...item,
                    name: item.status,
                    value: item.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {ordersByStatus.map((item) => {
                    const colors: Record<string, string> = {
                      completed: "#22c55e",
                      pending: "#f97316",
                      cancelled: "#ef4444",
                      accepted: "#3b82f6",
                      preparing: "#a855f7",
                      ready: "#06b6d4",
                    };
                    return (
                      <Cell
                        key={`cell-${item.status}`}
                        fill={colors[item.status] || "#8b5cf6"}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value} orders`}
                  labelFormatter={(label) => `${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">
              No order data available
            </p>
          )}
        </div>

        {/* Revenue by Day - Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue (Last 7 Days)
          </h3>
          {revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000000)
                      return `Rp${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}K`;
                    return `Rp${value}`;
                  }}
                />
                <Tooltip
                  formatter={(value) =>
                    `Rp ${Number(value).toLocaleString("id-ID")}`
                  }
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("id-ID")
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">
              No revenue data available
            </p>
          )}
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
