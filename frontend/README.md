# Outbox - Frontend Dashboard

This is the user interface for the Outbox scheduling engine. It allows authenticated users to compose emails, attach files, schedule deliveries, and track real-time queue states.

## 🎨 Tech Stack
- **Next.js (App Router)**: Modern React framework for routing and server-side rendering.
- **Tailwind CSS**: Utility-first CSS framework for replicating the Figma design.
- **TypeScript**: Static typing for React components and API payloads.
- **Supabase Auth (Google OAuth)**: Secure social login and session management.
- **Lucide React**: Modern iconography.

## ✨ Features
- **Google OAuth Flow**: Fully integrated authentication blocking access to protected routes.
- **Dashboard Hub**: Dedicated tabs for tracking Scheduled, Sent, and Draft emails.
- **Compose Interface**: 
  - Dynamic recipient parsing (supports comma-separated emails).
  - Rich text area.
  - Native file attachment support (sends multipart/form-data to the backend).
  - Date and time picker for future scheduling.
- **Live State Feedback**: Displays correct pill badges for job states (Scheduled vs Sent vs Failed).

## ⚙️ Running Locally

1. Ensure your backend is running on `http://localhost:4000`.
2. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).
