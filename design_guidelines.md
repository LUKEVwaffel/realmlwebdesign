# Design Guidelines: Web Design Business Platform

## Design Approach

**Public Site**: Reference-based approach drawing from modern web design agencies (Webflow, BASIC Agency, Locomotive) - bold typography, generous whitespace, portfolio-first presentation

**Client/Admin Portals**: Material Design System principles - clean, functional, data-dense interfaces with clear information hierarchy

---

## Typography

**Public Site:**
- Headlines: Google Fonts "Space Grotesk" (700) - 48px-72px for hero, 36px-48px for sections
- Body: "Inter" (400, 500) - 18px-20px, line-height 1.6
- Accent text: "Space Grotesk" (500) - 14px-16px uppercase with letter-spacing

**Portals:**
- Headers: "Inter" (600, 700) - 24px-32px for page titles, 18px-20px for card headers
- Body/Data: "Inter" (400, 500) - 14px-16px for tables/forms, 12px-14px for metadata
- Monospace numbers: "JetBrains Mono" (500) - for financial amounts, percentages

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Micro spacing (form fields, buttons): 2, 4
- Component spacing: 6, 8, 12
- Section spacing: 16, 20, 24

**Grid Structure:**
- Public site: max-w-7xl container, 12-column grid for portfolio galleries
- Portals: max-w-screen-2xl, fixed sidebar (280px), fluid content area

---

## Public Portfolio Site

### Hero Section
- Full viewport height (100vh) with large background image showing modern web design work
- Centered content overlay with blur-background buttons
- Headline + subheadline + primary CTA ("View Our Work")
- Scroll indicator at bottom

### Portfolio Grid
- Masonry-style layout (not standard grid) - staggered heights for visual interest
- 3 columns desktop, 2 tablet, 1 mobile
- Each card: Full-bleed project image, overlay on hover revealing client name, industry, key features
- Subtle shadow and border-radius (rounded-xl)

### Services Section
- Horizontal card layout (4 columns) with icons from Heroicons
- Each card: Icon (bg-gray-100 rounded-full p-4), service name, 2-line description
- Use gradient background (subtle gray-50 to white)

### Contact Section
- Split layout: Left side business info with large contact details, right side map or team photo
- No form - just prominent email/phone display

---

## Client Portal Dashboard

### Navigation
- Dark sidebar (fixed left, 280px wide) with logo at top, navigation items with icons
- Top bar: Breadcrumbs, search (if needed), user avatar dropdown

### Dashboard Layout
- 3-column grid for key metrics/cards at top
- Main content area: Project overview card (full width), then 2-column layout for action items + recent activity

### Project Overview Card
- Large card with project name as header, progress bar (rounded-full with gradient fill), status badge (colored pill), timeline info
- Use rounded-lg borders, shadow-sm for card elevation

### Action Items
- Attention-grabbing cards with emoji/icon indicators
- Payment due: Red accent border-l-4, yellow background
- Signature needed: Blue accent, white background
- Prominent CTA buttons (full width within card)

### Payment Interface
- Table layout with clear column headers: Payment #, Description, Amount, Due Date, Status
- Status badges: Pending (yellow), Paid (green), Overdue (red) - all with rounded-full and colored backgrounds
- "Pay Now" buttons for pending payments launch Stripe Checkout in modal

---

## Admin Dashboard

### Client Management
- Kanban-style board OR data table with filters
- Table: Sticky header, alternating row backgrounds (gray-50), hover states
- Action buttons (eye, edit, message icons) in last column

### Project Creation Form
- Multi-step wizard (stepper at top showing progress)
- Step 1: Project type + services (checkbox grid)
- Step 2: Pricing + timeline (date pickers, currency inputs)
- Step 3: Review + confirm
- Use fieldset grouping with legend labels

### Analytics Dashboard
- 4-column metric cards at top (total clients, active projects, revenue, completion rate)
- Chart.js integration: Line chart for revenue over time, donut chart for project status breakdown
- Use soft shadow and hover lift effect on metric cards

---

## Component Library

**Buttons:**
- Primary: Solid with hover lift (shadow increase), rounded-lg, px-6 py-3
- Secondary: Outline with hover fill
- Danger: Red solid for destructive actions
- All buttons: transition-all duration-200

**Form Inputs:**
- Outlined style with focus ring (blue-500)
- Labels above inputs (text-sm font-medium)
- Helper text below (text-xs text-gray-600)
- Error states: red border + error message

**Cards:**
- White background, border gray-200, rounded-xl, shadow-sm
- Padding: p-6 for standard cards
- Hover states for interactive cards (shadow-md, translate-y-[-2px])

**Badges/Status:**
- Rounded-full, px-3 py-1, text-xs font-medium
- Color coded: Success (green-100/green-800), Warning (yellow-100/yellow-800), Error (red-100/red-800)

**Tables:**
- Minimal borders (border-b on rows)
- Sticky headers with background
- Zebra striping (gray-50 alternate rows)
- Compact padding (px-4 py-3)

**Modals:**
- Centered overlay with backdrop blur
- Max-width-2xl, rounded-2xl, shadow-2xl
- Header with close button (X icon top-right)

---

## Images

**Hero Section:** Large, high-quality image showing modern website design on multiple devices (desktop, tablet, mobile). Should convey professionalism and contemporary design aesthetics.

**Portfolio Cards:** Screenshots of actual client websites - full-page captures showing design quality. Each image should be optimized and lazy-loaded.

**About Section:** Professional photo of the two partners in casual business setting (office or co-working space).

**Document Icons:** Use Heroicons for file type indicators (document-text, photo, code-bracket).

---

## Animations

**Minimal approach:**
- Smooth page transitions (fade-in on route change)
- Progress bar animations (smooth fill with transition-all duration-500)
- Hover states on cards/buttons (transform and shadow)
- NO scroll-triggered animations or complex motion