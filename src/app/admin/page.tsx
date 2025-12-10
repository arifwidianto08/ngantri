"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

  const ordersChartConfig = {
    count: { label: "Orders", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  const revenueChartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

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
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
            <p className="text-3xl font-bold mb-4">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">
              Trending up this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="total-revenue-stat">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-3xl font-bold mb-4">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">
              Strong performance this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
            <p className="text-3xl font-bold mb-4">{stats.pendingOrders}</p>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Completed Orders
            </p>
            <p className="text-3xl font-bold mb-4">{stats.completedOrders}</p>
            <p className="text-xs text-muted-foreground">
              Excellent completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Total Merchants
            </p>
            <p className="text-3xl font-bold mb-4">{stats.totalMerchants}</p>
            <p className="text-xs text-muted-foreground">
              Active merchant count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Total Categories
            </p>
            <p className="text-3xl font-bold mb-4">{stats.totalCategories}</p>
            <p className="text-xs text-muted-foreground">
              Growing menu variety
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Menus</p>
            <p className="text-3xl font-bold mb-4">{stats.totalMenus}</p>
            <p className="text-xs text-muted-foreground">
              Diverse menu offerings
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
          <CardContent className="p-0">
            <ChartContainer
              config={ordersChartConfig}
              className="h-[300px] w-full px-6 pb-6"
            >
              <AreaChart data={stats.ordersByStatus}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    STATUS_LABELS[value as string] || value
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent labelKey="status" indicator="dot" />
                  }
                />
                <Area
                  dataKey="count"
                  type="natural"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--primary))"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Revenue (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer
              config={revenueChartConfig}
              className="h-[300px] w-full px-6 pb-6"
            >
              <BarChart
                data={stats.revenueByDay.slice(0, 7).map((item) => ({
                  date: new Date(item.date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  }),
                  revenue: item.revenue,
                }))}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}K`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent labelKey="date" indicator="dot" />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            </ChartContainer>
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
