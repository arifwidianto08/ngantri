import { z } from "zod";

// Merchant validation schemas
export const createMerchantSchema = z.object({
  phone_number: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export const updateMerchantSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  is_available: z.boolean().optional(),
});

export const loginMerchantSchema = z.object({
  phone_number: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format"),
  password: z.string().min(1, "Password is required"),
});

// Menu validation schemas
export const createMenuCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name too long"),
});

export const createMenuSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  name: z
    .string()
    .min(1, "Menu name is required")
    .max(100, "Menu name too long"),
  description: z.string().max(500, "Description too long").optional(),
  price: z.number().int().min(0, "Price must be non-negative"),
  is_available: z.boolean().optional().default(true),
});

export const updateMenuSchema = z.object({
  name: z
    .string()
    .min(1, "Menu name is required")
    .max(100, "Menu name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  price: z.number().int().min(0, "Price must be non-negative").optional(),
  is_available: z.boolean().optional(),
});

// Session and cart validation schemas
export const createSessionSchema = z.object({
  table_number: z.number().int().min(1).optional(),
});

export const addCartItemSchema = z.object({
  menu_id: z.string().uuid("Invalid menu ID"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity too large"),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity too large"),
});

// Order validation schemas
export const createOrderSchema = z.object({
  customer_name: z
    .string()
    .min(1, "Customer name is required")
    .max(100, "Name too long")
    .optional(),
  customer_phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "accepted",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ]),
});

// File upload validation
export const imageUploadSchema = z.object({
  file: z.any().refine((file) => {
    if (!file) return false;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    return allowedTypes.includes(file.type);
  }, "Invalid file type. Only JPEG, PNG, and WebP are allowed"),
});

// Pagination validation
export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// Currency formatting for IDR
export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Parse IDR string to integer
export const parseIDR = (idrString: string): number => {
  // Remove currency symbols and formatting, return integer
  const cleaned = idrString.replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
};

// UUID v7 validation
export const isValidUUIDv7 = (uuid: string): boolean => {
  const uuidv7Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidv7Regex.test(uuid);
};

// Phone number utilities
export const formatPhoneNumber = (phone: string): string => {
  // Ensure the phone number starts with + and is properly formatted
  if (!phone.startsWith("+")) {
    return `+${phone}`;
  }
  return phone;
};

// Error response helper
export const createErrorResponse = (error: string, status: number = 400) => {
  return {
    success: false,
    error,
    status,
  };
};

// Success response helper
export const createSuccessResponse = <T>(data: T, status: number = 200) => {
  return {
    success: true,
    data,
    status,
  };
};
