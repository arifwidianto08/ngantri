/**
 * Currency utilities for Indonesian Rupiah (IDR)
 * All prices are stored as integers (whole rupiah) in the database
 * IDR does not have fractional parts (no cents)
 */

// Currency configuration for IDR
export const CURRENCY_CONFIG = {
  code: "IDR",
  symbol: "Rp",
  name: "Indonesian Rupiah",
  locale: "id-ID",
  // No minimum order requirement
  minimumOrderAmount: 0, // No minimum order
  minimumItemPrice: 0, // No minimum item price
  // Maximum values for validation
  maximumOrderAmount: 100000000, // Rp 100,000,000
  maximumItemPrice: 50000000, // Rp 50,000,000
} as const;

/**
 * Convert rupiah amount (already whole numbers, no conversion needed)
 * @param amount - Amount in rupiah
 * @returns Amount in rupiah (same value)
 * @example formatFromCents(1500) // returns 1500 (Rp 1,500)
 */
export const formatFromCents = (amount: number): number => {
  return Math.round(amount);
};

/**
 * Store rupiah amount (no conversion needed for IDR)
 * @param rupiah - Amount in rupiah
 * @returns Amount in rupiah (same value)
 * @example formatToCents(1500) // returns 1500 (stored as 1500)
 */
export const formatToCents = (rupiah: number): number => {
  return Math.round(rupiah);
};

/**
 * Format currency amount for display with proper Indonesian formatting
 * @param amount - Amount in rupiah
 * @param options - Formatting options
 * @returns Formatted currency string
 * @example formatCurrency(1500) // returns "Rp 1.500"
 */
export const formatCurrency = (
  amount: number,
  options: {
    showSymbol?: boolean;
    locale?: string;
  } = {}
): string => {
  const { showSymbol = true, locale = CURRENCY_CONFIG.locale } = options;

  const rupiah = formatFromCents(amount);

  // Use Indonesian number formatting (no decimals for IDR)
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupiah);

  return showSymbol ? `${CURRENCY_CONFIG.symbol} ${formatted}` : formatted;
};

/**
 * Parse currency string to rupiah amount
 * @param currencyString - Currency string (e.g., "Rp 1.500", "1500", "1,500")
 * @returns Amount in rupiah or null if invalid
 * @example parseCurrencyToCents("Rp 1.500") // returns 1500
 */
export const parseCurrencyToCents = (currencyString: string): number | null => {
  if (!currencyString || typeof currencyString !== "string") {
    return null;
  }

  // Remove currency symbol and clean the string
  const cleaned = currencyString
    .replace(/Rp\s*/gi, "") // Remove Rp symbol
    .replace(/\s/g, "") // Remove spaces
    .replace(/\./g, "") // Remove dots (thousand separators in Indonesian format)
    .replace(/,/g, ""); // Remove commas

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || parsed < 0) {
    return null;
  }

  return formatToCents(parsed);
};

/**
 * Validate currency amount
 * @param amount - Amount in rupiah
 * @param type - Type of validation (item, order)
 * @returns Validation result
 */
export const validateCurrencyAmount = (
  amount: number,
  type: "item" | "order" = "item"
): {
  valid: boolean;
  error?: string;
  formattedAmount?: string;
} => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return {
      valid: false,
      error: "Invalid amount format",
    };
  }

  if (amount < 0) {
    return {
      valid: false,
      error: "Amount cannot be negative",
    };
  }

  // No minimum requirements for IDR
  const maxAmount =
    type === "item"
      ? CURRENCY_CONFIG.maximumItemPrice
      : CURRENCY_CONFIG.maximumOrderAmount;

  if (amount > maxAmount) {
    return {
      valid: false,
      error: `Maximum ${type} amount is ${formatCurrency(maxAmount)}`,
    };
  }

  return {
    valid: true,
    formattedAmount: formatCurrency(amount),
  };
};

/**
 * Calculate percentage of amount
 * @param amount - Base amount in rupiah
 * @param percentage - Percentage to calculate
 * @returns Calculated amount in rupiah
 * @example calculatePercentage(1000, 10) // returns 100 (10% of Rp 1,000)
 */
export const calculatePercentage = (
  amount: number,
  percentage: number
): number => {
  return Math.round((amount * percentage) / 100);
};

/**
 * Calculate tax amount (typically PPN 11% in Indonesia)
 * @param amount - Base amount in rupiah
 * @param taxRate - Tax rate (default 11% for Indonesian PPN)
 * @returns Tax amount in rupiah
 */
export const calculateTax = (amount: number, taxRate: number = 11): number => {
  return calculatePercentage(amount, taxRate);
};

/**
 * Calculate total with tax
 * @param amount - Base amount in rupiah
 * @param taxRate - Tax rate (default 11% for Indonesian PPN)
 * @returns Total amount including tax in rupiah
 */
export const calculateTotalWithTax = (
  amount: number,
  taxRate: number = 11
): number => {
  const tax = calculateTax(amount, taxRate);
  return amount + tax;
};

/**
 * Calculate order total from items
 * @param items - Array of items with quantity and price in rupiah
 * @returns Order calculation details
 */
export const calculateOrderTotal = (
  items: Array<{ quantity: number; unitPrice: number }>
): {
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  formattedSubtotal: string;
  formattedTax: string;
  formattedTotal: string;
} => {
  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // For food court orders, typically no tax is applied to simplify
  const taxAmount = 0; // calculateTax(subtotalAmount);
  const totalAmount = subtotalAmount + taxAmount;

  return {
    subtotalAmount,
    taxAmount,
    totalAmount,
    formattedSubtotal: formatCurrency(subtotalAmount),
    formattedTax: formatCurrency(taxAmount),
    formattedTotal: formatCurrency(totalAmount),
  };
};

/**
 * Format currency for input fields (without symbol)
 * @param amount - Amount in rupiah
 * @returns Formatted string for input fields
 * @example formatCurrencyInput(1500) // returns "1.500"
 */
export const formatCurrencyInput = (amount: number): string => {
  return formatCurrency(amount, { showSymbol: false });
};

/**
 * Check if amount meets minimum order requirement (no minimum for food court)
 * @param amount - Amount in rupiah
 * @returns Boolean indicating if minimum is met (always true)
 */
export const meetsMinimumOrder = (amount: number): boolean => {
  return amount >= CURRENCY_CONFIG.minimumOrderAmount; // Always true since minimum is 0
};

/**
 * Get minimum order amount in readable format
 * @returns Formatted minimum order amount (no minimum)
 */
export const getMinimumOrderAmount = (): string => {
  return formatCurrency(CURRENCY_CONFIG.minimumOrderAmount);
};

/**
 * Round amount to nearest valid Indonesian currency amount
 * In Indonesia, smallest denomination is Rp 100, so round to nearest 100
 * @param amount - Amount in rupiah
 * @returns Rounded amount in rupiah
 */
export const roundCurrencyAmount = (amount: number): number => {
  // Round to nearest Rp 100
  return Math.round(amount / 100) * 100;
};
