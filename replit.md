# Lemoincher - African E-Commerce Platform

## Overview

Lemoincher is a full-stack e-commerce platform designed for African markets, specifically targeting Côte d'Ivoire. The platform consists of two main interfaces: a customer-facing storefront for browsing products and placing orders, and an admin dashboard for managing products, orders, users, and settings.

The application supports French language, Mobile Money payment integration, location-based shipping calculations (with special handling for Abidjan), and SMS notifications. It implements a client loyalty system with "faithful client" and "bird client" designations that affect payment options.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for auth/cart/theme
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (supports light/dark mode)
- **File Uploads**: Uppy with AWS S3-compatible presigned URL uploads

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API under `/api/*` prefix
- **Authentication**: Custom password hashing with scrypt, session stored in localStorage (client-side)
- **File Storage**: Google Cloud Storage via Replit's object storage integration with presigned URLs

### Data Layer
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` directory are imported by both client (`@shared/*`) and server
- **Storage Abstraction**: `server/storage.ts` provides an interface layer over database operations
- **Context Providers**: Auth, Cart, Theme, and SiteSettings wrapped at app root
- **Component Organization**: UI primitives in `components/ui/`, feature components in `components/admin/` and `components/client/`

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Scripts**: `npm run dev` for development, `npm run build` for production, `npm run db:push` for migrations

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe query builder and schema management

### Cloud Storage
- **Google Cloud Storage**: File uploads via Replit's object storage integration
- **Presigned URLs**: Two-step upload flow - request URL from backend, upload directly to storage

### Payment Integration
- **Mobile Money**: Configured for Orange Money, MTN Money, and Wave (settings stored in database)
- **Cash on Delivery**: Available based on user loyalty status

### SMS Notifications
- SMS settings configurable through admin panel (provider details stored in `smsSettings` table)

### UI Dependencies
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **React Hook Form + Zod**: Form handling with validation
- **Embla Carousel**: Product image carousels
- **Recharts**: Dashboard analytics charts

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)
- **TypeScript**: Strict mode with path aliases configured