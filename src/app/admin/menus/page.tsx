"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface Merchant {
  id: string;
  name: string;
}

interface AdminMenusData {
  menus: Menu[];
  merchants: Merchant[];
}

interface FormData {
  merchantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
}

export default function AdminMenusPage() {
  const [selectedMerchant, setSelectedMerchant] = useState<string>("all");
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [deleteMenuId, setDeleteMenuId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    merchantId: "",
    categoryId: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AdminMenusData>({
    queryKey: ["admin-menus"],
    queryFn: async () => {
      const [menusRes, merchantsRes] = await Promise.all([
        fetch("/api/admin/menus"),
        fetch("/api/merchants"),
      ]);

      const menusResult = await menusRes.json();
      const merchantsResult = await merchantsRes.json();

      return {
        menus: menusResult.data || [],
        merchants: merchantsResult.data?.merchants || [],
      };
    },
  });

  const menus = data?.menus ?? [];
  const merchants = data?.merchants ?? [];

  const toggleAvailability = async (menuId: string, isAvailable: boolean) => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/menus/${menuId}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAvailable }),
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      } else {
        setFormError(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      setFormError("Failed to update menu availability");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMenuId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/menus/${deleteMenuId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
        setSelectedMenu(null);
        setShowDeleteDialog(false);
        setDeleteMenuId(null);
      } else {
        setFormError(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting menu:", error);
      setFormError("Failed to delete menu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (menuId: string) => {
    setDeleteMenuId(Number(menuId));
    setShowDeleteDialog(true);
  };

  const openCreateDialog = async () => {
    setEditingMenu(null);
    setFormData({
      merchantId: "",
      categoryId: "",
      name: "",
      description: "",
      price: "",
      imageUrl: "",
    });
    setFormError("");
    setShowCreateDialog(true);
  };

  const openEditDialog = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      merchantId: String(menu.merchantId),
      categoryId: String(menu.categoryId),
      name: menu.name,
      description: menu.description || "",
      price: String(menu.price),
      imageUrl: menu.imageUrl || "",
    });
    setFormError("");
    setShowEditDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const price = Number.parseFloat(String(formData.price));
      if (Number.isNaN(price) || price < 0) {
        setFormError("Price must be a valid positive number");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        price,
      };

      const url = editingMenu
        ? `/api/admin/menus/${editingMenu.id}`
        : "/api/admin/menus/create";
      const method = editingMenu ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
        setShowCreateDialog(false);
        setShowEditDialog(false);
        setFormData({
          merchantId: "",
          categoryId: "",
          name: "",
          description: "",
          price: "",
          imageUrl: "",
        });
        setEditingMenu(null);
      } else {
        setFormError(`Failed: ${result.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving menu:", error);
      setFormError("Failed to save menu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenus =
    selectedMerchant === "all"
      ? menus
      : menus.filter((m) => m.merchantId === selectedMerchant);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
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
          <button
            type="button"
            onClick={openCreateDialog}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Menu</span>
          </button>
          <button
            type="button"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["admin-menus"] })
            }
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
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
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Menus</p>
          <p className="text-2xl font-bold text-gray-900">{menus.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {menus.filter((m) => m.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-red-600">
            {menus.filter((m) => !m.isAvailable).length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <label
          htmlFor="merchantFilter"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filter by Merchant
        </label>
        <select
          id="merchantFilter"
          value={selectedMerchant}
          onChange={(e) => setSelectedMerchant(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Merchants</option>
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {menu.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menu.imageUrl}
                alt={menu.name}
                className="w-full h-48 object-cover"
              />
            )}
            {!menu.imageUrl && (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>No Image</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {menu.name}
                  </h3>
                  <p className="text-sm text-gray-600">{menu.merchantName}</p>
                  <p className="text-xs text-gray-500">{menu.categoryName}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    menu.isAvailable
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {menu.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              {menu.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {menu.description}
                </p>
              )}

              <p className="text-xl font-bold text-indigo-600 mb-3">
                Rp {menu.price.toLocaleString("id-ID")}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMenu(menu)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => toggleAvailability(menu.id, !menu.isAvailable)}
                  disabled={processing}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium ${
                    menu.isAvailable
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } disabled:opacity-50`}
                >
                  {menu.isAvailable ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenus.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No menus found
        </div>
      )}

      {/* Menu Details Modal */}
      {selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedMenu.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedMenu(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Close</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedMenu.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMenu.imageUrl}
                  alt={selectedMenu.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Merchant</p>
                  <p className="font-medium text-gray-900">
                    {selectedMenu.merchantName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">
                    {selectedMenu.categoryName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    Rp {selectedMenu.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedMenu.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedMenu.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                {selectedMenu.description && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Description</p>
                    <p className="font-medium text-gray-900">
                      {selectedMenu.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>

                <button
                  type="button"
                  onClick={() => openEditDialog(selectedMenu)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Menu
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleAvailability(
                      selectedMenu.id,
                      !selectedMenu.isAvailable
                    );
                    setSelectedMenu(null);
                  }}
                  disabled={processing}
                  className={`w-full px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
                    selectedMenu.isAvailable
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {selectedMenu.isAvailable
                    ? "Set as Unavailable"
                    : "Set as Available"}
                </button>

                <button
                  type="button"
                  onClick={() => openDeleteDialog(selectedMenu.id)}
                  disabled={processing}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            setFormError("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "Edit Menu" : "Create New Menu"}
            </DialogTitle>
            <DialogDescription>
              {editingMenu
                ? "Update the menu details below"
                : "Add a new menu item to your store"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merchant
              </label>
              <select
                value={formData.merchantId}
                onChange={(e) =>
                  setFormData({ ...formData, merchantId: e.target.value })
                }
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              >
                <option value="">Select a merchant</option>
                {merchants?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              >
                <option value="">Select a category</option>
                {/* Categories would be filtered based on selected merchant */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isSubmitting}
                placeholder="Menu item name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="Optional description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (Rp) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                disabled={isSubmitting}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateDialog(false);
                  setShowEditDialog(false);
                  setFormError("");
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : editingMenu ? (
                  "Update Menu"
                ) : (
                  "Create Menu"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this menu? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
