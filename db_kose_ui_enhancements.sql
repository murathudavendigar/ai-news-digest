-- Köşe Yazıları UI Enhancements — v1.9.3
-- Run this in Supabase SQL Editor

-- 1. Add view_count column to columns table
ALTER TABLE columns ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- 2. Create atomic increment RPC function
CREATE OR REPLACE FUNCTION increment_view_count(p_column_id uuid)
RETURNS void AS $$
  UPDATE columns SET view_count = view_count + 1 WHERE id = p_column_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Create columnist_follows table (anonymous analytics)
CREATE TABLE IF NOT EXISTS columnist_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  columnist_slug text NOT NULL,
  action text NOT NULL CHECK (action IN ('follow', 'unfollow')),
  created_at timestamptz DEFAULT now()
);

-- RLS for columnist_follows
ALTER TABLE columnist_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert follows" ON columnist_follows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read follows" ON columnist_follows
  FOR SELECT USING (true);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_columnist_follows_slug ON columnist_follows(columnist_slug);
