/**
 * Xendit Payment Gateway Integration
 * API Documentation: https://developers.xendit.co/api-reference
 */

const XENDIT_API_KEY = process.env.XENDIT_API_KEY || "";
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail?: string;
  description: string;
  invoiceDuration?: number;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  amount: number;
  payer_email?: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
  updated: string;
}

/**
 * Create Xendit Invoice (Payment Link)
 */
export async function createPaymentInvoice(
  params: CreateInvoiceParams
): Promise<XenditInvoiceResponse> {
  const url = "https://api.xendit.co/v2/invoices";

  const payload = {
    external_id: params.externalId,
    amount: params.amount,
    payer_email: params.payerEmail || `${params.externalId}@ngantri.app`,
    description: params.description,
    invoice_duration: params.invoiceDuration || 86400, // 24 hours default
    success_redirect_url:
      params.successRedirectUrl || `${BASE_URL}/payment-success`,
    failure_redirect_url:
      params.failureRedirectUrl || `${BASE_URL}/payment-failed`,
    currency: "IDR",
    customer: {
      given_names: params.customerName || "Customer",
      mobile_number: params.customerPhone
        ? `+62${params.customerPhone.replace(/^0/, "")}`
        : undefined,
    },
    items: params.items?.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString(
        "base64"
      )}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Xendit API Error: ${error.error_code || "Unknown"} - ${
        error.message || "Failed to create invoice"
      }`
    );
  }

  return await response.json();
}

/**
 * Validate Xendit Webhook Callback Token
 */
export function validateWebhookToken(callbackToken: string): boolean {
  if (!XENDIT_WEBHOOK_TOKEN) {
    console.warn("XENDIT_WEBHOOK_TOKEN not configured");
    return false;
  }
  return callbackToken === XENDIT_WEBHOOK_TOKEN;
}

/**
 * Get Invoice Details
 */
export async function getInvoice(
  invoiceId: string
): Promise<XenditInvoiceResponse> {
  const url = `https://api.xendit.co/v2/invoices/${invoiceId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString(
        "base64"
      )}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Xendit API Error: ${error.error_code || "Unknown"} - ${
        error.message || "Failed to get invoice"
      }`
    );
  }

  return await response.json();
}

/**
 * Expire/Cancel Invoice
 */
export async function expireInvoice(
  invoiceId: string
): Promise<XenditInvoiceResponse> {
  const url = `https://api.xendit.co/invoices/${invoiceId}/expire!`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString(
        "base64"
      )}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Xendit API Error: ${error.error_code || "Unknown"} - ${
        error.message || "Failed to expire invoice"
      }`
    );
  }

  return await response.json();
}

export type { CreateInvoiceParams, XenditInvoiceResponse };
