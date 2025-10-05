import { Merchant } from "../../data/schema";

export interface MerchantAuthResult {
  merchant: Merchant;
  sessionToken: string;
}

export interface MerchantRegistrationData {
  phoneNumber: string;
  password: string;
  name: string;
  description?: string;
}

export interface MerchantUpdateData {
  name?: string;
  description?: string;
  isAvailable?: boolean;
}

export interface MerchantService {
  // Authentication operations
  register(data: MerchantRegistrationData): Promise<MerchantAuthResult>;
  login(phoneNumber: string, password: string): Promise<MerchantAuthResult>;
  logout(sessionToken: string): Promise<boolean>;

  // Profile management
  getProfile(merchantId: string): Promise<Merchant | null>;
  updateProfile(
    merchantId: string,
    updates: MerchantUpdateData
  ): Promise<Merchant | null>;
  updateAvailability(
    merchantId: string,
    isAvailable: boolean
  ): Promise<Merchant | null>;

  // Image management
  updateProfileImage(
    merchantId: string,
    imageUrl: string
  ): Promise<Merchant | null>;

  // Public merchant data
  getPublicMerchants(options?: {
    cursor?: string;
    limit?: number;
    isAvailable?: boolean;
  }): Promise<{
    data: Omit<Merchant, "passwordHash">[];
    nextCursor?: string;
    hasMore: boolean;
  }>;

  getPublicMerchant(
    merchantId: string
  ): Promise<Omit<Merchant, "passwordHash"> | null>;

  // Session management
  validateSession(sessionToken: string): Promise<Merchant | null>;
  refreshSession(sessionToken: string): Promise<string | null>;

  // Business operations
  getMerchantStats(merchantId: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    menuItemCount: number;
    isAvailable: boolean;
  }>;
}
