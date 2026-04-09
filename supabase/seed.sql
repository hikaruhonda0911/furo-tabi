-- Seed data for furo-tabi
-- Source: production DB snapshot (2026-02-26)

insert into public.tags (id, name, slug) values
  ('e66209ee-d776-4a16-a723-b0f8528efa9c', '風呂トイレ別',       'separate-bath'),
  ('3ab7805b-11b0-4211-97cb-75e46814e4f0', 'シャワーブースのみ', 'shower-only'),
  ('7ef9c58e-5857-44b1-9d24-a2f9256dde59', '大浴場あり',         'public-bath'),
  ('4f2dfe95-c17b-4924-9794-8b4d34d7cbcd', 'サウナ付き',         'sauna')
on conflict (id) do nothing;

insert into public.hotels (id, rakuten_hotel_id, created_at) values
  ('b5aece03-25ea-4739-81e9-6c6adb00834a', 147490, '2026-02-26 04:45:44.901721+00'),
  ('1a5e7b64-7478-40ba-9099-e66f0ce2f2fe', 129828, '2026-02-26 04:45:44.901721+00'),
  ('8b12d414-47ba-4bdd-b424-ba5b527db09a',   9306, '2026-02-26 04:45:44.901721+00')
on conflict (id) do nothing;

insert into public.hotel_tags (hotel_id, tag_id) values
  ('b5aece03-25ea-4739-81e9-6c6adb00834a', 'e66209ee-d776-4a16-a723-b0f8528efa9c'),
  ('1a5e7b64-7478-40ba-9099-e66f0ce2f2fe', 'e66209ee-d776-4a16-a723-b0f8528efa9c'),
  ('1a5e7b64-7478-40ba-9099-e66f0ce2f2fe', '7ef9c58e-5857-44b1-9d24-a2f9256dde59'),
  ('1a5e7b64-7478-40ba-9099-e66f0ce2f2fe', '4f2dfe95-c17b-4924-9794-8b4d34d7cbcd'),
  ('8b12d414-47ba-4bdd-b424-ba5b527db09a', '3ab7805b-11b0-4211-97cb-75e46814e4f0')
on conflict (hotel_id, tag_id) do nothing;
