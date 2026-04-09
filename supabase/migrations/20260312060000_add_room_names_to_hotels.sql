-- Add room name arrays for bathroom type display on hotel cards.

alter table public.hotels
  add column separate_bath_rooms text[] not null default '{}',
  add column shower_only_rooms  text[] not null default '{}';
