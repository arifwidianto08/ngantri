# Data Model: Food Court Ordering System

**Date**: 2025-10-05  
**Feature**: Food Court Ordering System  
**Branch**: 001-build-me-an

## Entity Overview

The system manages merchants, their menus, buyer sessions, shopping carts, and orders through a well-normalized relational model with strategic denormalization for historical data integrity. All entities use UUIDv7 for primary keys to enable efficient cursor-based pagination and chronological ordering. Currency values are stored as integers representing Indonesian Rupiah (IDR).

## Technical Standards

- **Primary Keys**: All entities use UUIDv7 (`uuid_generate_v7()`) for natural chronological ordering
- **Pagination**: Cursor-based pagination using UUIDv7 timestamps (no LIMIT-OFFSET)
- **Currency**: Indonesian Rupiah (IDR) stored as integers (no decimal places)
- **Timestamps**: PostgreSQL `timestamp with time zone` for consistent timezone handling

## Core Entities

### Merchants

**Purpose**: Registered food court vendors who can manage their profile and menu items.

**Fields**:

- `id` (UUIDv7, PK): Unique identifier with embedded timestamp
- `phone_number` (VARCHAR, UNIQUE): Login credential and contact info
- `password_hash` (VARCHAR): Securely hashed password
- `merchant_number` (INT, UNIQUE): Physical location identifier in food court
- `name` (VARCHAR): Business display name
- `image_url` (VARCHAR): Profile image path (static assets)
- `description` (TEXT): Business description for customers
- `is_available` (BOOLEAN): Whether merchant is currently accepting orders
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP): Audit trail

**Business Rules**:

- Phone number must be unique across all merchants
- Merchant number must be unique (physical location constraint)
- Password must be hashed using bcrypt or similar
- Default availability is true (accepting orders)
- Soft delete pattern with deleted_at timestamp

**Relationships**:

- One-to-many with menu_categories
- One-to-many with menus
- One-to-many with cart_items
- One-to-many with orders

### Menu Categories

**Purpose**: Organizational structure for merchant menu items (e.g., "Appetizers", "Main Dishes").

**Fields**:

- `id` (UUID, PK): Unique identifier
- `merchant_id` (UUID, FK): Owner merchant reference
- `name` (VARCHAR): Category display name
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP): Audit trail

**Business Rules**:

- Each category belongs to exactly one merchant
- Category names should be unique within a merchant
- Soft delete pattern preserves historical menu organization

**Relationships**:

- Many-to-one with merchants
- One-to-many with menus

### Menus

**Purpose**: Individual food items offered by merchants with pricing and availability.

**Fields**:

- `id` (UUID, PK): Unique identifier
- `merchant_id` (UUID, FK): Owner merchant reference
- `category_id` (UUID, FK): Category classification
- `name` (VARCHAR): Item display name
- `image_url` (VARCHAR): Item image path (static assets)
- `description` (TEXT): Item description for customers
- `price` (INT): Price in Indonesian Rupiah (IDR)
- `is_available` (BOOLEAN): Current availability status
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP): Audit trail

**Business Rules**:

- Each menu item belongs to exactly one merchant and one category
- Price stored as integer IDR (Indonesian Rupiah uses whole numbers, no cents)
- Default availability is true
- Menu items can be toggled available/unavailable without deletion
- Soft delete preserves historical menu data

**Relationships**:

- Many-to-one with merchants
- Many-to-one with menu_categories
- One-to-many with cart_items
- One-to-many with order_items

### Buyer Sessions

**Purpose**: Temporary customer identification for anonymous ordering without full user accounts.

**Fields**:

- `id` (UUID, PK): Unique session identifier
- `phone_number` (VARCHAR): Contact information for order notifications
- `name` (VARCHAR): Customer name for order identification
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP): Session lifecycle

**Business Rules**:

- No unique constraint on phone_number (allows multiple concurrent sessions)
- Sessions are temporary and can be cleaned up after order completion
- No authentication required - sessions created during checkout
- Phone number must be valid WhatsApp number for notifications

**Relationships**:

- One-to-one with carts
- One-to-many with orders

### Carts

**Purpose**: Temporary collection of menu items from multiple merchants before checkout.

**Fields**:

- `id` (UUID, PK): Unique identifier
- `buyer_session_id` (UUID, FK, UNIQUE): Associated session
- `total_quantity` (INT): Aggregate item count across all merchants
- `created_at`, `updated_at` (TIMESTAMP): Cart lifecycle

**Business Rules**:

- Each buyer session has exactly one cart
- Total quantity is maintained as aggregate for UI display
- Cart persists during session but can be cleared after order completion
- No soft delete - carts are temporary entities

**Relationships**:

- One-to-one with buyer_sessions
- One-to-many with cart_items

### Cart Items

**Purpose**: Individual menu items selected by buyers, grouped by merchant within cart.

**Fields**:

- `id` (UUID, PK): Unique identifier
- `cart_id` (UUID, FK): Parent cart reference
- `merchant_id` (UUID, FK): Source merchant for grouping
- `menu_id` (UUID, FK): Selected menu item
- `quantity` (INT): Number of items selected
- `created_at`, `updated_at` (TIMESTAMP): Item lifecycle

**Business Rules**:

- Each cart item represents a quantity of a specific menu item
- Merchant ID enables grouping items by vendor for separate orders
- Quantity must be positive integer
- Same menu item can appear multiple times if added separately

**Relationships**:

- Many-to-one with carts
- Many-to-one with merchants
- Many-to-one with menus

## Order Management Entities

### Orders

**Purpose**: Confirmed purchase requests from buyers to individual merchants with payment and fulfillment tracking.

**Fields**:

- `id` (UUID, PK): Unique identifier
- `buyer_session_id` (UUID, FK): Customer reference
- `merchant_id` (UUID, FK): Target merchant (current)
- `merchant_name` (VARCHAR): Merchant name snapshot (denormalized)
- `merchant_image_url` (VARCHAR): Merchant image snapshot (denormalized)
- `order_number` (VARCHAR, UNIQUE): Human-readable identifier (format: YYMMDD-XXXX)
- `status` (order_status ENUM): Current order state
- `total_quantity` (INT): Total items in order
- `total_amount` (INT): Total price in Indonesian Rupiah (IDR)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP): Order lifecycle

**Business Rules**:

- Each order represents items from a single merchant
- Multi-merchant carts create multiple separate orders
- Order number format enables daily sequential numbering
- Merchant data is denormalized to preserve historical accuracy
- Status follows defined workflow: payment_pending → paid → preparing → ready_for_pickup → picked → completed
- Soft delete preserves order history

**Status Workflow**:

1. `payment_pending`: Order created, awaiting in-person payment
2. `paid`: Merchant confirmed payment received
3. `cancelled`: Order cancelled before preparation
4. `preparing`: Merchant started preparing order
5. `ready_for_pickup`: Order ready, customer notified
6. `picked`: Customer collected order
7. `completed`: Order fully closed

**Relationships**:

- Many-to-one with buyer_sessions
- Many-to-one with merchants
- One-to-many with order_items

### Order Items

**Purpose**: Individual menu items within an order with historical pricing and details.

**Fields**:

- `id` (UUID, PK): Unique identifier
- `order_id` (UUID, FK): Parent order reference
- `menu_id` (UUID, FK): Original menu item (current reference)
- `menu_name` (VARCHAR): Menu item name snapshot (denormalized)
- `menu_image_url` (VARCHAR): Menu item image snapshot (denormalized)
- `price` (INT): Item price at time of order (denormalized)
- `quantity` (INT): Number of items ordered
- `subtotal` (INT): Calculated total (price × quantity)
- `created_at`, `updated_at` (TIMESTAMP): Item lifecycle

**Business Rules**:

- Menu data is denormalized to preserve historical accuracy
- Subtotal is calculated and stored for performance and accuracy
- Original menu_id maintained for potential future reconciliation
- Quantity must be positive integer

**Relationships**:

- Many-to-one with orders
- Many-to-one with menus (historical reference)

## Utility Entities

### Order Number Increments

**Purpose**: Daily sequential numbering system for human-readable order identifiers.

**Fields**:

- `date` (DATE, PK): Date for which sequence applies
- `last_value` (INT): Last used sequence number for this date

**Business Rules**:

- One record per date ensures daily sequence reset
- Thread-safe increment operations required for concurrent orders
- Format combines date (YYMMDD) with zero-padded sequence (XXXX)
- Example: 251005-0001 for first order on October 5, 2025

**Usage Pattern**:

```sql
-- Atomic increment operation
UPDATE order_number_increments
SET last_value = last_value + 1
WHERE date = CURRENT_DATE
RETURNING last_value;
```

## Data Relationships Summary

### Primary Flows

1. **Merchant Setup**: Merchants → Menu Categories → Menus
2. **Shopping Flow**: Buyer Sessions → Carts → Cart Items → Menus
3. **Ordering Flow**: Cart Items → Orders + Order Items (with denormalization)
4. **Order Tracking**: Orders → Status Updates → Completion

### Denormalization Strategy

- **Order entities** capture merchant/menu snapshots to prevent historical data corruption
- **Aggregate fields** (total_quantity, total_amount) optimize query performance
- **Status enums** ensure data consistency and enable workflow validation

### Indexing Strategy

- Foreign key columns for join performance
- Date fields for time-based queries
- Status fields for workflow filtering
- Phone numbers for notification lookups
- Order numbers for customer service

## Pagination Strategy

### Cursor-Based Pagination

All list endpoints use cursor-based pagination with UUIDv7 primary keys:

**Standard Pattern**:

```sql
-- Next page: WHERE id > cursor ORDER BY id LIMIT page_size
-- Previous page: WHERE id < cursor ORDER BY id DESC LIMIT page_size
```

**Benefits**:

- Consistent performance regardless of page depth
- No duplicate/missing records during real-time updates
- Natural chronological ordering using UUIDv7 timestamps
- Efficient database queries with indexed UUID comparisons

**Implementation**:

- `cursor`: Base64-encoded UUIDv7 from last record
- `limit`: Page size (default 20, max 100)
- `direction`: 'next' (default) or 'prev' for pagination direction

## Validation Rules Summary

### Data Integrity

- All UUIDs use `uuid_generate_v7()` for chronological ordering
- Timestamps use `now()` defaults with update triggers
- Soft delete pattern preserves audit trails
- Foreign key constraints enforce referential integrity

### Business Logic

- Price calculations in integer IDR avoid floating-point errors and align with Indonesian currency
- Status transitions follow defined workflow rules
- Availability flags enable real-time menu management
- Session-based approach eliminates user account complexity
