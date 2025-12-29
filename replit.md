# ML WebDesign Business Platform

## Overview

A full-stack web application for ML WebDesign consisting of three main parts:
1. **Public Portfolio Website** - Showcases work and builds credibility for potential clients
2. **DUO Client Portal** - The client-facing portal branded as "DUO by ML WebDesign" where invited clients can manage their projects, view payments, documents, and communicate with the team
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