-- Update RPC to also return hotel_information_url.

drop function if exists public.get_hotels_by_tags(text[]);

create or replace function public.get_hotels_by_tags(tag_slugs text[])
returns table(
  rakuten_hotel_id integer,
  hotel_tag_slugs text[],
  separate_bath_rooms text[],
  shower_only_rooms text[],
  hotel_information_url text
)
language plpgsql
as $$
begin
  if array_length(tag_slugs, 1) is null then
    return query
    select h.rakuten_hotel_id,
           coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}'),
           h.separate_bath_rooms,
           h.shower_only_rooms,
           h.hotel_information_url
    from hotels h
    left join hotel_tags ht on h.id = ht.hotel_id
    left join tags t on ht.tag_id = t.id
    group by h.rakuten_hotel_id, h.separate_bath_rooms, h.shower_only_rooms, h.hotel_information_url;
  else
    return query
    with matched as (
      select h.id, h.rakuten_hotel_id, h.separate_bath_rooms, h.shower_only_rooms, h.hotel_information_url
      from hotels h
      join hotel_tags ht on h.id = ht.hotel_id
      join tags t on ht.tag_id = t.id
      where t.slug = any(tag_slugs)
      group by h.id, h.rakuten_hotel_id, h.separate_bath_rooms, h.shower_only_rooms, h.hotel_information_url
      having count(distinct t.id) = array_length(tag_slugs, 1)
    )
    select m.rakuten_hotel_id,
           coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}'),
           m.separate_bath_rooms,
           m.shower_only_rooms,
           m.hotel_information_url
    from matched m
    left join hotel_tags ht on m.id = ht.hotel_id
    left join tags t on ht.tag_id = t.id
    group by m.rakuten_hotel_id, m.separate_bath_rooms, m.shower_only_rooms, m.hotel_information_url;
  end if;
end;
$$;
