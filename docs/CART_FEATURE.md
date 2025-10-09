# Cart Feature Documentation

## Overview
The cart feature has been separated from the homepage into a dedicated `/cart` page for better user experience and cleaner code organization.

## Components Created

### 1. **Cart Page** (`/src/app/cart/page.tsx`)
A dedicated page for viewing and managing cart items with the following features:
- View all cart items grouped by merchant
- Update item quantities
- Remove individual items
- Clear entire cart
- Place orders for all items in cart
- Session and table number display
- Empty cart state with call-to-action

### 2. **Cart Widget** (`/src/components/CartWidget.tsx`)
A reusable cart button component that:
- Displays in the header of the homepage
- Shows cart item count badge
- Links to the cart page
- Auto-updates when cart changes

### 3. **Floating Cart** (`/src/components/FloatingCart.tsx`)
A floating cart summary that:
- Shows on desktop as an expandable widget
- Shows on mobile as a floating action button
- Displays cart totals and preview of items
- Quick access to checkout

## Features

### Cart Management
- ✅ Add items to cart from any merchant
- ✅ Update item quantities
- ✅ Remove individual items
- ✅ Clear entire cart
- ✅ Multi-merchant cart support
- ✅ Persistent cart (localStorage + server sync)
- ✅ Real-time cart updates

### User Experience
- ✅ Separated cart page for focused checkout experience
- ✅ Cart badge showing item count
- ✅ Floating cart preview (desktop)
- ✅ Floating action button (mobile)
- ✅ Items grouped by merchant
- ✅ Image previews for menu items
- ✅ Empty cart state with helpful messaging

### Order Placement
- ✅ Table number validation before checkout
- ✅ Multi-merchant order creation
- ✅ Automatic cart clearing after successful order
- ✅ Order confirmation feedback

## Updated Files

### Modified
1. **`/src/app/page.tsx`** - Homepage
   - Removed inline cart display
   - Added CartWidget to header
   - Added FloatingCart component
   - Simplified to focus on browsing and adding items

2. **`/src/lib/cart.ts`** - Cart utilities
   - Added custom event dispatching for cart updates
   - Events: `cart-updated` triggered on save/clear

### New Files
1. **`/src/app/cart/page.tsx`** - Dedicated cart page
2. **`/src/components/CartWidget.tsx`** - Header cart button
3. **`/src/components/FloatingCart.tsx`** - Floating cart preview

## Usage

### Adding Items to Cart
From the homepage, users can:
1. Select a merchant
2. Browse menu items
3. Click "Add to Cart" on any available item
4. See cart badge update automatically

### Viewing Cart
Users can access their cart via:
1. Cart button in the header (shows item count)
2. Floating cart on desktop (bottom-right)
3. Floating action button on mobile (bottom-right)
4. Direct navigation to `/cart`

### Checkout Process
1. User adds items from any merchant(s)
2. User sets table number (if not already set)
3. User navigates to cart page
4. User reviews items (can adjust quantities)
5. User clicks "Place Order"
6. System creates separate orders for each merchant
7. Cart clears and user is redirected to homepage

## Technical Details

### State Management
- **Local Storage**: Cart data persisted in browser
- **Session Validation**: Cart tied to buyer session
- **Server Sync**: Cart synced with backend API
- **Event System**: Custom events for real-time updates

### Cart Structure
```typescript
interface Cart {
  sessionId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt: string;
}

interface CartItem {
  id: string;
  menuId: string;
  menuName: string;
  merchantId: string;
  merchantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  imageUrl?: string;
}
```

### API Integration
- `GET /api/sessions/[sessionId]/cart` - Load cart from server
- `POST /api/sessions/[sessionId]/cart` - Add item to cart
- `DELETE /api/sessions/[sessionId]/cart` - Clear cart
- `POST /api/orders` - Create order (per merchant)

## Mobile Responsiveness
- ✅ Full responsive design
- ✅ Mobile-optimized floating action button
- ✅ Touch-friendly quantity controls
- ✅ Swipe-friendly item cards

## Future Enhancements
- [ ] Cart item notes/special requests
- [ ] Save cart for later
- [ ] Cart sharing via link
- [ ] Estimated order time display
- [ ] Merchant availability checking
- [ ] Price change notifications
- [ ] Promo code support
- [ ] Minimum order requirements

## Testing Checklist
- [ ] Add items from single merchant
- [ ] Add items from multiple merchants
- [ ] Update quantities (increase/decrease)
- [ ] Remove individual items
- [ ] Clear entire cart
- [ ] Cart persists on page reload
- [ ] Cart badge updates in real-time
- [ ] Floating cart shows correct preview
- [ ] Place order successfully
- [ ] Cart clears after order
- [ ] Mobile floating button works
- [ ] Desktop expandable cart works
- [ ] Empty cart state displays correctly
- [ ] Table number validation works

## Notes
- Cart is tied to buyer session
- Cart automatically clears if session changes
- Multiple orders created for multi-merchant carts
- Payment is in-person at merchant counter
- Cart syncs with server for persistence across devices (future)
