/**
 * Merchant service interface and implementation
 * Handles business logic for merchant operations
 */

import type { MerchantRepository } from "../data/interfaces/merchant-repository";
import type { Merchant, NewMerchant } from "../data/schema";
import type {
  PaginatedResult,
  CursorPaginationParams,
} from "../lib/pagination";
import { buildPaginatedResult } from "../lib/pagination";
import { AppError, errors } from "../lib/errors";
import bcrypt from "bcryptjs";

// Service-specific types
export interface MerchantLoginData {
  phoneNumber: string;
  password: string;
}

export interface MerchantRegistrationData {
  phoneNumber: string;
  password: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface MerchantProfileUpdateData {
  name?: string;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface MerchantStats {
  totalOrders: number;
  totalRevenue: number;
  activeMenuItems: number;
  averageOrderValue: number;
  monthlyRevenue: number[];
  recentOrders: number;
}

/**
 * Merchant service interface
 */
export interface IMerchantService {
  // Authentication methods
  register(data: MerchantRegistrationData): Promise<Merchant>;
  login(
    data: MerchantLoginData
  ): Promise<{ merchant: Merchant; sessionToken?: string }>;
  validatePassword(merchant: Merchant, password: string): Promise<boolean>;

  // CRUD operations
  findById(id: string): Promise<Merchant>;
  findByPhoneNumber(phoneNumber: string): Promise<Merchant | null>;
  findAll(params: CursorPaginationParams): Promise<PaginatedResult<Merchant>>;
  update(id: string, data: MerchantProfileUpdateData): Promise<Merchant>;
  softDelete(id: string): Promise<void>;

  // Business operations
  activate(id: string): Promise<Merchant>;
  deactivate(id: string): Promise<Merchant>;
  updateProfileImage(id: string, imagePath: string): Promise<Merchant>;

  // Analytics and reporting
  getStats(
    id: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MerchantStats>;

  // Validation methods
  validateMerchantData(data: MerchantRegistrationData): Promise<void>;
  isPhoneNumberUnique(
    phoneNumber: string,
    excludeId?: string
  ): Promise<boolean>;
}

/**
 * Merchant service implementation
 */
export class MerchantService implements IMerchantService {
  constructor(private merchantRepository: MerchantRepository) {}

  /**
   * Register a new merchant
   */
  async register(data: MerchantRegistrationData): Promise<Merchant> {
    // Validate merchant data
    await this.validateMerchantData(data);

    // Check if phone number is unique
    const phoneExists = !(await this.isPhoneNumberUnique(data.phoneNumber));
    if (phoneExists) {
      throw errors.conflict("Phone number is already registered");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Get next merchant number
    const merchantNumber =
      await this.merchantRepository.getNextMerchantNumber();

    // Create merchant with hashed password
    const merchantData: NewMerchant = {
      phoneNumber: data.phoneNumber,
      passwordHash: hashedPassword,
      merchantNumber,
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      isAvailable: true,
    };

    try {
      const merchant = await this.merchantRepository.create(merchantData);
      merchant.passwordHash = "";

      return merchant;
    } catch (error) {
      throw errors.internal("Failed to create merchant account", error);
    }
  }

  /**
   * Login merchant
   */
  async login(
    data: MerchantLoginData
  ): Promise<{ merchant: Merchant; sessionToken?: string }> {
    // Find merchant by phone number
    const merchant = await this.findByPhoneNumber(data.phoneNumber);
    if (!merchant) {
      throw errors.invalidCredentials();
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(
      merchant,
      data.password
    );
    if (!isPasswordValid) {
      throw errors.invalidCredentials();
    }

    // Check if merchant is available
    if (!merchant.isAvailable) {
      throw errors.merchantInactive(merchant.name);
    }

    // TODO: Generate session token (implement in session service)
    return { merchant };
  }

  /**
   * Validate password against stored hash
   */
  async validatePassword(
    merchant: Merchant,
    password: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, merchant.passwordHash);
    } catch (error) {
      throw errors.internal("Failed to validate password", error);
    }
  }

  /**
   * Find merchant by ID
   */
  async findById(id: string): Promise<Merchant> {
    try {
      const merchant = await this.merchantRepository.findById(id);
      if (!merchant) {
        throw errors.merchantNotFound(id);
      }
      return merchant;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to find merchant", error);
    }
  }

  /**
   * Find merchant by phone number
   */
  async findByPhoneNumber(phoneNumber: string): Promise<Merchant | null> {
    try {
      return await this.merchantRepository.findByPhoneNumber(phoneNumber);
    } catch (error) {
      throw errors.internal("Failed to find merchant by phone number", error);
    }
  }

  /**
   * Find all merchants with pagination
   */
  async findAll(
    params: CursorPaginationParams
  ): Promise<PaginatedResult<Merchant>> {
    try {
      const result = await this.merchantRepository.findAll({
        cursor: params.cursor,
        limit: params.limit,
      });

      // Convert repository result to paginated result
      return buildPaginatedResult(result.data, params);
    } catch (error) {
      throw errors.internal("Failed to fetch merchants", error);
    }
  }

  /**
   * Update merchant profile
   */
  async update(id: string, data: MerchantProfileUpdateData): Promise<Merchant> {
    // Validate merchant exists
    await this.findById(id);

    try {
      const updatedMerchant = await this.merchantRepository.update(id, data);
      if (!updatedMerchant) {
        throw errors.merchantNotFound(id);
      }
      return updatedMerchant;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to update merchant", error);
    }
  }

  /**
   * Soft delete merchant
   */
  async softDelete(id: string): Promise<void> {
    // Validate merchant exists
    await this.findById(id);

    try {
      const result = await this.merchantRepository.softDelete(id);
      if (!result) {
        throw errors.internal("Failed to delete merchant");
      }
    } catch (error) {
      throw errors.internal("Failed to delete merchant", error);
    }
  }

  /**
   * Activate merchant
   */
  async activate(id: string): Promise<Merchant> {
    return this.update(id, { isAvailable: true });
  }

  /**
   * Deactivate merchant
   */
  async deactivate(id: string): Promise<Merchant> {
    return this.update(id, { isAvailable: false });
  }

  /**
   * Update profile image
   */
  async updateProfileImage(id: string, imagePath: string): Promise<Merchant> {
    return this.update(id, { imageUrl: imagePath });
  }

  /**
   * Get merchant statistics
   */
  async getStats(
    id: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MerchantStats> {
    // Validate merchant exists
    await this.findById(id);

    // TODO: Implement stats calculation with order repository
    // This would require OrderRepository to be implemented
    return {
      totalOrders: 0,
      totalRevenue: 0,
      activeMenuItems: 0,
      averageOrderValue: 0,
      monthlyRevenue: [],
      recentOrders: 0,
    };
  }

  /**
   * Validate merchant registration data
   */
  async validateMerchantData(data: MerchantRegistrationData): Promise<void> {
    // Validate required fields
    if (!data.name?.trim()) {
      throw errors.validation("Merchant name is required");
    }

    if (!data.phoneNumber?.trim()) {
      throw errors.validation("Phone number is required");
    }

    if (!data.password?.trim()) {
      throw errors.validation("Password is required");
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw errors.validation("Password must be at least 8 characters long");
    }

    // Validate phone number
    this.validatePhoneNumber(data.phoneNumber);
  }

  /**
   * Check if phone number is unique
   */
  async isPhoneNumberUnique(
    phoneNumber: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const existingMerchant = await this.findByPhoneNumber(phoneNumber);
      if (!existingMerchant) {
        return true;
      }

      // If we're updating and the phone number belongs to the same merchant, it's still unique
      if (excludeId && existingMerchant.id === excludeId) {
        return true;
      }

      return false;
    } catch (error) {
      throw errors.internal("Failed to check phone number uniqueness", error);
    }
  }

  /**
   * Validate Indonesian phone number format
   */
  private validatePhoneNumber(phoneNumber: string): void {
    // Indonesian phone number patterns:
    // - Mobile: +62-8xx-xxxx-xxxx or 08xx-xxxx-xxxx
    // - Landline: +62-xx-xxxx-xxxx or 0xx-xxxx-xxxx
    const phoneRegex = /^(\+62|0)[0-9]{8,13}$/;

    const cleanPhone = phoneNumber.replace(/[-\s]/g, "");

    if (!phoneRegex.test(cleanPhone)) {
      throw errors.validation("Invalid Indonesian phone number format");
    }
  }
}
