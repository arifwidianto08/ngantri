# Implementation Plan: Food Court Ordering System

**Branch**: `001-build-me-an` | **Date**: 2025-10-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-me-an/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

A food court ordering system enabling customers to scan QR codes at tables, browse multiple merchant menus, place orders without login, complete payment in-person, and contact merchants via WhatsApp web links. Merchants can register, upload images, manage profiles/menus, accept orders, and communicate with customers via automated WhatsApp web URLs with preset messages. The system uses Next.js SSR with mobile-first design, PostgreSQL 18 with Drizzle ORM, shadcn/ui components, file upload with filesystem storage, and implements a layered architecture with service and data layers following OOP principles.

## Technical Context

**Language/Version**: TypeScript with Next.js 14+ (SSR enabled)  
**Primary Dependencies**: Next.js, shadcn/ui, Drizzle ORM, PostgreSQL 18 driver, Multer for file uploads, Sharp for image processing  
**Storage**: PostgreSQL 18 with Drizzle ORM for data persistence, Filesystem storage for uploaded images served as Next.js static assets  
**Testing**: Jest/Vitest for unit testing, Playwright for E2E testing, Drizzle migration testing  
**Target Platform**: Web browsers (mobile-first responsive design), deployed on Vercel/similar Node.js platform
**Project Type**: Web application (Next.js SSR full-stack)  
**Performance Goals**: API endpoints <200ms p95, page loads <3s, mobile interactions <100ms  
**Constraints**: Mobile-first design only, UUIDv7 for all primary keys, cursor-based pagination only (no LIMIT-OFFSET), IDR currency (integer only), filesystem-only image uploads, in-person payment only, WhatsApp via web URLs only, layered architecture (controller-service-data)  
**Scale/Scope**: Food court environment (~10-50 merchants, ~500-1000 daily orders, 5-10 concurrent users per merchant)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**I. Code Quality Standards** ✅

- [x] Static analysis tools configured (ESLint, TypeScript strict mode, Prettier)
- [x] Code review process defined with quality criteria (PR templates, linting gates)
- [x] Technical debt tracking approach documented (GitHub Issues with technical debt labels)

**II. Test-Driven Excellence** ✅

- [x] Test coverage targets defined (90% unit, 80% integration)
- [x] TDD approach planned (Red-Green-Refactor cycle for service/data layers)
- [x] Critical user journey testing strategy outlined (E2E tests for ordering flow)
- [x] Performance regression testing approach planned (API response time monitoring)

**III. User Experience Consistency** ✅

- [x] Design system patterns identified and documented (shadcn/ui component library)
- [x] Accessibility standards compliance approach (WCAG 2.1 AA via shadcn/ui + testing)
- [x] Consistent interaction patterns defined (mobile-first responsive patterns)
- [x] User testing validation plan created (manual testing scenarios for each user journey)

**IV. Performance Requirements** ✅

- [x] SLA targets defined (API <200ms p95, pages <3s, interactions <100ms)
- [x] Resource usage limits specified (Database connection pooling, efficient queries)
- [x] Performance monitoring and alerting strategy planned (Next.js analytics + database monitoring)
- [x] Performance testing approach documented (Load testing for concurrent orders)

**Quality Gate Compliance** ✅

- [x] All five quality gates addressed in implementation plan
- [x] Gate failure remediation process defined (Block deployment, issue tracking, remediation timeline)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
src/
├── app/                     # Next.js App Router
│   ├── api/                 # API routes (controllers)
│   │   ├── merchants/       # Merchant management endpoints
│   │   ├── orders/          # Order management endpoints
│   │   ├── menus/           # Menu management endpoints
│   │   └── sessions/        # Buyer session endpoints
│   ├── merchant/            # Merchant dashboard pages
│   ├── order/               # Order management pages
│   └── globals.css          # Global styles
├── components/              # Reusable UI components (shadcn/ui)
│   ├── ui/                  # Base shadcn/ui components
│   ├── forms/               # Form components
│   ├── layout/              # Layout components
│   └── merchant/            # Merchant-specific components
├── services/                # Business logic layer (OOP interfaces)
│   ├── interfaces/          # Service interfaces
│   ├── MerchantService.ts   # Merchant business logic
│   ├── OrderService.ts      # Order business logic
│   ├── MenuService.ts       # Menu business logic
│   └── SessionService.ts    # Session business logic
├── data/                    # Data access layer (OOP interfaces)
│   ├── interfaces/          # Repository interfaces
│   ├── repositories/        # Repository implementations
│   ├── MerchantRepository.ts
│   ├── OrderRepository.ts
│   └── schema.ts            # Drizzle schema definitions
├── lib/                     # Utilities and configurations
│   ├── db.ts                # Database connection
│   ├── upload.ts            # File upload handling (Multer config)
│   ├── image.ts             # Image processing utilities (Sharp)
│   ├── whatsapp.ts          # WhatsApp URL generation utilities
│   ├── utils.ts             # Utility functions
│   └── validation.ts        # Input validation schemas
└── types/                   # TypeScript type definitions

tests/
├── __mocks__/               # Test mocks
├── e2e/                     # End-to-end tests (Playwright)
├── integration/             # Integration tests
├── unit/                    # Unit tests
└── setup.ts                 # Test configuration

public/
├── uploads/                 # Uploaded images directory
│   ├── merchants/           # Merchant profile images
│   └── menus/               # Menu item images
├── qr-codes/                # QR code images
└── assets/                  # Static application assets
```

**Structure Decision**: Selected Next.js full-stack web application structure with clear separation of concerns following the specified layered architecture: Controllers (API routes) → Services (business logic) → Data (repositories) with OOP interfaces for service and data layers while allowing functional approach for controllers.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:

   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:

   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:

   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:

   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:

   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (None required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
