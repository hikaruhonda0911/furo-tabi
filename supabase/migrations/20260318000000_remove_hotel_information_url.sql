-- Remove hotel_information_url column.
-- Affiliate URLs are now generated at runtime from rakuten_hotel_id + RAKUTEN_AFFILIATE_ID env var.

alter table public.hotels drop column if exists hotel_information_url;

-- Recreate RPC without hotel_information_url.

drop function if exists public.get_hotels_by_tags(text[]);

create or replace function public.get_hotels_by_tags(tag_slugs text[])
returns table(
  rakuten_hotel_id integer,
  hotel_tag_slugs text[],
  separate_bath_rooms text[],
  shower_only_rooms text[]
)
language plpgsql
as $$
begin
  if array_length(tag_slugs, 1) is null then
    return query
    select h.rakuten_hotel_id,
           coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}'),
           h.separate_bath_rooms,
           h.shower_only_rooms
    from hotels h
    left join hotel_tags ht on h.id = ht.hotel_id
    left join tags t on ht.tag_id = t.id
    group by h.rakuten_hotel_id, h.separate_bath_rooms, h.shower_only_rooms;
  else
    return query
    with matched as (
      select h.id, h.rakuten_hotel_id, h.separate_bath_rooms, h.shower_only_rooms
      from hotels h
      join hotel_tags ht on h.id = ht.hotel_id
      join tags t on ht.tag_id = t.id
      where t.slug = any(tag_slugs)
      group by h.id, h.rakuten_hotel_id, h.separate_bath_rooms, h.shower_only_rooms
      having count(distinct t.id) = array_length(tag_slugs, 1)
    )
    select m.rakuten_hotel_id,
           coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}'),
           m.separate_bath_rooms,
           m.shower_only_rooms
    from matched m
    left join hotel_tags ht on m.id = ht.hotel_id
    left join tags t on ht.tag_id = t.id
    group by m.rakuten_hotel_id, m.separate_bath_rooms, m.shower_only_rooms;
  end if;
end;
$$;
