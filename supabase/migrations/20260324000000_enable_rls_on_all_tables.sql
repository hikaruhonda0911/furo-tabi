-- Enable Row Level Security on all tables
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_tags ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read all data (public read access)
CREATE POLICY "Public read access for hotels"
  ON public.hotels FOR SELECT
  USING (true);

CREATE POLICY "Public read access for tags"
  ON public.tags FOR SELECT
  USING (true);

CREATE POLICY "Public read access for hotel_tags"
  ON public.hotel_tags FOR SELECT
  USING (true);

-- Deny all write operations for anonymous users
-- (Service role key bypasses RLS, so admin operations still work)
