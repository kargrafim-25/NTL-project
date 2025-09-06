# Overview

Next Trading Labs is an AI-powered professional trading platform that provides real-time XAUUSD (Gold) trading signals using OpenAI's GPT-5 Mini. The platform features a subscription-based credit system, market hours validation, and premium features like Telegram group access and MT5 EA discounts for higher-tier users.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development tooling
- **UI Framework**: Radix UI components with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom color theming and dark mode support
- **State Management**: TanStack React Query for server state and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Replit OAuth integration with session management

## Backend Architecture
- **Runtime**: Node.js with Express server and TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with Passport.js and OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with automatic cleanup
- **API Design**: RESTful endpoints with structured error handling and request logging

## Database Design
- **Users Table**: Stores user profile data, subscription tiers (free/starter/pro), and credit tracking
- **Trading Signals Table**: Stores generated signals with entry/exit points, analysis, and status tracking
- **Sessions Table**: Manages user authentication sessions with automatic expiration
- **Enums**: Type-safe enums for signal direction (BUY/SELL), status, and timeframes

## Business Logic
- **Credit System**: Daily/monthly credit limits based on subscription tiers with automatic resets
- **Market Hours**: Validates trading hours using Casablanca timezone (Sunday 10PM - Friday 9PM)
- **Subscription Tiers**:
  - Free: 2 daily signals, 10 monthly signals, basic features
  - Starter: Unlimited daily signals, 60 monthly signals, Telegram access, 10% bot discounts, 20% indicator discounts, free first month
  - Pro: Unlimited signals, Telegram access, 40% bot discounts, 50% indicator discounts, free first month

## AI Integration
- **OpenAI GPT-5 Mini**: Generates real-time trading signals with technical analysis
- **No Fallback Data**: System only provides genuine AI-generated responses or clear error messages
- **Dynamic Prompting**: Customizes AI prompts based on subscription tier and timeframe selection

# External Dependencies

## Core Services
- **Neon Database**: PostgreSQL hosting with connection pooling via @neondatabase/serverless
- **OpenAI API**: GPT-5 Mini model for trading signal generation
- **TradingView**: Chart widget integration for live XAUUSD price visualization

## Authentication & Security
- **Replit Auth**: OAuth provider for user authentication and profile management
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **Session Security**: Secure HTTP-only cookies with CSRF protection

## Development Tools
- **Vite**: Development server with HMR and production bundling
- **TypeScript**: Type safety across frontend, backend, and shared schemas
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production bundle optimization for server-side code

## UI Libraries
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, and form elements
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe component variant management
- **Tailwind CSS**: Utility-first styling with custom design system

## Third-Party Integrations
- **Telegram**: Premium group access for Pro subscribers
- **MT5 EA Marketplace**: Discount system integration for Pro subscribers
- **Market Data**: Real-time price feeds for signal generation context