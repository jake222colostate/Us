-- Notification buffer helper for heart coalescing
alter table public.notif_buffer
  alter column count set default 1;

create or replace function public.bump_notif_buffer(_to uuid, _from uuid)
returns table(prior_count int, last_at timestamptz, inserted boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _existing public.notif_buffer%rowtype;
begin
  select *
    into _existing
    from public.notif_buffer
   where to_user = _to
     and from_user = _from
     and kind = 'heart'
   for update;

  if not found then
    insert into public.notif_buffer (to_user, from_user, kind, count, last_at)
    values (_to, _from, 'heart', 0, now())
    returning * into _existing;

    return query
      select 0::int as prior_count, _existing.last_at, true as inserted;
  end if;

  update public.notif_buffer
     set count = coalesce(_existing.count, 0) + 1
   where to_user = _to
     and from_user = _from
     and kind = 'heart';

  return query
    select coalesce(_existing.count, 0) as prior_count,
           _existing.last_at,
           false as inserted;
end;
$$;
