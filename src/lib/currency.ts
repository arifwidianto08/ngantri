/**
 * Currency utilities for Indonesian Rupiah (IDR)
 * All prices are stored as integers (cents) in the database
 */

// Currency configuration for IDR
export const CURRENCY_CONFIG = {
  code: "IDR",
  symbol: "Rp",
  name: "Indonesian Rupiah",
  locale: "id-ID",
  // Minimum order values
  minimumOrderAmount: 500000, // Rp 5,000 in cents
  minimumItemPrice: 100000, // Rp 1,000 in cents
  // Maximum values for validation
  maximumOrderAmount: 10000000000, // Rp 100,000,000 in cents
  maximumItemPrice: 5000000000, // Rp 50,000,000 in cents
} as const;

/**
 * Convert rupiah amount from cents (database integer) to rupiah
 * @param cents - Amount in cents (database integer)
 * @returns Amount in rupiah
 * @example formatFromCents(150000) // returns 1500 (Rp 1,500)
 */
export const formatFromCents = (cents: number): number => {
  return Math.round(cents / 100);
};

/**
 * Convert rupiah amount to cents for database storage
 * @param rupiah - Amount in rupiah
 * @returns Amount in cents (database integer)
 * @example formatToCents(1500) // returns 150000 (stored as 150000 cents)
 */
export const formatToCents = (rupiah: number): number => {
  return Math.round(rupiah * 100);
};

/**
 * Format currency amount for display with proper Indonesian formatting
 * @param cents - Amount in cents (database integer)
 * @param options - Formatting options
 * @returns Formatted currency string
 * @example formatCurrency(150000) // returns "Rp 1.500"
 */
export const formatCurrency = (
  cents: number,
  options: {
    showSymbol?: boolean;
    showDecimals?: boolean;
    locale?: string;
  } = {}
): string => {
  const {
    showSymbol = true,
    showDecimals = false,
    locale = CURRENCY_CONFIG.locale,
  } = options;

  const rupiah = formatFromCents(cents);

  // Use Indonesian number formatting
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupiah);

  return showSymbol ? `${CURRENCY_CONFIG.symbol} ${formatted}` : formatted;
};

/**
 * Parse currency string to cents (for database storage)
 * @param currencyString - Currency string (e.g., "Rp 1.500", "1500", "1,500")
 * @returns Amount in cents or null if invalid
 * @example parseCurrencyToCents("Rp 1.500") // returns 150000
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
 * @param cents - Amount in cents
 * @param type - Type of validation (item, order)
 * @returns Validation result
 */
export const validateCurrencyAmount = (
  cents: number,
  type: "item" | "order" = "item"
): {
  valid: boolean;
  error?: string;
  formattedAmount?: string;
} => {
  if (typeof cents !== "number" || isNaN(cents)) {
    return {
      valid: false,
      error: "Invalid amount format",
    };
  }

  if (cents < 0) {
    return {
      valid: false,
      error: "Amount cannot be negative",
    };
  }

  const minAmount =
    type === "item"
      ? CURRENCY_CONFIG.minimumItemPrice
      : CURRENCY_CONFIG.minimumOrderAmount;

  const maxAmount =
    type === "item"
      ? CURRENCY_CONFIG.maximumItemPrice
      : CURRENCY_CONFIG.maximumOrderAmount;

  if (cents < minAmount) {
    return {
      valid: false,
      error: `Minimum ${type} amount is ${formatCurrency(minAmount)}`,
    };
  }

  if (cents > maxAmount) {
    return {
      valid: false,
      error: `Maximum ${type} amount is ${formatCurrency(maxAmount)}`,
    };
  }

  return {
    valid: true,
    formattedAmount: formatCurrency(cents),
  };
};

/**
 * Calculate percentage of amount
 * @param cents - Base amount in cents
 * @param percentage - Percentage to calculate
 * @returns Calculated amount in cents
 * @example calculatePercentage(100000, 10) // returns 10000 (10% of Rp 1,000)
 */
export const calculatePercentage = (
  cents: number,
  percentage: number
): number => {
  return Math.round((cents * percentage) / 100);
};

/**
 * Calculate tax amount (typically PPN 11% in Indonesia)
 * @param cents - Base amount in cents
 * @param taxRate - Tax rate (default 11% for Indonesian PPN)
 * @returns Tax amount in cents
 */
export const calculateTax = (cents: number, taxRate: number = 11): number => {
  return calculatePercentage(cents, taxRate);
};

/**
 * Calculate total with tax
 * @param cents - Base amount in cents
 * @param taxRate - Tax rate (default 11% for Indonesian PPN)
 * @returns Total amount including tax in cents
 */
export const calculateTotalWithTax = (
  cents: number,
  taxRate: number = 11
): number => {
  const tax = calculateTax(cents, taxRate);
  return cents + tax;
};

/**
 * Calculate order total from items
 * @param items - Array of items with quantity and price
 * @returns Order calculation details
 */
export const calculateOrderTotal = (
  items: Array<{ quantity: number; priceInCents: number }>
): {
  subtotalInCents: number;
  taxInCents: number;
  totalInCents: number;
  formattedSubtotal: string;
  formattedTax: string;
  formattedTotal: string;
} => {
  const subtotalInCents = items.reduce(
    (sum, item) => sum + item.quantity * item.priceInCents,
    0
  );

  const taxInCents = calculateTax(subtotalInCents);
  const totalInCents = subtotalInCents + taxInCents;

  return {
    subtotalInCents,
    taxInCents,
    totalInCents,
    formattedSubtotal: formatCurrency(subtotalInCents),
    formattedTax: formatCurrency(taxInCents),
    formattedTotal: formatCurrency(totalInCents),
  };
};

/**
 * Format currency for input fields (without symbol)
 * @param cents - Amount in cents
 * @returns Formatted string for input fields
 * @example formatCurrencyInput(150000) // returns "1.500"
 */
export const formatCurrencyInput = (cents: number): string => {
  return formatCurrency(cents, { showSymbol: false });
};

/**
 * Check if amount meets minimum order requirement
 * @param cents - Amount in cents
 * @returns Boolean indicating if minimum is met
 */
export const meetsMinimumOrder = (cents: number): boolean => {
  return cents >= CURRENCY_CONFIG.minimumOrderAmount;
};

/**
 * Get minimum order amount in readable format
 * @returns Formatted minimum order amount
 */
export const getMinimumOrderAmount = (): string => {
  return formatCurrency(CURRENCY_CONFIG.minimumOrderAmount);
};

/**
 * Round amount to nearest valid Indonesian currency amount
 * In Indonesia, smallest denomination is Rp 100, so round to nearest 100
 * @param cents - Amount in cents
 * @returns Rounded amount in cents
 */
export const roundCurrencyAmount = (cents: number): number => {
  // Round to nearest Rp 100 (10000 cents)
  return Math.round(cents / 10000) * 10000;
};
