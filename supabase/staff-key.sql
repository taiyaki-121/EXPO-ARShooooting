-- Staff key for /admin. Run in Supabase → SQL Editor.
-- Replace YOUR-STAFF-KEY with the real key before running (never commit the real key).
-- The key is compared in uppercase, so any letter case typed on /admin works.
-- To change the key later, run this whole file again with the new key.

-- 1. The only place the key lives. /admin calls it to log in.
create or replace function public.check_staff_key(staff_key text)
returns boolean language sql security definer set search_path = public as $$
  select upper(trim(coalesce(staff_key, ''))) = upper('YOUR-STAFF-KEY');
$$;

-- 2. Phase switch, guarded by the same check (drops any older version first)
do $$
declare f regprocedure;
begin
  for f in select oid::regprocedure from pg_proc
           where proname = 'set_event_phase' and pronamespace = 'public'::regnamespace
  loop execute 'drop function ' || f; end loop;
end $$;

create function public.set_event_phase(new_phase text, staff_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.check_staff_key(staff_key) then
    raise exception 'invalid staff key' using errcode = '28000';
  end if;
  if new_phase not in ('collect', 'final', 'ended') then
    raise exception 'invalid phase: %', new_phase;
  end if;
  execute format('update public.event_state set phase = %L where id = 1', new_phase);
end $$;

-- 3. Let the /admin page call both
revoke all on function public.check_staff_key(text) from public;
revoke all on function public.set_event_phase(text, text) from public;
grant execute on function public.check_staff_key(text) to anon, authenticated;
grant execute on function public.set_event_phase(text, text) to anon, authenticated;
notify pgrst, 'reload schema';
