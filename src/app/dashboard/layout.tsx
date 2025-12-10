"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconDashboard,
  IconPackage,
  IconChefHat,
  IconFolder,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface Merchant {
  id: string;
  name: string;
  phoneNumber: string;
  merchantNumber: number;
}

export default function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/merchants/me");
      const result = await response.json();

      if (!result.success || !result.data?.merchant) {
        router.push("/login");
        return;
      }

      setMerchant(result.data.merchant);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  const merchantData = {
    user: {
      name: merchant?.name || "Merchant",
      email: `#${merchant?.merchantNumber}`,
      avatar: "/avatars/merchant.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Orders",
        url: "/dashboard/orders",
        icon: IconPackage,
      },
      {
        title: "Menus",
        url: "/dashboard/menus",
        icon: IconChefHat,
      },
      {
        title: "Categories",
        url: "/dashboard/categories",
        icon: IconFolder,
      },
    ],
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <a href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="font-semibold">N</span>
                  </div>
                  <span className="truncate font-semibold">Ngantri</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={merchantData.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={merchantData.user} />
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-8">{children}</div>
      </div>
    </SidebarProvider>
  );
}
