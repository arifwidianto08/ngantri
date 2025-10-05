import { Merchant, NewMerchant } from "../schema";

export interface MerchantRepository {
  // Create operations
  create(merchant: NewMerchant): Promise<Merchant>;

  // Read operations with cursor-based pagination
  findById(id: string): Promise<Merchant | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Merchant | null>;
  findByMerchantNumber(merchantNumber: number): Promise<Merchant | null>;
  findAll(options?: {
    cursor?: string;
    limit?: number;
    isAvailable?: boolean;
  }): Promise<{
    data: Merchant[];
    nextCursor?: string;
    hasMore: boolean;
  }>;

  // Update operations
  update(
    id: string,
    updates: Partial<Omit<Merchant, "id" | "createdAt">>
  ): Promise<Merchant | null>;
  updateAvailability(
    id: string,
    isAvailable: boolean
  ): Promise<Merchant | null>;

  // Delete operations (soft delete)
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<Merchant | null>;

  // Utility operations
  exists(phoneNumber: string): Promise<boolean>;
  getNextMerchantNumber(): Promise<number>;
  count(options?: { isAvailable?: boolean }): Promise<number>;
}
