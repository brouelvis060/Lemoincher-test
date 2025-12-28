# Design Guidelines: African E-Commerce Platform

## Design Approach
**System Selected:** Material Design with Tailwind CSS implementation
**Rationale:** Data-heavy admin dashboard + client portal requires structured, information-dense layouts with clear visual hierarchy and proven interaction patterns for forms, tables, and data visualization.

## Typography System
- **Primary Font:** Inter (Google Fonts) - clean, readable for dashboards
- **Headings:** font-bold, sizes: text-3xl (page titles), text-2xl (section headers), text-xl (card headers)
- **Body:** font-normal, text-base for forms/tables, text-sm for metadata
- **Emphasis:** font-semibold for labels, stats, CTAs

## Layout & Spacing
**Spacing Units:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Container padding: p-6 (mobile), p-8 (desktop)
- Section gaps: space-y-6 for forms, space-y-8 for page sections
- Card padding: p-6
- Between elements: gap-4 for grids, gap-2 for tight groups

**Grid System:**
- Admin Dashboard: Sidebar (w-64) + main content area (flex-1)
- Product grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Stats cards: grid-cols-2 lg:grid-cols-4
- Form layouts: max-w-2xl for single column forms, grid-cols-2 for multi-column

## Component Library

### Navigation
**Admin Sidebar:**
- Fixed left sidebar (w-64, h-screen)
- Logo at top (h-16)
- Navigation items with icons (h-12, px-4, gap-3)
- Active state: filled background
- Collapsible sections for grouped items

**Client Header:**
- Horizontal navigation (sticky top)
- Logo left, navigation center, user menu right
- Cart icon with badge counter
- Mobile: hamburger menu

### Dashboard Cards
- Rounded corners (rounded-lg)
- Subtle elevation (shadow-sm)
- Header with icon + title (flex justify-between)
- Content area with appropriate padding
- Stats cards: Large number (text-3xl font-bold), label below (text-sm)

### Data Tables
- Full-width with horizontal scroll on mobile
- Striped rows for readability
- Header row: sticky, font-semibold, text-sm uppercase
- Action buttons: icon-only in last column
- Status badges: inline with appropriate styling
- Pagination: bottom right

### Forms
- Label above input (text-sm font-medium, mb-2)
- Input fields: full width, h-12, rounded-md, border
- Help text: text-sm below inputs
- Required indicators: red asterisk
- File upload: Bordered dashed area with icon and text
- Multi-step forms: Progress indicator at top

### Badges & Status
- Client badges: Inline with avatar, icon + text
- Order status: Pill-shaped (rounded-full, px-3, py-1, text-xs font-medium)
- Different states clearly distinguished

### Buttons
- Primary CTA: h-12, px-6, rounded-lg, font-semibold
- Secondary: Outlined variant
- Icon buttons: Square (h-10 w-10), centered icon
- Button groups: gap-3

### Product Cards
- Image: aspect-square, object-cover, rounded-t-lg
- Content area: p-4
- Title: text-lg font-semibold, line-clamp-2
- Price: text-xl font-bold
- Stock indicator: text-sm
- Actions: Full-width button at bottom

### Order Tracking Timeline
- Vertical timeline on desktop, horizontal on mobile
- Circle icons for each status (connected by line)
- Active step: larger, filled
- Completed: checkmark icon
- Photo upload area: dashed border, centered

### Modals & Overlays
- Centered modal: max-w-lg on overlay
- Header with title + close button (sticky)
- Scrollable content area
- Footer with action buttons (sticky)

## Page Structures

**Admin Dashboard Home:**
- Stats overview (4-column grid)
- Recent orders table
- Quick actions section
- Charts/graphs for sales data

**Product Management:**
- Filter bar + search (top)
- Product grid/table (main)
- Bulk actions toolbar
- Add product: floating action button

**Client Homepage:**
- Hero banner: h-80, featured product/promotion
- Category cards: 2x2 grid on tablet+
- Featured products: 4-column grid
- Trust indicators section

**Product Detail Page:**
- Two-column: Image gallery (left), product info (right)
- Sticky add-to-cart section
- Tabs for description/reviews/shipping

**Checkout Flow:**
- Progress steps at top (3-4 steps)
- Single column form
- Order summary: sticky sidebar on desktop

## Images
- **Product images:** Square aspect ratio, minimum 800x800px
- **Hero banner:** 1920x600px, featuring popular products or promotions
- **User avatars:** Circular, 40x40px (lists), 96x96px (profile)
- **Receipt uploads:** Display as thumbnails with lightbox functionality
- **Logo:** Horizontal layout, max height 40px in header

## Responsive Behavior
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Mobile-first approach
- Admin sidebar: Hidden on mobile, toggle overlay
- Tables: Horizontal scroll with sticky first column
- Multi-column grids: Stack to single column on mobile
- Forms: Full-width inputs on all devices