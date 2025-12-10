"use client";

import { useQuery } from "@tanstack/react-query";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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
import { Loader2 } from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalMerchants: number;
  totalMenus: number;
  totalCategories: number;
  recentOrders: Array<{
    id: string;
    merchantName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const CHART_COLORS = [
  "#1f2937",
  "#374151",
  "#4b5563",
  "#6b7280",
  "#9ca3af",
  "#d1d5db",
];

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-orange-100 text-orange-800",
};

export default function AdminDashboardPage() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/stats");
      const result = await response.json();

      if (!result.success) {
        throw new Error("Failed to fetch dashboard stats");
      }

      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            Error loading dashboard
          </p>
          <p className="text-xs text-gray-600 mt-1">Please refresh the page</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your food court system
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading || isFetching}
          variant="outline"
        >
          {isLoading || isFetching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Refresh</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="total-orders-stat">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalOrders}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="total-revenue-stat">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.pendingOrders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.completedOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Total Merchants</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalMerchants}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Total Categories</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalCategories}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Total Menus</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalMenus}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.ordersByStatus.map((item) => ({
                    ...item,
                    displayStatus: STATUS_LABELS[item.status] || item.status,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => {
                    const data = stats.ordersByStatus.map((item) => ({
                      ...item,
                      displayStatus: STATUS_LABELS[item.status] || item.status,
                    }));
                    const item =
                      data[
                        (entry as unknown as Record<string, unknown>)
                          .index as number
                      ];
                    return `${item?.displayStatus} (${item?.count})`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  isAnimationActive={true}
                >
                  {stats.ordersByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={
                        CHART_COLORS[
                          stats.ordersByStatus.indexOf(entry) %
                            CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, "Orders"]}
                  contentStyle={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    padding: "12px",
                  }}
                  labelStyle={{ color: "#1f2937", fontWeight: "600" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Revenue (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.revenueByDay.slice(0, 7).map((item) => ({
                  date: new Date(item.date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  }),
                  revenue: item.revenue,
                }))}
                margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                  horizontal={true}
                />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: "13px", fontWeight: "500" }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: "13px" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}K`}
                  tick={{ fill: "#6b7280" }}
                />
                <Tooltip
                  formatter={(value) =>
                    `Rp ${(value as number).toLocaleString("id-ID")}`
                  }
                  contentStyle={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    padding: "12px",
                  }}
                  labelStyle={{ color: "#1f2937", fontWeight: "600" }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#1f2937"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentOrders.slice(0, 10).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 12)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.merchantName}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    Rp {order.totalAmount.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        STATUS_COLORS[order.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
