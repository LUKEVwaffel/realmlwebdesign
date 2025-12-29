# ML WebDesign Business Platform

## Overview

A full-stack web application for ML WebDesign consisting of three main parts:
1. **Public Portfolio Website** - Showcases work and builds credibility for potential clients
2. **DUO Client Portal** - The client-facing portal branded as "DUO" where invited clients can manage their projects, view payments, documents, and communicate with the team
3. **Admin Dashboard** - Enables business owners (Luke Vetsch & Makaio Roos) to manage all clients, projects, and business analytics

This is NOT a marketplace or application system. Clients are manually added by admins after offline conversations. The public site is purely for portfolio showcase.

## Branding
- **Company**: ML WebDesign
- **Client Portal Name**: DUO
- **Contact Email**: hello@mlwebdesign.com
- **Logos**: Light and dark mode variants in `attached_assets/` directory

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Theming**: Custom theme provider supporting light/dark modes with CSS variables

**Design System Decisions**:
- Public site uses bold typography (Space Grotesk for headlines, Inter for body)
- Portal interfaces follow Material Design principles for clean, data-dense layouts
- Consistent spacing system using Tailwind units (2, 4, 6, 8, 12, 16, 20, 24)
- Radix UI primitives for accessible component foundations

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES Modules
- **API Design**: RESTful endpoints under `/api` prefix
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schemas shared between frontend and backend

**Key Design Patterns**:
- Storage abstraction layer (`server/storage.ts`) separates data access from business logic
- Shared schema definitions (`shared/schema.ts`) ensure type safety across the stack
- Drizzle ORM with PostgreSQL for type-safe database operations
- Route handlers validate requests using Zod schemas before processing

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables and relationships
- **Migrations**: Drizzle Kit manages schema migrations in `./migrations`

**Core Database Tables**:
- `users` - Authentication and user profiles (admin/client roles)
- `clients` - Business information for client organizations
- `projects` - Web design projects with status tracking
- `payments` - Payment records with Stripe integration
- `documents` - File metadata for contracts, invoices, deliverables
- `messages` - Communication between clients and admins
- `portfolio_items` - Public portfolio showcase entries
- `activity_logs` - Audit trail for system actions

### Authentication & Authorization
- JWT tokens stored in localStorage with expiration
- Role-based access control (admin vs client)
- Protected routes redirect unauthenticated users to login
- Password reset flow with email tokens
- First-login password change requirement

### Warranty Tracking
- 25-day warranty period starts automatically when project status changes to "completed"
- Client dashboard shows warranty countdown with days remaining
- Three states: Active (green), Expiring Soon (amber, <7 days), Expired (gray)
- Admin can view all warranty statuses and send reminder emails
- Email notifications: warranty start, reminder, and expiry emails

### Revision Requests
- Clients can request revisions tagged as "minor" or "major"
- Minor: Small text changes, color adjustments, simple fixes
- Major: Layout changes, new features, structural modifications
- Admin workflow: pending -> approved/declined -> in_progress -> completed
- Tracks estimated hours and additional costs for major revisions
- Authorization ensures clients can only request revisions for their own projects

### On-Hold Tracking
- Projects can be put on hold with reason notes and expected resumption date
- On-hold fields: onHoldReason, onHoldAt, resumptionDate, onHoldByUserId
- When resuming from on-hold, all on-hold fields are automatically cleared
- Status changes via PATCH /api/admin/projects/:id/status support onHoldReason and resumptionDate params

### Resource Library
- Global resource library for TOS, guides, templates, FAQs, and videos
- Categories: guide, template, legal, faq, video, other
- Supports file uploads, external URLs, and rich text content
- Admin CRUD at /api/admin/resources
- Client access at /api/client/resources (published + visible only)
- sortOrder field for custom ordering

### Payment Tracking
- Payment status: pending, paid, overdue, cancelled, failed, refunded
- Payment types: deposit, milestone, final, addon, revision, other
- Deposit gating: Development phase requires deposit to be paid first
- Admin can override deposit check with skipDepositCheck: true parameter

### Cancellation & Refund Tracking
- Cancellation reasons: client_request, non_payment, scope_change, unresponsive_client, mutual_agreement, admin_decision, other
- Automatic fee calculation based on percentage of total paid (default 25%)
- Tracks totalPaid, workCompletedPercentage, cancellationFeeAmount, refundAmount
- API routes: POST /api/admin/projects/:id/cancel, PATCH /api/admin/cancellations/:id/refund
- Activity logging for cancellations and refund processing

### 7-Phase Development Process (Iron-Clad Workflow)
The workflow is gated - admins cannot skip phases without PIN verification.

| Phase | Status Values | Description |
|-------|---------------|-------------|
| Phase 1 | `draft` → `created` | **Client Onboarding** - Admin creates client, sends welcome email with questionnaire link |
| Phase 2 | `questionnaire_pending` → `questionnaire_complete` | **Client Questionnaire** - Client fills out project questionnaire (waiting phase for admin) |
| Phase 3 | `quote_draft` → `quote_sent` → `quote_approved` → `tos_pending` → `tos_signed` → `deposit_pending` → `deposit_paid` | **Quote & Agreement** - 3-tier quote (Basic/Advanced/Ecommerce), TOS signature, 50% deposit |
| Phase 4 | `design_pending` → `design_sent` → `design_approved` | **Design** - Admin uploads 4 template screenshots, client selects one |
| Phase 5 | `in_development` | **Website Development** - Building on Wix/Shopify, staging URL, progress tracking |
| Phase 6 | `ready_for_review` | **Ready for Review** - QA checklist, send staging link to client |
| Phase 7 | `client_review` → `revisions_pending` → `revisions_complete` → `awaiting_final_payment` → `payment_complete` | **Client Review & Delivery** - Revisions, final 50% payment |
| Phase 7A | `hosting_setup_pending` → `hosting_configured` → `completed` | **Hosting & Domain** - Client provides Hostinger credentials, admin configures DNS/SSL, final delivery |

### Workflow UI Features
- Phase timeline with visual progress indicator
- Each phase shows only relevant tools/actions
- PIN verification modal for skipping phases
- Animated transitions between phases
- Status badges with color coding

### Progress Tracking
- Automatic progress calculation based on project status
- Phase 1: 5%, Phase 2: 10-20%, Phase 3: 30-40%, Phase 4: 45-50%, Phase 5: 55-65%, Phase 6: 70-80%, Phase 7: 85-100%
- On-hold and cancelled projects show -1 (UI displays "On Hold" or "Cancelled" instead of percentage)
- Client dashboard shows visual progress bar and phase indicator
- Admin dashboard and client details include progressPercentage for each project

## External Dependencies

### Payment Processing
- **Stripe API** - Handles payment collection via Checkout Sessions

### File Storage
- **Google Cloud Storage** (`@google-cloud/storage`) - Cloud storage for documents and assets
- **Uppy** - File upload handling with AWS S3 compatibility

### Email
- **Nodemailer** - Automated emails for notifications, password resets

### Database
- **PostgreSQL** - Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM** - Type-safe query builder and schema management

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT signing secret
- Stripe API keys (for payment processing)
- Cloud storage credentials (for file uploads)