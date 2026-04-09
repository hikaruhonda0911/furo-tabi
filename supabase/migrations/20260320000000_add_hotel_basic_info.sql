-- Add hotel basic info columns for dateless search (no Rakuten API dependency)
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS min_charge INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prefecture TEXT NOT NULL DEFAULT '';
