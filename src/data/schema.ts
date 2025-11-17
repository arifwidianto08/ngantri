import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Merchants table - registered food court vendors
export const merchants = pgTable("merchants", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  merchantNumber: integer("merchant_number").notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  description: text("description"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Menu Categories - organizational structure for menu items
export const menuCategories = pgTable(
  "menu_categories",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    // Unique category name per merchant
    uniqueMerchantCategory: unique().on(table.merchantId, table.name),
  })
);

// Menus - individual food items with pricing
export const menus = pgTable("menus", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id),
  name: varchar("name", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  description: text("description"),
  price: integer("price").notNull(), // Price in IDR (Indonesian Rupiah)
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Buyer Sessions - anonymous customer sessions for ordering
export const buyerSessions = pgTable("buyer_sessions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  tableNumber: integer("table_number"), // Optional table identification
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Cart Items - shopping cart contents before order placement
export const cartItems = pgTable("cart_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => buyerSessions.id),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menus.id),
  quantity: integer("quantity").notNull().default(1),
  priceSnapshot: integer("price_snapshot").notNull(), // IDR price at time of adding to cart
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Orders - confirmed orders from customers
export const orders = pgTable("orders", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => buyerSessions.id),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, preparing, ready, completed, cancelled
  totalAmount: integer("total_amount").notNull(), // Total in IDR
  customerName: varchar("customer_name", { length: 100 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Order Payments - payment transactions for orders via Xendit
export const orderPayments = pgTable("order_payments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  xenditInvoiceId: varchar("xendit_invoice_id", { length: 255 })
    .notNull()
    .unique(), // Xendit's invoice ID
  paymentUrl: varchar("payment_url", { length: 500 }).notNull(), // Payment URL for customer
  amount: integer("amount").notNull(), // Amount in IDR
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid, expired, failed, cancelled
  paymentMethod: varchar("payment_method", { length: 50 }), // e.g., BANK_TRANSFER, E_WALLET, CREDIT_CARD
  paidAt: timestamp("paid_at", { withTimezone: true }), // When payment was confirmed
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Payment link expiration
  webhookData: text("webhook_data"), // JSON data from Xendit webhook
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Order Items - individual items within an order (denormalized for history)
export const orderItems = pgTable("order_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menus.id),
  menuName: varchar("menu_name", { length: 100 }).notNull(), // Snapshot for historical data
  menuImageUrl: varchar("menu_image_url", { length: 255 }), // Snapshot for historical data
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // IDR price per unit at time of order
  subtotal: integer("subtotal").notNull(), // quantity * unit_price in IDR
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Export types for TypeScript
export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;
export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
export type BuyerSession = typeof buyerSessions.$inferSelect;
export type NewBuyerSession = typeof buyerSessions.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderPayment = typeof orderPayments.$inferSelect;
export type NewOrderPayment = typeof orderPayments.$inferInsert;
