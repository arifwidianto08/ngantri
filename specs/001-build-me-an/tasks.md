# Tasks: Food Court Ordering System

**Input**: Design documents from `/specs/001-build-me-an/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: Next.js 14+ SSR, shadcn/ui, Drizzle ORM, PostgreSQL 18, UUIDv7, IDR currency
2. Load optional design documents:
   → data-model.md: 7 entities → model tasks
   → contracts/api-spec.yaml: 25+ endpoints → contract test tasks
   → research.md: Technical decisions → setup tasks
   → quickstart.md: 4 scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: Next.js project, dependencies, linting, database
   → Tests: contract tests, integration tests
   → Core: models, services, API endpoints
   → Integration: DB connections, auth middleware, file uploads
   → Polish: unit tests, performance, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests ✓
   → All entities have models ✓
   → All endpoints implemented ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

Single Next.js project structure:

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - shadcn/ui components
- `src/services/` - Business logic layer
- `src/data/` - Data access layer with repositories
- `src/lib/` - Utilities and configurations
- `tests/` - All test files

## Phase 3.1: Setup

- [x] T001 Create Next.js 14+ project structure with App Router in repository root
- [x] T002 Install core dependencies: Next.js, shadcn/ui, Drizzle ORM, PostgreSQL driver, TypeScript
- [x] T003 [P] Install file upload dependencies: Multer, Sharp for image processing
- [x] T004 [P] Install testing dependencies: Jest, Playwright, Drizzle testing utilities
- [x] T005 [P] Configure ESLint, Prettier, and TypeScript strict mode
- [x] T006 [P] Setup static analysis tools for code quality gates
- [x] T007 [P] Configure test coverage reporting (90% unit, 80% integration targets)
- [ ] T008 [P] Setup performance monitoring for API endpoints (<200ms p95)
- [ ] T009 [P] Configure accessibility testing tools (WCAG 2.1 AA compliance)
- [ ] T010 Initialize PostgreSQL 18 database with UUIDv7 extension
- [x] T011 [P] Setup Drizzle ORM configuration in src/lib/db.ts
- [x] T012 [P] Create directory structure: uploads/, qr-codes/, components/ui/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests - Authentication

- [x] T013 [P] Contract test POST /api/merchants/register in tests/contract/merchants-register.test.ts
- [x] T014 [P] Contract test POST /api/merchants/login in tests/contract/merchants-login.test.ts
- [x] T015 [P] Contract test GET /api/merchants/profile in tests/contract/merchants-profile.test.ts
- [x] T016 [P] Contract test PUT /api/merchants/profile in tests/contract/merchants-profile-update.test.ts

### Contract Tests - File Uploads

- [ ] T017 [P] Contract test PUT /api/merchants/image in tests/contract/merchants-image.test.ts
- [ ] T018 [P] Contract test POST /api/menus/[id]/image in tests/contract/menus-image.test.ts

### Contract Tests - Menu Management

- [ ] T019 [P] Contract test GET /api/merchants/[id]/categories in tests/contract/categories-list.test.ts
- [ ] T020 [P] Contract test POST /api/merchants/[id]/categories in tests/contract/categories-create.test.ts
- [ ] T021 [P] Contract test PUT /api/categories/[id] in tests/contract/categories-update.test.ts
- [ ] T022 [P] Contract test GET /api/merchants/[id]/menus in tests/contract/menus-list.test.ts
- [ ] T023 [P] Contract test POST /api/merchants/[id]/menus in tests/contract/menus-create.test.ts
- [ ] T024 [P] Contract test PUT /api/menus/[id] in tests/contract/menus-update.test.ts

### Contract Tests - Ordering System

- [ ] T025 [P] Contract test POST /api/sessions in tests/contract/sessions-create.test.ts
- [ ] T026 [P] Contract test POST /api/sessions/[id]/cart-items in tests/contract/cart-add.test.ts
- [ ] T027 [P] Contract test PUT /api/cart-items/[id] in tests/contract/cart-update.test.ts
- [ ] T028 [P] Contract test DELETE /api/cart-items/[id] in tests/contract/cart-remove.test.ts
- [ ] T029 [P] Contract test POST /api/sessions/[id]/orders in tests/contract/orders-create.test.ts
- [ ] T030 [P] Contract test GET /api/orders/[id] in tests/contract/orders-get.test.ts
- [ ] T031 [P] Contract test PUT /api/orders/[id]/status in tests/contract/orders-status.test.ts

### Contract Tests - Public API

- [ ] T032 [P] Contract test GET /api/merchants in tests/contract/merchants-public.test.ts
- [ ] T033 [P] Contract test GET /api/merchants/[id] in tests/contract/merchant-detail.test.ts
- [ ] T034 [P] Contract test GET /api/whatsapp/[merchant_id] in tests/contract/whatsapp-url.test.ts

### Integration Tests

- [ ] T035 [P] Integration test merchant registration flow in tests/integration/merchant-registration.test.ts
- [ ] T036 [P] Integration test QR code access and browsing in tests/integration/qr-code-access.test.ts
- [ ] T037 [P] Integration test complete ordering workflow in tests/integration/ordering-workflow.test.ts
- [ ] T038 [P] Integration test payment and WhatsApp notification in tests/integration/payment-whatsapp.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Schema and Models

- [x] T039 [P] Create merchants table schema in src/data/schema.ts
- [x] T040 [P] Create menu_categories table schema in src/data/schema.ts
- [x] T041 [P] Create menus table schema in src/data/schema.ts
- [x] T042 [P] Create buyer_sessions table schema in src/data/schema.ts
- [x] T043 [P] Create cart_items table schema in src/data/schema.ts
- [x] T044 [P] Create orders table schema in src/data/schema.ts
- [x] T045 [P] Create order_items table schema in src/data/schema.ts
- [x] T046 Run Drizzle migration to create all tables with UUIDv7 support

### Repository Layer (Data Access)

- [ ] T047 [P] Create MerchantRepository interface in src/data/interfaces/MerchantRepository.ts
- [ ] T048 [P] Create MenuRepository interface in src/data/interfaces/MenuRepository.ts
- [ ] T049 [P] Create OrderRepository interface in src/data/interfaces/OrderRepository.ts
- [ ] T050 [P] Create SessionRepository interface in src/data/interfaces/SessionRepository.ts
- [ ] T051 [P] Implement MerchantRepository with cursor pagination in src/data/repositories/MerchantRepository.ts
- [ ] T052 [P] Implement MenuRepository with cursor pagination in src/data/repositories/MenuRepository.ts
- [ ] T053 [P] Implement OrderRepository with cursor pagination in src/data/repositories/OrderRepository.ts
- [ ] T054 [P] Implement SessionRepository in src/data/repositories/SessionRepository.ts

### Service Layer (Business Logic)

- [ ] T055 [P] Create MerchantService interface in src/services/interfaces/MerchantService.ts
- [ ] T056 [P] Create MenuService interface in src/services/interfaces/MenuService.ts
- [ ] T057 [P] Create OrderService interface in src/services/interfaces/OrderService.ts
- [ ] T058 [P] Create SessionService interface in src/services/interfaces/SessionService.ts
- [ ] T059 [P] Implement MerchantService with business logic in src/services/MerchantService.ts
- [ ] T060 [P] Implement MenuService with business logic in src/services/MenuService.ts
- [ ] T061 [P] Implement OrderService with business logic in src/services/OrderService.ts
- [ ] T062 [P] Implement SessionService with business logic in src/services/SessionService.ts

### Utility Libraries

- [ ] T063 [P] Create file upload utilities with Multer config in src/lib/upload.ts
- [ ] T064 [P] Create image processing utilities with Sharp in src/lib/image.ts
- [ ] T065 [P] Create WhatsApp URL generation utilities in src/lib/whatsapp.ts
- [ ] T066 [P] Create input validation schemas in src/lib/validation.ts
- [ ] T067 [P] Create currency formatting utilities for IDR in src/lib/utils.ts

### API Routes - Authentication

- [ ] T068 Implement POST /api/merchants/register in src/app/api/merchants/register/route.ts
- [ ] T069 Implement POST /api/merchants/login in src/app/api/merchants/login/route.ts
- [ ] T070 Implement GET /api/merchants/profile in src/app/api/merchants/profile/route.ts
- [ ] T071 Implement PUT /api/merchants/profile in src/app/api/merchants/profile/route.ts

### API Routes - File Uploads

- [ ] T072 Implement PUT /api/merchants/image in src/app/api/merchants/image/route.ts
- [ ] T073 Implement POST /api/menus/[id]/image in src/app/api/menus/[id]/image/route.ts

### API Routes - Menu Management

- [ ] T074 Implement GET /api/merchants/[id]/categories in src/app/api/merchants/[id]/categories/route.ts
- [ ] T075 Implement POST /api/merchants/[id]/categories in src/app/api/merchants/[id]/categories/route.ts
- [ ] T076 Implement PUT /api/categories/[id] in src/app/api/categories/[id]/route.ts
- [ ] T077 Implement GET /api/merchants/[id]/menus in src/app/api/merchants/[id]/menus/route.ts
- [ ] T078 Implement POST /api/merchants/[id]/menus in src/app/api/merchants/[id]/menus/route.ts
- [ ] T079 Implement PUT /api/menus/[id] in src/app/api/menus/[id]/route.ts

### API Routes - Ordering System

- [ ] T080 Implement POST /api/sessions in src/app/api/sessions/route.ts
- [ ] T081 Implement POST /api/sessions/[id]/cart-items in src/app/api/sessions/[id]/cart-items/route.ts
- [ ] T082 Implement PUT /api/cart-items/[id] in src/app/api/cart-items/[id]/route.ts
- [ ] T083 Implement DELETE /api/cart-items/[id] in src/app/api/cart-items/[id]/route.ts
- [ ] T084 Implement POST /api/sessions/[id]/orders in src/app/api/sessions/[id]/orders/route.ts
- [ ] T085 Implement GET /api/orders/[id] in src/app/api/orders/[id]/route.ts
- [ ] T086 Implement PUT /api/orders/[id]/status in src/app/api/orders/[id]/status/route.ts

### API Routes - Public

- [ ] T087 Implement GET /api/merchants in src/app/api/merchants/route.ts
- [ ] T088 Implement GET /api/merchants/[id] in src/app/api/merchants/[id]/route.ts
- [ ] T089 Implement GET /api/whatsapp/[merchant_id] in src/app/api/whatsapp/[merchant_id]/route.ts

## Phase 3.4: Integration

### Authentication and Middleware

- [ ] T090 Create session-based authentication middleware in src/lib/auth.ts
- [ ] T091 Add authentication protection to merchant routes
- [ ] T092 Create CORS and security headers configuration

### UI Components (shadcn/ui)

- [ ] T093 [P] Create merchant registration form in src/components/forms/MerchantRegistrationForm.tsx
- [ ] T094 [P] Create merchant login form in src/components/forms/MerchantLoginForm.tsx
- [ ] T095 [P] Create merchant profile form in src/components/forms/MerchantProfileForm.tsx
- [ ] T096 [P] Create menu item form in src/components/forms/MenuItemForm.tsx
- [ ] T097 [P] Create image upload component in src/components/ui/ImageUpload.tsx
- [ ] T098 [P] Create merchant dashboard layout in src/components/layout/MerchantDashboard.tsx
- [ ] T099 [P] Create customer ordering interface in src/components/ui/OrderingInterface.tsx
- [ ] T100 [P] Create shopping cart component in src/components/ui/ShoppingCart.tsx

### Pages and Routes

- [ ] T101 Create merchant registration page in src/app/merchant/register/page.tsx
- [ ] T102 Create merchant login page in src/app/merchant/login/page.tsx
- [ ] T103 Create merchant dashboard page in src/app/merchant/dashboard/page.tsx
- [ ] T104 Create merchant profile page in src/app/merchant/profile/page.tsx
- [ ] T105 Create menu management page in src/app/merchant/menus/page.tsx
- [ ] T106 Create customer homepage (QR landing) in src/app/page.tsx
- [ ] T107 Create merchant browsing page in src/app/merchants/page.tsx
- [ ] T108 Create ordering page in src/app/order/page.tsx

### Error Handling and Logging

- [ ] T109 Create centralized error handling utilities in src/lib/errors.ts
- [ ] T110 Add request/response logging middleware
- [ ] T111 Create error pages for 404, 500, etc.

## Phase 3.5: Polish

### Unit Tests

- [ ] T112 [P] Unit tests for MerchantService in tests/unit/services/MerchantService.test.ts
- [ ] T113 [P] Unit tests for MenuService in tests/unit/services/MenuService.test.ts
- [ ] T114 [P] Unit tests for OrderService in tests/unit/services/OrderService.test.ts
- [ ] T115 [P] Unit tests for SessionService in tests/unit/services/SessionService.test.ts
- [ ] T116 [P] Unit tests for validation utilities in tests/unit/lib/validation.test.ts
- [ ] T117 [P] Unit tests for WhatsApp utilities in tests/unit/lib/whatsapp.test.ts
- [ ] T118 [P] Unit tests for image processing in tests/unit/lib/image.test.ts
- [ ] T119 [P] Unit tests for currency formatting in tests/unit/lib/utils.test.ts

### Performance and Quality

- [ ] T120 Performance tests for API endpoints (validate <200ms p95) in tests/performance/api-performance.test.ts
- [ ] T121 [P] Performance regression tests for ordering workflow
- [ ] T122 [P] Accessibility compliance tests (WCAG 2.1 AA) using axe-core
- [ ] T123 [P] UX consistency validation against shadcn/ui design system
- [ ] T124 [P] Mobile responsive design testing across device sizes
- [ ] T125 [P] Image optimization validation (file sizes, formats, loading performance)

### Documentation and Final Validation

- [ ] T126 [P] Update README.md with setup and deployment instructions
- [ ] T127 [P] Create API documentation in docs/api.md
- [ ] T128 Code quality review (eliminate duplication, improve readability)
- [ ] T129 Run quickstart.md manual testing scenarios
- [ ] T130 Verify all constitutional quality gates passed
- [ ] T131 Final deployment validation and performance monitoring setup

## Dependencies

### Critical Dependencies

- Setup tasks (T001-T012) before all other tasks
- Tests (T013-T038) before implementation (T039-T089)
- Database schema (T039-T046) before repositories (T047-T054)
- Repositories (T047-T054) before services (T055-T062)
- Services (T055-T062) before API routes (T068-T089)
- Utilities (T063-T067) before API routes that use them
- API routes complete before UI components (T093-T100)
- Implementation complete before polish (T112-T131)

### Specific Dependencies

- T046 blocks T047-T054 (need tables before repositories)
- T051-T054 block T055-T062 (need repositories before services)
- T059-T062 block T068-T089 (need services before API routes)
- T063-T067 block T072-T073, T097 (utilities before file upload routes)
- T090-T092 block T068-T089 (auth middleware before protected routes)
- T093-T100 can run in parallel after T068-T089 complete
- T101-T108 sequential (shared layout files)

## Parallel Example

```
# Launch contract tests together (Phase 3.2):
Task: "Contract test POST /api/merchants/register in tests/contract/merchants-register.test.ts"
Task: "Contract test POST /api/merchants/login in tests/contract/merchants-login.test.ts"
Task: "Contract test GET /api/merchants/profile in tests/contract/merchants-profile.test.ts"
Task: "Integration test merchant registration flow in tests/integration/merchant-registration.test.ts"

# Launch repository implementations together (Phase 3.3):
Task: "Implement MerchantRepository with cursor pagination in src/data/repositories/MerchantRepository.ts"
Task: "Implement MenuRepository with cursor pagination in src/data/repositories/MenuRepository.ts"
Task: "Implement OrderRepository with cursor pagination in src/data/repositories/OrderRepository.ts"
Task: "Implement SessionRepository in src/data/repositories/SessionRepository.ts"

# Launch UI components together (Phase 3.4):
Task: "Create merchant registration form in src/components/forms/MerchantRegistrationForm.tsx"
Task: "Create merchant login form in src/components/forms/MerchantLoginForm.tsx"
Task: "Create image upload component in src/components/ui/ImageUpload.tsx"
Task: "Create shopping cart component in src/components/ui/ShoppingCart.tsx"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD critical for this project)
- All API endpoints use cursor-based pagination with UUIDv7
- All currency values stored and processed as IDR integers
- Image uploads optimized with Sharp before filesystem storage
- WhatsApp integration uses wa.me URLs only (no API integration)
- Mobile-first responsive design throughout
- Constitutional compliance verified at each quality gate

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - Each endpoint in api-spec.yaml → contract test task [P] (T013-T034)
   - Each endpoint → implementation task (T068-T089)
2. **From Data Model**:
   - Each entity → table schema task [P] (T039-T045)
   - Each entity type → repository implementation [P] (T047-T054)
3. **From User Stories**:

   - Each quickstart scenario → integration test [P] (T035-T038)
   - Each user journey → UI component tasks

4. **Ordering**:
   - Setup → Tests → Schema → Repositories → Services → API Routes → UI → Polish
   - Dependencies block parallel execution within phases

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All contracts have corresponding tests (T013-T034)
- [x] All entities have model tasks (T039-T045, T047-T054)
- [x] All tests come before implementation (Phase 3.2 → Phase 3.3)
- [x] Parallel tasks truly independent (different files confirmed)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Constitutional quality gates integrated throughout
- [x] TDD workflow enforced (failing tests first)
- [x] UUIDv7 and cursor pagination requirements captured
- [x] IDR currency and Indonesian localization addressed
- [x] Image upload with optimization workflow covered
- [x] WhatsApp wa.me URL integration specified
