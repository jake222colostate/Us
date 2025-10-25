-- Validate send_free_heart enforces a 125-per-day cap

insert into auth.users (id, email, encrypted_password)
values
  ('10000000-0000-0000-0000-000000000001', 'sender@example.com', crypt('password', gen_salt('bf'))),
  ('10000000-0000-0000-0000-000000000002', 'recipient@example.com', crypt('password', gen_salt('bf')))
on conflict (id) do nothing;

insert into profiles (user_id, username, display_name, birthdate)
values
  ('10000000-0000-0000-0000-000000000001', 'sender', 'Sender', '1990-01-01'),
  ('10000000-0000-0000-0000-000000000002', 'recipient', 'Recipient', '1990-01-01')
on conflict (user_id) do nothing;

insert into posts (user_id, photo_url, caption, created_at)
select '10000000-0000-0000-0000-000000000002',
       'https://example.com/photo/' || gs::text,
       'Test post ' || gs::text,
       now() - (gs || ' minutes')::interval
from generate_series(1, 130) as gs;

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

do $$
declare
  ids uuid[];
  idx int;
begin
  select array_agg(id order by created_at desc) into ids
  from posts
  where user_id = '10000000-0000-0000-0000-000000000002';

  for idx in 1..125 loop
    perform send_free_heart(ids[idx], '10000000-0000-0000-0000-000000000002');
  end loop;
end
$$;

select case when count(*) = 125 then 'ok' else 'failed' end as heart_cap_status
from hearts
where from_user = '10000000-0000-0000-0000-000000000001'
  and to_user = '10000000-0000-0000-0000-000000000002'
  and kind = 'normal';

do $$
declare
  ids uuid[];
  err text := '';
begin
  select array_agg(id order by created_at desc) into ids
  from posts
  where user_id = '10000000-0000-0000-0000-000000000002';

  begin
    perform send_free_heart(ids[126], '10000000-0000-0000-0000-000000000002');
  exception
    when others then
      err := sqlerrm;
  end;

  if position('FREE_HEART_LIMIT_REACHED' in coalesce(err, '')) = 0 then
    raise exception 'Expected FREE_HEART_LIMIT_REACHED but got %', err;
  end if;
end
$$;

reset "request.jwt.claim.sub";
reset "request.jwt.claim.role";
