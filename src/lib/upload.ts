import multer from "multer";
import path from "path";
import { v7 as uuidv7 } from "uuid";
import { NextRequest } from "next/server";

// Allowed file types for uploads
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Storage configuration for merchant profile images
const merchantImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/merchants/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv7()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Storage configuration for menu item images
const menuImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/menus/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv7()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter function
const fileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${ALLOWED_IMAGE_TYPES.join(", ")} are allowed.`
      )
    );
  }
};

// Multer configurations
export const merchantImageUpload = multer({
  storage: merchantImageStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const menuImageUpload = multer({
  storage: menuImageStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Utility functions for handling file uploads in Next.js API routes
export interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export const validateImageFile = (
  file: Express.Multer.File
): { valid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Only ${ALLOWED_IMAGE_TYPES.join(
        ", "
      )} are allowed.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`,
    };
  }

  return { valid: true };
};

// Helper to extract file from form data
export const extractFileFromFormData = async (
  request: NextRequest
): Promise<File | null> => {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    return file;
  } catch {
    return null;
  }
};

// Convert Next.js File to Express.Multer.File format for validation
export const convertToMulterFile = (file: File): Express.Multer.File => {
  return {
    fieldname: "image",
    originalname: file.name,
    encoding: "7bit",
    mimetype: file.type,
    size: file.size,
    buffer: Buffer.from(""), // Will be filled when processing
    destination: "",
    filename: "",
    path: "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream: null as any,
  };
};

// Generate file path for static serving
export const generateFilePath = (
  fileName: string,
  type: "merchant" | "menu"
): string => {
  return `/uploads/${type}s/${fileName}`;
};

// Clean up uploaded file (in case of errors)
export const cleanupFile = async (filePath: string): Promise<void> => {
  try {
    const fs = await import("fs/promises");
    await fs.unlink(path.join(process.cwd(), "public", filePath));
  } catch (error) {
    console.error("Failed to cleanup file:", error);
  }
};

// Validate file extension
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Check if file extension is allowed
export const isAllowedExtension = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  return allowedExtensions.includes(ext);
};

// Generate unique filename with UUID
export const generateUniqueFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  return `${uuidv7()}${ext}`;
};

// File upload configuration constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  MERCHANT_UPLOAD_DIR: "public/uploads/merchants/",
  MENU_UPLOAD_DIR: "public/uploads/menus/",
  STATIC_MERCHANT_PATH: "/uploads/merchants/",
  STATIC_MENU_PATH: "/uploads/menus/",
} as const;
