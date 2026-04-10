-- ============================================================
-- SlopGuard — Supabase Database Schema
-- ============================================================
-- Run this in your Supabase SQL editor:
-- https://app.supabase.com → SQL Editor → New Query → Paste → Run
-- ============================================================


-- ── 1. Profiles ─────────────────────────────────────────────
-- Extends Supabase's built-in auth.users table.
-- Created automatically on first login via the auth trigger below.

CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    credits_limit   INTEGER NOT NULL DEFAULT 10,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 2. Scans ─────────────────────────────────────────────────
-- Every scan result is stored here.

CREATE TABLE IF NOT EXISTS public.scans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    modality        TEXT NOT NULL CHECK (modality IN ('text', 'code', 'image')),
    slop_score      INTEGER NOT NULL CHECK (slop_score BETWEEN 0 AND 100),
    verdict         TEXT NOT NULL,
    confidence      TEXT NOT NULL,
    features        JSONB NOT NULL DEFAULT '{}',
    input_preview   TEXT NOT NULL DEFAULT '',    -- first 300 chars of input
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user history queries
CREATE INDEX IF NOT EXISTS scans_user_id_created_at
    ON public.scans (user_id, created_at DESC);

-- Index for daily credit counting
CREATE INDEX IF NOT EXISTS scans_user_id_date
    ON public.scans (user_id, created_at);


-- ── 3. Row Level Security ────────────────────────────────────
-- Users can only read/write their own data.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans    ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own row
CREATE POLICY "profiles: own row only"
    ON public.profiles
    FOR ALL
    USING (auth.uid() = id);

-- Scans: users see only their own scans
CREATE POLICY "scans: own rows only"
    ON public.scans
    FOR ALL
    USING (auth.uid() = user_id);

-- Service role bypass (used by FastAPI backend with service key)
-- The service role key bypasses RLS automatically — no policy needed.


-- ── 4. Helpful views ─────────────────────────────────────────

-- Per-user daily scan count (useful for debugging credit issues)
CREATE OR REPLACE VIEW public.daily_scan_counts AS
SELECT
    user_id,
    DATE(created_at) AS scan_date,
    COUNT(*)         AS scan_count
FROM public.scans
GROUP BY user_id, DATE(created_at)
ORDER BY scan_date DESC;
