# Research: Food Court Ordering System

**Date**: 2025-10-05  
**Feature**: Food Court Ordering System  
**Branch**: 001-build-me-an

## Technical Decisions

### Framework Selection

**Decision**: Next.js 14+ with App Router and SSR
**Rationale**:

- Built-in SSR provides better SEO and initial load performance for mobile users
- App Router offers improved routing and layout patterns
- Built-in API routes eliminate need for separate backend
- Strong TypeScript support and development experience
- Excellent deployment ecosystem (Vercel, etc.)

**Alternatives considered**:

- Remix (lacks mature ecosystem)
- SvelteKit (smaller community, less enterprise adoption)
- Pure React SPA (poor mobile performance, SEO issues)

### UI Component Library

**Decision**: shadcn/ui with Tailwind CSS
**Rationale**:

- Mobile-first responsive design patterns built-in
- Accessibility compliance (WCAG 2.1 AA) by default
- Copy-paste components provide full control and customization
- Strong TypeScript support with proper type definitions
- Modern design system with consistent patterns

**Alternatives considered**:

- Material-UI (heavy bundle size, not mobile-optimized)
- Ant Design (complex API, overkill for this use case)
- Chakra UI (less mobile-focused, different design philosophy)

### Database and ORM

**Decision**: PostgreSQL 18 with Drizzle ORM
**Rationale**:

- PostgreSQL 18 provides excellent JSON support for flexible data structures
- Strong ACID compliance for order management
- UUID support built-in for scalable IDs
- Drizzle ORM offers type-safe queries with minimal runtime overhead
- Excellent migration system and schema management
- Better performance than Prisma for complex queries

**Alternatives considered**:

- Prisma (slower query performance, larger runtime)
- TypeORM (deprecated, complex configuration)
- Raw SQL (no type safety, harder maintenance)

### UUID Strategy

**Decision**: UUIDv7 for all primary keys
**Rationale**:

- UUIDv7 is available natively in PostgreSQL 18
- Contains timestamp information enabling natural chronological ordering
- Perfect for cursor-based pagination without additional sorting fields
- Maintains privacy by not exposing sequential ID patterns
- Distributed-friendly for potential future scaling
- Better performance than UUIDv4 for indexed operations due to timestamp ordering

**Alternatives considered**:

- UUIDv4 (random, poor performance for indexes, no timestamp info)
- Sequential integers (exposes business information, not distributed-friendly)
- ULID (additional library dependency, UUIDv7 achieves same goals natively)

### Pagination Strategy

**Decision**: Cursor-based pagination using UUIDv7 as cursor
**Rationale**:

- UUIDv7 encodes timestamp, enabling efficient chronological pagination
- Consistent performance regardless of page depth (no OFFSET penalty)
- Real-time friendly - new records don't affect pagination consistency
- Natural ordering by creation time using UUID comparison
- Better user experience with stable pagination during data changes
- Scales efficiently with large datasets

**Alternatives considered**:

- LIMIT-OFFSET pagination (poor performance at scale, inconsistent results)
- Timestamp-based cursors (additional complexity, precision issues)
- Custom pagination tokens (unnecessary complexity)

### Currency and Pricing

**Decision**: Indonesian Rupiah (IDR) stored as integers
**Rationale**:

- IDR currency naturally uses whole numbers (no cents/fractions)
- Integer storage eliminates floating-point precision errors
- Simpler calculations and comparisons
- Better performance for mathematical operations
- Consistent with Indonesian payment systems and user expectations
- Aligns with food court pricing patterns (whole rupiah amounts)

**Alternatives considered**:

- Decimal/numeric types (unnecessary precision for IDR)
- Floating-point storage (precision errors, rounding issues)
- Cent-based storage (inappropriate for IDR which doesn't use fractional units)

### Authentication Strategy

**Decision**: Session-based authentication for merchants, anonymous sessions for buyers
**Rationale**:

- Merchants need secure persistent authentication
- Buyers only need temporary session identification
- No complex OAuth requirements specified
- Simple phone number + password for merchants aligns with food court operations
- Anonymous buyer sessions reduce friction in ordering process

**Alternatives considered**:

- JWT tokens (unnecessary complexity for this scope)
- OAuth integration (not required, adds dependency)
- Magic links (poor UX for food court environment)

### WhatsApp Integration

**Decision**: WhatsApp Web URLs (wa.me) with preset messages
**Rationale**:

- Simple implementation without API complexity or authentication
- No external service dependencies or rate limiting concerns
- Works universally across all devices with WhatsApp installed
- Allows users to continue conversation in their WhatsApp app
- No webhook or message delivery tracking needed
- Cost-effective solution with no API fees

**Alternatives considered**:

- WhatsApp Business API (overkill, expensive, complex setup)
- SMS integration (more expensive, less preferred by users)
- In-app messaging (complex implementation, poor user experience)

### Image Storage and Upload

**Decision**: Filesystem storage with Multer and Sharp for image processing
**Rationale**:

- Direct filesystem storage eliminates cloud service dependencies
- Images served as Next.js static assets provide optimal performance
- Multer provides robust file upload handling with validation
- Sharp enables efficient image optimization and resizing
- Simple deployment without external storage configuration
- Cost-effective with no storage service fees

**Alternatives considered**:

- AWS S3 (unnecessary complexity and cost for this scale)
- Cloudinary (external dependency, not required)
- Database blob storage (poor performance, large database size)

### Testing Strategy

**Decision**: Jest for unit tests, Playwright for E2E tests, Drizzle testing utilities
**Rationale**:

- Jest integrates well with Next.js and provides excellent TypeScript support
- Playwright offers reliable mobile browser testing
- Drizzle testing utilities enable database transaction rollback for clean tests
- Supports the required 90% unit / 80% integration coverage targets

**Alternatives considered**:

- Vitest (newer, less ecosystem support)
- Cypress (slower than Playwright, less reliable)
- Selenium (complex setup, poor developer experience)

## Architecture Patterns

### Layered Architecture Implementation

**Decision**: Controller → Service → Repository → Database
**Rationale**:

- Clear separation of concerns as specified
- Controllers handle HTTP concerns (Next.js API routes)
- Services contain business logic with OOP interfaces
- Repositories handle data access with OOP interfaces
- Easy to test and mock each layer independently

### Error Handling Strategy

**Decision**: Centralized error handling with typed error responses
**Rationale**:

- Consistent error responses across all endpoints
- Type-safe error handling in frontend
- Proper HTTP status codes for different error types
- Logging integration for debugging and monitoring

### Validation Strategy

**Decision**: Zod schemas for runtime validation and TypeScript integration
**Rationale**:

- Type-safe validation with automatic TypeScript inference
- Runtime validation prevents database constraint violations
- Consistent validation patterns across client and server
- Excellent error messages for user feedback

## Performance Considerations

### Database Optimization

**Decisions**:

- Connection pooling with pg-pool
- Proper indexing on foreign keys and query columns
- Denormalized order data to prevent merchant updates affecting historical orders
- Efficient pagination for menu browsing

### Caching Strategy

**Decisions**:

- Next.js static generation for menu pages when possible
- Redis caching for frequently accessed merchant data
- Browser caching for static assets (images)
- Database query optimization with proper indexes

### Mobile Performance

**Decisions**:

- Progressive Web App (PWA) capabilities for offline menu browsing
- Image optimization with Next.js Image component
- Code splitting for merchant vs buyer interfaces
- Critical CSS inlining for faster initial render

## Security Considerations

### Data Protection

**Decisions**:

- Phone number hashing for buyer privacy
- Secure session management with httpOnly cookies
- Input sanitization on all user inputs
- SQL injection prevention through parameterized queries (Drizzle ORM)

### API Security

**Decisions**:

- Rate limiting on all endpoints
- CORS configuration for production domains
- CSRF protection for state-changing operations
- Secure headers (HSTS, CSP, etc.)

## Deployment Strategy

**Decision**: Vercel deployment with PostgreSQL on Railway/Supabase
**Rationale**:

- Vercel provides excellent Next.js hosting with automatic deployments
- Railway/Supabase offer managed PostgreSQL with good performance
- Environment-based configuration for development/staging/production
- Automatic SSL and CDN through Vercel

**Alternatives considered**:

- Self-hosted on AWS (more complex, higher maintenance)
- Digital Ocean App Platform (less Next.js optimization)
- Heroku (more expensive, slower deployments)
