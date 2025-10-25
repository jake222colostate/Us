-- Verify get_feed_interleaved never returns consecutive posts from the same user
with sample as (
  select * from get_feed_interleaved('00000000-0000-0000-0000-000000000001', 20, 0, 100)
),
violations as (
  select count(*) as cnt
  from (
    select user_id,
      lag(user_id) over (order by created_at desc) as prev_user
    from sample
  ) t
  where prev_user = user_id
)
select case when cnt = 0 then 'ok' else 'violation' end as status from violations;
