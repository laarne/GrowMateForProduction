-- Fix RLS vulnerability on reviews and trigger bypass for service role

-- 1. Drop the permissive order participants read reviews policy and replace with a strict participant check
drop policy if exists "order participants read reviews" on public.reviews;

create policy "order participants read reviews"
on public.reviews for select
using (
  exists (
    select 1 from public.orders
    where orders.id = reviews.order_id
      and (auth.uid() = orders.buyer_id or auth.uid() = orders.seller_id)
  )
  or public.is_admin()
);

-- 2. Update the protect_profile_admin_fields trigger function to allow service role / postgres bypass
create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bypass validation checks for system operations, migrations, triggers, and service role actions
  if session_user = 'postgres' or
     current_setting('role', true) = 'service_role' or
     (auth.role() = 'service_role') or
     public.is_admin() then
    return new;
  end if;

  if (new.seller_status is distinct from old.seller_status or new.is_admin is distinct from old.is_admin) then
    raise exception 'Only admins can change seller status or admin access';
  end if;
  return new;
end;
$$;
