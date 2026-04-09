-- Initial schema for furo-tabi
-- Captured from production Supabase (project: xpkrcftnyhcpfhpmhjlw)

create extension if not exists "uuid-ossp" with schema extensions;

-- =============================================================
-- Tables
-- =============================================================

create table public.hotels (
  id               uuid        primary key default extensions.uuid_generate_v4(),
  rakuten_hotel_id integer     not null unique,
  created_at       timestamptz default now()
);

create table public.tags (
  id   uuid primary key default extensions.uuid_generate_v4(),
  name text not null unique,
  slug text not null unique
);

create table public.hotel_tags (
  hotel_id uuid not null references public.hotels(id),
  tag_id   uuid not null references public.tags(id),
  primary key (hotel_id, tag_id)
);

-- =============================================================
-- RPC: get_hotels_by_tags (initial version)
-- =============================================================

create or replace function public.get_hotels_by_tags(tag_slugs text[])
returns table(rakuten_hotel_id integer)
language plpgsql
as $$
begin
  if array_length(tag_slugs, 1) is null then
    return query select h.rakuten_hotel_id from hotels h;
  else
    return query
    select h.rakuten_hotel_id
    from hotels h
    join hotel_tags ht on h.id = ht.hotel_id
    join tags t on ht.tag_id = t.id
    where t.slug = any(tag_slugs)
    group by h.id, h.rakuten_hotel_id
    having count(distinct t.id) = array_length(tag_slugs, 1);
  end if;
end;
$$;
