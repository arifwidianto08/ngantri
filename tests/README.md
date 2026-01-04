# Test Suite Documentation

This directory contains comprehensive tests for the ngantri food ordering system, including unit tests, API tests, and E2E tests.

## Test Structure

```
tests/
├── api/                    # API integration tests (separated by user role)
│   ├── admin.test.ts      # Admin-only endpoints (/api/admin/*)
│   ├── merchants.test.ts  # Merchant dashboard endpoints (/api/merchants/*)
│   ├── customer.test.ts   # Customer-facing endpoints (sessions, orders, payments)
│   ├── menus.test.ts      # (Deprecated - see admin.test.ts and customer.test.ts)
│   ├── orders.test.ts     # (Deprecated - see customer.test.ts, admin.test.ts, merchants.test.ts)
│   └── sessions.test.ts   # (Deprecated - see customer.test.ts)
├── e2e/                   # End-to-end tests (Playwright)
│   ├── shopping-cart.spec.ts      # Shopping cart user flow
│   ├── checkout.spec.ts           # Checkout and order placement
│   ├── admin-dashboard.spec.ts    # Admin dashboard features
│   ├── merchant-dashboard.spec.ts # Merchant dashboard features
│   └── menu-browsing.spec.ts      # Menu browsing experience
├── utils.ts              # Shared test utilities and helpers
└── setup.js             # Test environment setup
```

## Test Organization by Role

### Admin Tests (`admin.test.ts`)
Tests for admin-only endpoints:
- Admin authentication (login/logout)
- Merchant management (CRUD operations)
- Category management
- Menu management
- Order oversight
- Dashboard statistics

**Test Credentials** (from seeder):
- Username: `admin`
- Password: `admin123`

### Merchant Tests (`merchants.test.ts`)
Tests for merchant dashboard endpoints:
- Merchant authentication (register/login/logout)
- Category browsing
- Menu management for own merchant
- Order management (view, update status)
- Dashboard statistics

**Test Credentials** (from seeder):
- Phone: `+6281234567890`
- Password: `password123`
- Merchant: Warung Nasi Padang Sederhana

### Customer Tests (`customer.test.ts`)
Tests for public/customer-facing endpoints:
- Public merchant browsing
- Menu browsing by merchant
- Session creation and management
- Shopping cart operations
- Order placement
- Payment creation and status
- Order tracking

**No authentication required** for most endpoints.

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Suite

```bash
# Admin endpoints only
npm test -- admin.test.ts

# Merchant endpoints only
npm test -- merchants.test.ts

# Customer endpoints only
npm test -- customer.test.ts
```

### API Tests Only

```bash
npm run test:api
```

### E2E Tests Only (requires running server)

```bash
npm run test:e2e
```


### Coverage Report

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## API Tests

Located in `tests/api/`, these tests validate API endpoints:

- **cart.test.ts**: Tests for cart operations (add, bulk add, delete)
- **orders.test.ts**: Tests for order creation, retrieval, and status updates
- **menus.test.ts**: Tests for menu listing, creation, and availability
- **sessions.test.ts**: Tests for session management

Run with:

```bash
npm run test:api
```

## E2E Tests (Playwright)

Located in `tests/e2e/`, these tests simulate real user interactions:

- **shopping-cart.spec.ts**: Complete cart flow (add, update, remove items)
- **checkout.spec.ts**: Checkout process and order placement
- **admin-dashboard.spec.ts**: Admin dashboard navigation and features
- **merchant-dashboard.spec.ts**: Merchant dashboard operations
- **menu-browsing.spec.ts**: Customer menu browsing experience

### Prerequisites

- Development server running on `http://localhost:3000`
- Database seeded with test data

### Run E2E Tests

```bash
# Start dev server
npm run dev

# In another terminal
npm run test:e2e

# View test results
npm run test:e2e:ui
```

## Contract Tests

Located in `tests/contract/`, these tests verify API contract compliance:

- Merchant registration
- Merchant login
- Merchant profile operations
- Image upload handling

Run with:

```bash
npm run test:contract
```

## Test Utilities

The `tests/utils.ts` file provides helper functions:

```typescript
// Create a test session
const sessionId = await createTestSession();

// Get test data
const menus = await getTestMenus(5);
const merchants = await getTestMerchants(5);
const categories = await getTestCategories();

// Create test order
const order = await createTestOrder(sessionId, merchantId, items);

// Cart operations
await addToCart(sessionId, menuId, quantity);
await bulkAddToCart(sessionId, items);
await clearCart(sessionId);

// Assert helpers
assertSuccessResponse(response);
assertErrorResponse(response, "expected error message");
```

## Writing Tests

### API Test Template

```typescript
describe("Feature API", () => {
  it("should perform action", async () => {
    const res = await fetch(`${BASE_URL}/endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
```

### E2E Test Template

```typescript
test("should complete user flow", async ({ page }) => {
  await page.goto("/");

  await page.locator("[data-testid='element']").click();

  await expect(page).toHaveURL(/\/expected-url/);
});
```

## Best Practices

1. **Use data-testid attributes**: Make elements easily selectable in E2E tests
2. **Isolate tests**: Each test should be independent and not rely on others
3. **Clean up**: Use beforeEach/afterEach for setup and teardown
4. **Mock external services**: Use appropriate mocks for third-party APIs
5. **Keep tests focused**: One assertion or user flow per test
6. **Meaningful names**: Use descriptive test names that explain what's being tested
7. **Error handling**: Always test both success and failure scenarios

## Coverage Requirements

The project enforces the following coverage thresholds:

- **Branches**: 80%
- **Functions**: 90%
- **Lines**: 90%
- **Statements**: 90%

View coverage:

```bash
npm run test:coverage
```

## Debugging Tests

### Debug API Tests

```bash
node --inspect-brk node_modules/.bin/jest tests/api/cart.test.ts
```

### Debug E2E Tests

```bash
npm run test:e2e -- --debug
```

### View E2E Test Results

```bash
npm run test:e2e:ui
```

## CI/CD Integration

Tests are configured to run in CI environments:

- API tests run on every push
- E2E tests run on pull requests (with retries)
- Coverage reports are generated
- Test results are reported

## Troubleshooting

### "Cannot find module" errors

```bash
npm install
npm run build
```

### API tests failing locally

- Ensure dev server is running: `npm run dev`
- Check database has seed data: `npm run db:seed`
- Verify API responses match expected format

### E2E tests timing out

- Increase timeout: `test.setTimeout(30000)`
- Check server is running and responsive
- Verify test selectors (data-testid) exist in components

### Port conflicts

If port 3000 is in use, set a different one:

```bash
PORT=3001 npm run dev
# Then update playwright.config.ts baseURL
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
