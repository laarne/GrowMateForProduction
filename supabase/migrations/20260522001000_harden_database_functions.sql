-- Tighten helper functions after initial schema creation.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = user_id), false);
$$;

create or replace function public.is_verified_seller(user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((select seller_status = 'verified' from public.profiles where id = user_id), false);
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.protect_profile_admin_fields() from anon, authenticated;

