CREATE TABLE "buyer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"table_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"menu_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_snapshot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"image_url" varchar(255),
	"description" text,
	"price" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"merchant_number" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"image_url" varchar(255),
	"description" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "merchants_merchant_number_unique" UNIQUE("merchant_number")
);

--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_id" uuid NOT NULL,
	"menu_name" varchar(100) NOT NULL,
	"menu_image_url" varchar(255),
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"customer_name" varchar(100),
	"customer_phone" varchar(20),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

--> statement-breakpoint
ALTER TABLE
	"cart_items"
ADD
	CONSTRAINT "cart_items_session_id_buyer_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."buyer_sessions"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"cart_items"
ADD
	CONSTRAINT "cart_items_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"cart_items"
ADD
	CONSTRAINT "cart_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"menu_categories"
ADD
	CONSTRAINT "menu_categories_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"menus"
ADD
	CONSTRAINT "menus_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"menus"
ADD
	CONSTRAINT "menus_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"order_items"
ADD
	CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"order_items"
ADD
	CONSTRAINT "order_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"orders"
ADD
	CONSTRAINT "orders_session_id_buyer_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."buyer_sessions"("id") ON DELETE no action ON
UPDATE
	no action;

--> statement-breakpoint
ALTER TABLE
	"orders"
ADD
	CONSTRAINT "orders_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON
UPDATE
	no action;