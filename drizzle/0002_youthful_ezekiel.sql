CREATE TABLE "order_payment_items" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_payments" DROP CONSTRAINT "order_payments_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "order_payment_items" ADD CONSTRAINT "order_payment_items_payment_id_order_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."order_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_payment_items" ADD CONSTRAINT "order_payment_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_payments" DROP COLUMN "order_id";