-- Add hotel_information_url column for Rakuten affiliate links.

alter table public.hotels
  add column hotel_information_url text;
