# Outbox Frontend Dashboard

A modern, responsive Next.js web application for scheduling, composing, and tracking outbound email campaigns.

## Overview

The Outbox Frontend is the user-facing interface for the scheduling engine. Built on the **Next.js App Router**, it provides a seamless single-page application experience. It features strict route protection via **Supabase Google OAuth**, a rich compose interface with attachment support, and a responsive dashboard that precisely matches the provided Figma design specifications.

---

## Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | Next.js (App Router) | React Server Components and file-based routing |
| **Language** | TypeScript | Strong typing for API payloads and component props |
| **Styling** | Tailwind CSS | Utility-first, highly responsive design system |
| **Authentication** | Supabase Auth | Secure, production-ready Google OAuth |
| **Icons & UI** | Lucide React & Sonner | Crisp SVG iconography and elegant toast notifications |

---

## Core Features

- **Google OAuth Integration**: Complete social login flow out-of-the-box. Unauthenticated users are strictly locked out of the dashboard routes.
- **Rich Compose Modal**: 
  - Parses comma-separated recipient lists automatically.
  - Supports native file uploads via `multipart/form-data`.
  - Configurable delay (throttling) and hourly limit settings.
  - Interactive DateTime picker for future scheduling.
- **Live Status Tracking**: Dedicated views for **Scheduled**, **Sent**, and **Drafts** with colorful status badges and empty-state handling.
- **Dark Mode**: Fully supports Next-Themes for seamless switching between Light and Dark mode interfaces.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js** (v18.x or newer)
- **Supabase Account** (Ensure Google OAuth is enabled in your Supabase Auth Providers setting)
- The Outbox Backend must be running on port `4000`.

### 2. Configure Environment Variables
Create a `.env.local` file at the root of the `frontend` directory. 

```env
# Backend API Reference
NEXT_PUBLIC_API_URL=http://localhost:4000

# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Install & Run
Install the necessary NPM packages and boot up the Next.js development server:

```bash
npm install
npm run dev
```

### 4. Access the Dashboard
Navigate to [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the login screen where you can authenticate with Google and access the main scheduling hub.

---

## Directory Structure Overview

- `src/app/auth`: Login and authentication routes.
- `src/app/dashboard`: The protected main layout and navigation views (Scheduled, Sent, Drafts).
- `src/app/dashboard/compose`: The core form logic and UI for scheduling new campaigns.
- `src/components/ui`: Reusable, atomic design components (Buttons, Dropzones).
- `src/lib`: API clients, Supabase singletons, and utility functions.
