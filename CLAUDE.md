@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Next.js 16 web frontend for Bibleway, a Christian social media + Bible learning platform. React 19, TypeScript, Tailwind CSS 4, TanStack React Query 5. Connects to the Django REST API backend.

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run dev:lite         # Lightweight dev (fewer workers)
npm run build            # Production build
npm run start            # Start production server

# Quality
npm run lint             # ESLint
npx tsc --noEmit         # Type check

# Tests
npm run test             # Run tests (Vitest)
npm run test:watch       # Watch mode
```

## Architecture

### Directory Structure

```
app/
  types/             # Centralized TypeScript interfaces (models, api, enums)
  hooks/             # Custom React hooks (useComments, useReaction, useOutsideClick)
  lib/               # Core utilities
    api.ts           # fetchAPI<T>() - generic, type-safe API client with token refresh
    endpoints.ts     # Centralized API endpoint constants (mirrors mobile app)
    storage.ts       # Type-safe localStorage wrapper
    cache.ts         # React Query cache duration configs
    constants.ts     # Shared constants (REACTIONS, LANGUAGES, VERSE_BACKGROUNDS)
    hooks.ts         # Data-fetching hooks (React Query) - being split by domain
    validation.ts    # Shared validation utilities
    contentFilter.ts # Profanity filtering
    sanitize.ts      # HTML sanitization (DOMPurify)
    i18n.tsx         # Internationalization (7 languages)
    ChatContext.tsx   # WebSocket chat state
    ThemeContext.tsx  # Dark/light theme
    QueryProvider.tsx # React Query provider
    firebase.ts      # Firebase SDK config
    useWebSocket.ts  # WebSocket hook
  components/        # Shared UI components
  [routes]/          # Next.js App Router pages
```

### Key Patterns

**API Layer**: All API calls go through `fetchAPI<T>()` in `app/lib/api.ts`. It handles auth headers, token refresh on 401, timeouts, and returns `ApiResponse<T>`. Endpoint strings are centralized in `app/lib/endpoints.ts`.

**Types**: All shared interfaces live in `app/types/` — import from `../types` or `../../types`. Matches the mobile app's type system. Key types: `Post`, `Prayer`, `Comment`, `Reply`, `FeedItem`, `UserProfile`, `BibleVersion`, `Product`, etc.

**State Management**:
- **Server state**: TanStack React Query (hooks in `app/lib/hooks.ts`)
- **Client state**: React Context (theme, chat WebSocket, i18n)
- **Persistent state**: `storage.ts` wrapper for localStorage
- **Local state**: `useState` for UI-only concerns

**Response Envelope**: Backend returns `{"message": "...", "data": {...}}`. The `fetchAPI` function returns this shape as `ApiResponse<T>`. Access data via `res.data`.

**Pagination**: Backend uses `StandardPageNumberPagination` (page-based) or `FeedCursorPagination` (cursor-based). Response shapes: `PaginatedResponse<T>` and `CursorPaginatedResponse<T>`.

## Environment

Set `NEXT_PUBLIC_API_URL` to the backend URL. Defaults to the Railway production URL.

## Key Integrations

- Firebase (Google sign-in, analytics)
- Razorpay (web payments — India only)
- DOMPurify + marked (Markdown rendering)
- React Easy Crop (image cropping)
