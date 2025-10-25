-- Validate bump_notif_buffer increments counts and flags new rows
insert into auth.users (id, email, encrypted_password)
values
  ('20000000-0000-0000-0000-000000000001', 'liker@example.com', crypt('password', gen_salt('bf'))),
  ('20000000-0000-0000-0000-000000000002', 'owner@example.com', crypt('password', gen_salt('bf')))
on conflict (id) do nothing;

insert into profiles (user_id, username, display_name, birthdate)
values
  ('20000000-0000-0000-0000-000000000001', 'liker', 'Liker', '1990-01-01'),
  ('20000000-0000-0000-0000-000000000002', 'owner', 'Owner', '1990-01-01')
on conflict (user_id) do nothing;

do $$
declare
  r record;
begin
  select * into r from bump_notif_buffer('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001');
  if not r.inserted then
    raise exception 'Expected inserted flag to be true on first bump';
  end if;
  if r.prior_count <> 0 then
    raise exception 'Expected prior_count 0 on first bump but got %', r.prior_count;
  end if;
end;
$$;

select case when count = 0 then 'ok' else 'failed' end as initial_buffer_count
from notif_buffer
where to_user = '20000000-0000-0000-0000-000000000002'
  and from_user = '20000000-0000-0000-0000-000000000001'
  and kind = 'heart';

do $$
declare
  r record;
begin
  select * into r from bump_notif_buffer('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001');
  if r.inserted then
    raise exception 'Expected inserted flag to be false on subsequent bump';
  end if;
  if r.prior_count <> 0 then
    raise exception 'Expected prior_count 0 on second bump but got %', r.prior_count;
  end if;
end;
$$;

select case when count = 1 then 'ok' else 'failed' end as accumulated_buffer_count
from notif_buffer
where to_user = '20000000-0000-0000-0000-000000000002'
  and from_user = '20000000-0000-0000-0000-000000000001'
  and kind = 'heart';
