insert into auth.users (id, email, encrypted_password)
values
  ('00000000-0000-0000-0000-000000000001', 'alex@example.com', crypt('password', gen_salt('bf')))
  on conflict (id) do nothing;

insert into profiles (user_id, username, display_name, bio, birthdate, photo_urls, radius_km)
values
  ('00000000-0000-0000-0000-000000000001', 'alex', 'Alex', 'Love exploring new places.', '1995-03-12', ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'], 40)
  on conflict (user_id) do nothing;

insert into posts (user_id, photo_url, caption)
values
  ('00000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 'Sunset vibes.');

insert into remote_config (key, value)
values ('free_heart', jsonb_build_object('daily_cap', 125))
on conflict (key) do update set value = excluded.value, updated_at = now();
