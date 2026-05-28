-- Secure marketplace order writes and conversation creation behind validated RPCs.

drop policy if exists "buyers create orders" on public.orders;
drop policy if exists "order participants update orders" on public.orders;
drop policy if exists "admins update orders" on public.orders;

create policy "admins update orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

create or replace function public.current_user_is_conversation_member(
  p_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

drop policy if exists "conversation members can read conversations" on public.conversations;
create policy "conversation members can read conversations"
on public.conversations for select
using (public.current_user_is_conversation_member(id) or public.is_admin());

drop policy if exists "members can read conversation members" on public.conversation_members;
create policy "members can read conversation members"
on public.conversation_members for select
using (public.current_user_is_conversation_member(conversation_id) or public.is_admin());

drop policy if exists "members can read messages" on public.messages;
create policy "members can read messages"
on public.messages for select
using (public.current_user_is_conversation_member(conversation_id) or public.is_admin());

drop policy if exists "members can send messages" on public.messages;
create policy "members can send messages"
on public.messages for insert
with check (auth.uid() = sender_id and public.current_user_is_conversation_member(conversation_id));

create or replace function public.create_order_for_listing(
  p_listing_id uuid,
  p_quantity integer default 1,
  p_delivery_option text default 'Delivery'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_listing record;
  v_order_id uuid;
  v_quantity integer := greatest(coalesce(p_quantity, 1), 1);
  v_delivery_option text := left(nullif(trim(coalesce(p_delivery_option, 'Delivery')), ''), 120);
  v_subtotal numeric(10,2);
begin
  if v_buyer_id is null then
    raise exception 'Sign in before placing an order';
  end if;

  select id, seller_id, price, quantity, status
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found or v_listing.status <> 'active' then
    raise exception 'Listing is not available';
  end if;

  if v_listing.seller_id = v_buyer_id then
    raise exception 'You cannot order your own listing';
  end if;

  if v_quantity > v_listing.quantity then
    raise exception 'Requested quantity is not available';
  end if;

  v_subtotal := round((v_listing.price * v_quantity)::numeric, 2);

  insert into public.orders (
    listing_id,
    buyer_id,
    seller_id,
    quantity,
    subtotal,
    platform_fee,
    status,
    meetup_or_delivery
  )
  values (
    v_listing.id,
    v_buyer_id,
    v_listing.seller_id,
    v_quantity,
    v_subtotal,
    round((v_subtotal * 0.10)::numeric, 2),
    'pending',
    coalesce(v_delivery_option, 'Delivery')
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

create or replace function public.update_order_status_secure(
  p_order_id uuid,
  p_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  if v_user_id is null then
    raise exception 'Sign in before updating an order';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if public.is_admin(v_user_id) then
    update public.orders
    set status = p_status
    where id = p_order_id;
    return;
  end if;

  if v_user_id = v_order.seller_id then
    if not (
      (v_order.status = 'pending' and p_status in ('accepted', 'cancelled')) or
      (v_order.status = 'paid' and p_status = 'completed')
    ) then
      raise exception 'Seller cannot change order from % to %', v_order.status, p_status;
    end if;
  elsif v_user_id = v_order.buyer_id then
    if not (
      (v_order.status = 'pending' and p_status = 'cancelled') or
      (v_order.status = 'accepted' and p_status = 'paid') or
      (v_order.status = 'paid' and p_status = 'completed')
    ) then
      raise exception 'Buyer cannot change order from % to %', v_order.status, p_status;
    end if;
  else
    raise exception 'You are not part of this order';
  end if;

  update public.orders
  set status = p_status
  where id = p_order_id;
end;
$$;

create or replace function public.get_or_create_market_conversation(
  p_listing_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_listing record;
  v_conversation_id uuid;
begin
  if v_buyer_id is null then
    raise exception 'Sign in before starting a conversation';
  end if;

  select id, seller_id, name, status
  into v_listing
  from public.listings
  where id = p_listing_id;

  if not found or v_listing.status <> 'active' then
    raise exception 'Listing is not available';
  end if;

  if v_listing.seller_id = v_buyer_id then
    raise exception 'You cannot message yourself about your own listing';
  end if;

  select c.id
  into v_conversation_id
  from public.conversations c
  where c.type = 'market'
    and c.listing_id = v_listing.id
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = c.id and cm.user_id = v_buyer_id
    )
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = c.id and cm.user_id = v_listing.seller_id
    )
  order by c.created_at asc
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (type, listing_id, title)
  values ('market', v_listing.id, 'Inquiry: ' || left(v_listing.name, 100))
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (v_conversation_id, v_buyer_id),
    (v_conversation_id, v_listing.seller_id);

  return v_conversation_id;
end;
$$;

create or replace function public.get_or_create_direct_conversation(
  p_other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in before starting a conversation';
  end if;

  if p_other_user_id is null then
    raise exception 'Conversation member is required';
  end if;

  if p_other_user_id = v_user_id then
    raise exception 'You cannot message yourself';
  end if;

  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'User not found';
  end if;

  select c.id
  into v_conversation_id
  from public.conversations c
  where c.type = 'friend'
    and c.listing_id is null
    and c.garden_id is null
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = c.id and cm.user_id = v_user_id
    )
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = c.id and cm.user_id = p_other_user_id
    )
  order by c.created_at asc
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (type)
  values ('friend')
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (v_conversation_id, v_user_id),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

create or replace function public.mark_conversation_read(
  p_conversation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Sign in before updating a conversation';
  end if;

  if not public.current_user_is_conversation_member(p_conversation_id) then
    raise exception 'You are not part of this conversation';
  end if;

  update public.conversation_members
  set last_read_at = now()
  where conversation_id = p_conversation_id
    and user_id = v_user_id;
end;
$$;

revoke execute on function public.create_order_for_listing(uuid, integer, text) from public;
revoke execute on function public.update_order_status_secure(uuid, public.order_status) from public;
revoke execute on function public.get_or_create_market_conversation(uuid) from public;
revoke execute on function public.get_or_create_direct_conversation(uuid) from public;
revoke execute on function public.current_user_is_conversation_member(uuid) from public;
revoke execute on function public.mark_conversation_read(uuid) from public;

grant execute on function public.create_order_for_listing(uuid, integer, text) to authenticated;
grant execute on function public.update_order_status_secure(uuid, public.order_status) to authenticated;
grant execute on function public.get_or_create_market_conversation(uuid) to authenticated;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
grant execute on function public.current_user_is_conversation_member(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
