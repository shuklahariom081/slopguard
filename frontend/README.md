# 🛡️ SlopGuard — Frontend

> Next.js 14 web application for SlopGuard AI slop detection platform.

## Pages
- `/` — Landing page
- `/login` — Sign in / Sign up
- `/scan` — Main scanner (Text, Code, Image)
- `/dashboard` — Scan history
- `/pricing` — Pricing plans

## Setup

npm install
npm run dev

Open http://localhost:3000

## Environment Variables

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000

## Tech Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase Auth
- Lucide React icons

## Part of SlopGuard

This frontend connects to the FastAPI backend in /backend.
Full project README is in the root folder.