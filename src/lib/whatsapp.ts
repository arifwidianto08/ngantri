/**
 * WhatsApp URL generation utilities for merchant communication
 * Uses wa.me links to open WhatsApp Web/App with pre-filled messages
 */

export interface WhatsAppMessageOptions {
  merchantName: string;
  orderId?: string;
  customerName?: string;
  totalAmount?: number;
  orderItems?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Generate WhatsApp URL for order confirmation
 */
export const generateOrderConfirmationUrl = (
  merchantPhone: string,
  options: WhatsAppMessageOptions
): string => {
  const { merchantName, orderId, customerName, totalAmount, orderItems } =
    options;

  let message = `Hello ${merchantName}! 👋\n\n`;
  message += `I have a new order${orderId ? ` (Order #${orderId})` : ""}:\n\n`;

  if (customerName) {
    message += `Customer: ${customerName}\n`;
  }

  if (orderItems && orderItems.length > 0) {
    message += `Order Details:\n`;
    orderItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} - ${formatIDR(
        item.price * item.quantity
      )}\n`;
    });
    message += "\n";
  }

  if (totalAmount) {
    message += `Total: ${formatIDR(totalAmount)}\n\n`;
  }

  message += `Please confirm the order. Thank you! 🙏`;

  return generateWhatsAppUrl(merchantPhone, message);
};

/**
 * Generate WhatsApp URL for order inquiry
 */
export const generateOrderInquiryUrl = (
  merchantPhone: string,
  options: Pick<WhatsAppMessageOptions, "merchantName" | "orderId">
): string => {
  const { merchantName, orderId } = options;

  let message = `Hello ${merchantName}! 👋\n\n`;
  message += `I would like to inquire about ${
    orderId ? `my order #${orderId}` : "placing an order"
  }.\n\n`;
  message += `Could you please provide more information? Thank you! 🙏`;

  return generateWhatsAppUrl(merchantPhone, message);
};

/**
 * Generate WhatsApp URL for order status update
 */
export const generateOrderStatusUrl = (
  merchantPhone: string,
  options: Pick<WhatsAppMessageOptions, "merchantName" | "orderId">
): string => {
  const { merchantName, orderId } = options;

  let message = `Hello ${merchantName}! 👋\n\n`;
  message += `Could you please update me on the status of ${
    orderId ? `order #${orderId}` : "my order"
  }?\n\n`;
  message += `Thank you! 🙏`;

  return generateWhatsAppUrl(merchantPhone, message);
};

/**
 * Generate WhatsApp URL for general merchant contact
 */
export const generateGeneralContactUrl = (
  merchantPhone: string,
  merchantName: string
): string => {
  const message = `Hello ${merchantName}! 👋\n\nI would like to get in touch regarding your menu. Thank you! 🙏`;
  return generateWhatsAppUrl(merchantPhone, message);
};

/**
 * Base function to generate WhatsApp wa.me URL
 */
export const generateWhatsAppUrl = (
  phoneNumber: string,
  message: string
): string => {
  // Remove any non-numeric characters except the leading +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");

  // Ensure phone number starts with + for international format
  const formattedPhone = cleanPhone.startsWith("+")
    ? cleanPhone.slice(1)
    : cleanPhone;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

/**
 * Validate WhatsApp phone number format
 */
export const isValidWhatsAppNumber = (phoneNumber: string): boolean => {
  // WhatsApp numbers should be in international format (+country code + number)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Format phone number for WhatsApp
 */
export const formatWhatsAppNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters except +
  let formatted = phoneNumber.replace(/[^\d+]/g, "");

  // Add + if not present and doesn't start with 0
  if (!formatted.startsWith("+") && !formatted.startsWith("0")) {
    formatted = "+" + formatted;
  }

  // Handle Indonesian numbers specifically (common case for food court)
  if (formatted.startsWith("0")) {
    formatted = "+62" + formatted.slice(1);
  } else if (formatted.startsWith("62") && !formatted.startsWith("+")) {
    formatted = "+" + formatted;
  }

  return formatted;
};

/**
 * Currency formatting helper (for WhatsApp messages)
 */
const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Generate multiple WhatsApp URLs for different purposes
 */
export const generateMerchantWhatsAppUrls = (
  merchantPhone: string,
  merchantName: string
) => {
  return {
    general: generateGeneralContactUrl(merchantPhone, merchantName),
    orderInquiry: generateOrderInquiryUrl(merchantPhone, { merchantName }),
    orderStatus: generateOrderStatusUrl(merchantPhone, { merchantName }),
  };
};
