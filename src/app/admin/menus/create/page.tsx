"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Merchant {
  id: string;
  name: string;
}

interface Category {
  id: string;
  merchantId: string;
  name: string;
  merchantName?: string;
}

interface FormData {
  merchantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
}

export default function CreateMenuPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    merchantId: "",
    categoryId: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: merchantsResponse } = useQuery<{
    success: boolean;
    data: Merchant[];
  }>({
    queryKey: ["merchants"],
    queryFn: async () => {
      const res = await fetch("/api/merchants");
      if (!res.ok) throw new Error("Failed to fetch merchants");
      return res.json();
    },
  });
  const { data: categoriesResponse } = useQuery<{
    success: boolean;
    data: Category[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  }>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories?page=1&pageSize=1000");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const allCategories = categoriesResponse?.data ?? [];
  const filteredCategories = allCategories.filter(
    (cat) => cat.merchantId === formData.merchantId
  );

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

      const response = await fetch("/api/admin/menus/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
        router.push("/admin/menus");
      } else {
        setFormError(
          `Failed: ${
            result?.error || result?.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error creating menu:", error);
      setFormError("Failed to create menu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Menus
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Menu
          </h1>
          <p className="text-gray-600 mb-6">
            Add a new menu item to your store
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant
                </label>
                <select
                  value={formData.merchantId}
                  onChange={(e) =>
                    setFormData({ ...formData, merchantId: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select a merchant</option>
                  {merchantsResponse?.data?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  required
                  disabled={isSubmitting || !formData.merchantId}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select a category</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="e.g., Nasi Goreng"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (IDR)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="e.g., 25000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="Describe your menu item..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50"
              />
              {formData.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="mt-4 h-40 w-40 object-cover rounded-lg mx-auto"
                />
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Menu"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
