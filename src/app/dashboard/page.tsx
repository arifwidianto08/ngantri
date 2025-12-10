"use client";

import Image from "next/image";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Store, Loader2, BadgeCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function MerchantDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } =
    useQuery<DashboardData>({
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border border-gray-300 border-t-gray-900 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading...</p>
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
          <p className="text-sm text-gray-600 mt-1">
            Your business at a glance
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

      {/* Merchant Profile */}
      {merchant && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {merchant.imageUrl ? (
                <div className="relative w-20 h-20 rounded flex-shrink-0 overflow-hidden">
                  <Image
                    src={merchant.imageUrl}
                    alt={merchant.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Store className="w-10 h-10 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {merchant.name}
                  </h2>

                  <Badge variant="default">
                    {merchant.isAvailable && (
                      <BadgeCheck className="fill-blue-600" />
                    )}
                    {merchant.isAvailable ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-600">Merchant #</p>
                    <p className="font-medium text-gray-900">
                      {merchant.merchantNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">
                      {merchant.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">ID</p>
                    <p className="font-medium text-gray-900">
                      {merchant.id.slice(0, 12)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
            <p className="text-3xl font-bold mb-4">{stats?.totalOrders || 0}</p>
            <p className="text-xs text-muted-foreground">
              Trending up this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-3xl font-bold mb-4">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Strong performance this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-3xl font-bold mb-4">
              {stats?.pendingOrders || 0}
            </p>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-3xl font-bold mb-4">
              {stats?.completedOrders || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Excellent completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Menus</p>
            <p className="text-3xl font-bold mb-4">{stats?.totalMenus || 0}</p>
            <p className="text-xs text-muted-foreground">Menu availability</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Available</p>
            <p className="text-3xl font-bold mb-4">
              {stats?.availableMenus || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Currently active items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Categories</p>
            <p className="text-3xl font-bold mb-4">
              {stats?.totalCategories || 0}
            </p>
            <p className="text-xs text-muted-foreground">Menu organization</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersByStatus.length > 0 ? (
              <ChartContainer
                config={ordersChartConfig}
                className="h-[300px] w-full px-6 pb-6"
              >
                <AreaChart data={ordersByStatus}>
                  <defs>
                    <linearGradient
                      id="fillOrdersMerchant"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
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
                    fill="url(#fillOrdersMerchant)"
                    stroke="hsl(var(--primary))"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {revenueByDay.length > 0 ? (
              <ChartContainer
                config={revenueChartConfig}
                className="h-[300px] w-full px-6 pb-6"
              >
                <BarChart
                  data={revenueByDay.map((item) => ({
                    date: new Date(item.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    }),
                    revenue: item.revenue,
                  }))}
                >
                  <defs>
                    <linearGradient
                      id="fillRevenueMerchant"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={1}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
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
                    tickFormatter={(value) =>
                      `Rp ${(value / 1000).toFixed(0)}K`
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent labelKey="date" indicator="dot" />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#fillRevenueMerchant)"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
