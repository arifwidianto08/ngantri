"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  IconDashboard,
  IconPackage,
  IconChefHat,
  IconFolder,
  IconBuildingStore,
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

interface AdminLayoutProps {
  children: ReactNode;
}

const adminData = {
  user: {
    name: "Admin",
    email: "admin@ngantri.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: IconPackage,
    },
    {
      title: "Merchants",
      url: "/admin/merchants",
      icon: IconBuildingStore,
    },
    {
      title: "Menus",
      url: "/admin/menus",
      icon: IconChefHat,
    },
    {
      title: "Categories",
      url: "/admin/categories",
      icon: IconFolder,
    },
  ],
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoginPage, setIsLoginPage] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const isLogin =
        typeof window !== "undefined" &&
        window.location.pathname === "/admin/login";
      setIsLoginPage(isLogin);

      if (isLogin) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/me");
        if (!response.ok) {
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                <a href="/admin">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="font-semibold">N</span>
                  </div>
                  <span className="truncate font-semibold">Ngantri Admin</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={adminData.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={adminData.user} onLogout={handleLogout} />
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-8">{children}</div>
      </div>
    </SidebarProvider>
  );
}
