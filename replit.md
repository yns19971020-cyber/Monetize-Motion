# replit.md

## Overview

ViralPay is a short-form video social platform where content creators can earn real money from video ads and withdraw earnings via USDC cryptocurrency. The platform combines TikTok-style video consumption with fintech transparency, featuring a dark mode UI with high contrast accents. Users can upload videos, engage with content (likes, comments, shares), follow other creators, track earnings from ad impressions, and withdraw funds to crypto wallets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 for cross-platform mobile and web support
- **Navigation**: React Navigation v7 with bottom tab navigator (5 tabs: Feed, Discover, Upload, Activity, Profile) and native stack navigator for modal screens
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: Custom themed component library with dark/light mode support via `useTheme` hook
- **Animations**: React Native Reanimated for smooth transitions and gesture handling
- **Video Playback**: expo-video for full-screen vertical video feed
- **Styling**: StyleSheet with centralized theme constants (Colors, Typography, Spacing, BorderRadius)

### Backend Architecture
- **Framework**: Express.js v5 with TypeScript
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Session Management**: express-session with connect-pg-simple for PostgreSQL-backed sessions
- **Authentication**: Session-based auth with bcryptjs for password hashing, stored in SecureStore (mobile) or localStorage (web)
- **File Uploads**: Multer for video uploads with 100MB limit, stored in local `uploads/` directory

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - contains users, videos, comments, likes, follows, notifications, withdrawals tables
- **Migrations**: Drizzle Kit for schema migrations, output to `migrations/` directory
- **Validation**: drizzle-zod for schema-based validation

### Project Structure
```
client/           # React Native frontend
  components/     # Reusable UI components
  screens/        # Screen components for each route
  navigation/     # Navigation configuration
  lib/            # Auth context, query client
  hooks/          # Custom React hooks
  constants/      # Theme, colors, typography
server/           # Express backend
  index.ts        # Server entry point, middleware setup
  routes.ts       # API route handlers
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
```

### Path Aliases
- `@/*` maps to `./client/*`
- `@shared/*` maps to `./shared/*`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication & Security
- **bcryptjs**: Password hashing
- **expo-secure-store**: Secure token storage on mobile devices
- **express-session**: Server-side session management

### Media & Storage
- **Multer**: Video file upload handling
- **Local filesystem**: Video files stored in `uploads/` directory (consider cloud storage for production)

### External Services (Planned/Implied)
- **USDC Withdrawals**: Wallet integration for BEP20/ERC20 networks (wallet address stored, actual crypto integration not yet implemented)

### Key NPM Packages
- `expo-video`, `expo-image`, `expo-camera`, `expo-image-picker`: Media handling
- `react-native-reanimated`, `react-native-gesture-handler`: Animations and gestures
- `@tanstack/react-query`: Data fetching and caching
- `@shopify/flash-list`: Performant list rendering for video feeds