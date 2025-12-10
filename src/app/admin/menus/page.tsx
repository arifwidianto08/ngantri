"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Menu {
  id: string;
  merchantId: string;
  merchantName?: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  imageUrl?: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
}

interface MenusResponse {
  success: boolean;
  data: Menu[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface Merchant {
  id: string;
  name: string;
}

export default function AdminMenusPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedMerchant, setSelectedMerchant] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Query: Fetch menus with pagination
  const {
    data: menusResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<MenusResponse>({
    queryKey: ["admin-menus", page, pageSize],
    queryFn: async () => {
      const url = new URL("/api/admin/menus", window.location.origin);
      url.searchParams.append("page", String(page));
      url.searchParams.append("pageSize", String(pageSize));
      const response = await fetch(url);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch menus");
      }
      return result;
    },
  });

  // Query: Fetch merchants for filter
  const { data: merchantsResponse } = useQuery({
    queryKey: ["merchants-list"],
    queryFn: async () => {
      const res = await fetch("/api/merchants");
      return res.json();
    },
  });

  const allMenus = menusResponse?.data ?? [];
  const pagination = menusResponse?.pagination ?? {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  };
  const merchants = merchantsResponse?.data ?? [];

  // Mutation: Toggle menu availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (variables: { menuId: string; isAvailable: boolean }) => {
      const response = await fetch(
        `/api/admin/menus/${variables.menuId}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable: variables.isAvailable }),
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result.error?.message || "Failed to update availability"
        );
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      toast({
        title: "Success",
        description: "Menu availability updated!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete menu
  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const response = await fetch(`/api/admin/menus/${menuId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete menu");
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      setDeleteId(null);
      toast({
        title: "Menu deleted",
        description: "The menu has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (menuId: string) => {
    setDeleteId(menuId);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMenuMutation.mutate(deleteId);
  };

  // Filter menus by merchant
  const filteredMenus =
    selectedMerchant === "all"
      ? allMenus
      : allMenus.filter((m) => m.merchantId === selectedMerchant);

  /* --------------------------------
     Loading State
  ----------------------------------*/
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading menus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menus Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all menus across all merchants
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push("/admin/menus/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Menu</span>
          </Button>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Menus</p>
          <p className="text-2xl font-bold text-gray-900">
            {pagination.totalCount}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-gray-900">
            {allMenus.filter((m) => m.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-gray-900">
            {allMenus.filter((m) => !m.isAvailable).length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <label
          htmlFor="merchantFilter"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filter by Merchant
        </label>
        <select
          id="merchantFilter"
          value={selectedMerchant}
          onChange={(e) => {
            setSelectedMerchant(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
        >
          <option value="all">All Merchants</option>
          {merchants.map((merchant: Merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.name}
            </option>
          ))}
        </select>
      </Card>

      {/* Menus Table */}
      <Card>
        {isLoading ? (
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
              <p className="text-gray-600">Loading menus...</p>
            </div>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMenus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {menu.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {menu.merchantName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {menu.categoryName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Rp {menu.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={menu.isAvailable ? "default" : "destructive"}
                      >
                        {menu.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => router.push(`/admin/menus/${menu.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          Details
                        </Button>
                        <Button
                          onClick={() =>
                            toggleAvailabilityMutation.mutate({
                              menuId: menu.id,
                              isAvailable: !menu.isAvailable,
                            })
                          }
                          disabled={toggleAvailabilityMutation.isPending}
                          variant={menu.isAvailable ? "destructive" : "default"}
                          size="sm"
                        >
                          {menu.isAvailable ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(menu.id)}
                          disabled={deleteMenuMutation.isPending}
                          variant="destructive"
                          size="sm"
                        >
                          {deleteMenuMutation.isPending
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredMenus.length === 0 && (
          <CardContent className="p-12 text-center text-gray-500">
            No menus found
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && filteredMenus.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg shadow flex-wrap gap-4">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} (Total:{" "}
            {pagination.totalCount} menus)
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-600">
                Per page:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <Button
                onClick={() =>
                  setPage(Math.min(pagination.totalPages || 1, page + 1))
                }
                disabled={page === pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Menu"
        description="Are you sure you want to delete this menu? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteMenuMutation.isPending}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
