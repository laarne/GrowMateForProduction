-- GrowMate initial Supabase schema
-- Buyer-first marketplace, verified seller dashboard, gardens, feed, messages, and rankings.

create extension if not exists "pgcrypto";

create type public.seller_status as enum ('not_applied', 'pending', 'verified', 'rejected', 'suspended');
create type public.listing_status as enum ('draft', 'review', 'active', 'sold', 'rejected', 'blocked', 'archived');
create type public.order_status as enum ('pending', 'paid', 'completed', 'cancelled', 'refunded', 'disputed');
create type public.post_type as enum ('update', 'question', 'harvest', 'tip');
create type public.conversation_type as enum ('friend', 'market', 'garden', 'leafy', 'support');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text unique,
  avatar_url text,
  location text default 'Butuan City',
  bio text,
  seller_status public.seller_status not null default 'not_applied',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = user_id), false);
$$;

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and (new.seller_status is distinct from old.seller_status or new.is_admin is distinct from old.is_admin) then
    raise exception 'Only admins can change seller status or admin access';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_admin_fields
before update on public.profiles
for each row execute function public.protect_profile_admin_fields();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'GrowMate User'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  shop_name text,
  reason text,
  source_notes text,
  proof_photo_url text,
  id_front_url text,
  id_back_url text,
  selfie_with_id_url text,
  selfie_with_plant_url text,
  status public.seller_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger seller_applications_set_updated_at
before update on public.seller_applications
for each row execute function public.set_updated_at();

create table public.seller_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  shop_name text not null,
  seller_bio text,
  trust_score numeric(2,1) not null default 0 check (trust_score >= 0 and trust_score <= 5),
  completed_sales integer not null default 0 check (completed_sales >= 0),
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger seller_profiles_set_updated_at
before update on public.seller_profiles
for each row execute function public.set_updated_at();

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  local_name text,
  scientific_name text,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  unit text not null default 'Pot' check (unit in ('Pot', 'Cutting', 'Seedling', 'Node', 'Pack')),
  location text not null default 'Butuan City',
  delivery_option text not null default 'Delivery',
  description text,
  status public.listing_status not null default 'review',
  ai_provider text,
  ai_confidence numeric(5,2),
  ai_result jsonb not null default '{}'::jsonb,
  review_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  quantity integer not null default 1 check (quantity > 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  platform_fee numeric(10,2) not null default 0 check (platform_fee >= 0),
  status public.order_status not null default 'pending',
  meetup_or_delivery text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table public.gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'My Plant Collection',
  bio text,
  cover_photo_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger gardens_set_updated_at
before update on public.gardens
for each row execute function public.set_updated_at();

create table public.garden_plants (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  local_name text,
  scientific_name text,
  category text,
  condition text,
  care_notes text,
  source_listing_id uuid references public.listings(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger garden_plants_set_updated_at
before update on public.garden_plants
for each row execute function public.set_updated_at();

create table public.garden_plant_photos (
  id uuid primary key default gen_random_uuid(),
  garden_plant_id uuid not null references public.garden_plants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  garden_plant_id uuid references public.garden_plants(id) on delete set null,
  type public.post_type not null default 'update',
  title text,
  body text not null,
  image_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger feed_posts_set_updated_at
before update on public.feed_posts
for each row execute function public.set_updated_at();

create table public.post_reactions (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger post_comments_set_updated_at
before update on public.post_comments
for each row execute function public.set_updated_at();

create table public.garden_follows (
  garden_id uuid not null references public.gardens(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (garden_id, follower_id)
);

create table public.favorites (
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null default 'friend',
  listing_id uuid references public.listings(id) on delete set null,
  garden_id uuid references public.gardens(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, reviewer_id)
);

create table public.rank_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  points integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  post_id uuid references public.feed_posts(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create index listings_status_created_idx on public.listings(status, created_at desc);
create index listings_seller_idx on public.listings(seller_id);
create index garden_plants_garden_idx on public.garden_plants(garden_id);
create index feed_posts_public_created_idx on public.feed_posts(is_public, created_at desc);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index rank_events_user_created_idx on public.rank_events(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.seller_applications enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.orders enable row level security;
alter table public.gardens enable row level security;
alter table public.garden_plants enable row level security;
alter table public.garden_plant_photos enable row level security;
alter table public.feed_posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_comments enable row level security;
alter table public.garden_follows enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.rank_events enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = user_id), false);
$$;

create or replace function public.is_verified_seller(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select seller_status = 'verified' from public.profiles where id = user_id), false);
$$;

create policy "profiles are public readable"
on public.profiles for select
using (true);

create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id and is_admin = false);

create policy "admins can update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

create policy "users can create own seller application"
on public.seller_applications for insert
with check (auth.uid() = user_id);

create policy "users can read own seller applications"
on public.seller_applications for select
using (auth.uid() = user_id or public.is_admin());

create policy "admins can review seller applications"
on public.seller_applications for update
using (public.is_admin())
with check (public.is_admin());

create policy "seller profiles are public readable"
on public.seller_profiles for select
using (true);

create policy "admins manage seller profiles"
on public.seller_profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "active listings are public readable"
on public.listings for select
using (status = 'active' or seller_id = auth.uid() or public.is_admin());

create policy "verified sellers create listings"
on public.listings for insert
with check (auth.uid() = seller_id and public.is_verified_seller() and status in ('draft', 'review'));

create policy "sellers update own listings"
on public.listings for update
using (auth.uid() = seller_id or public.is_admin())
with check (public.is_admin() or (auth.uid() = seller_id and status in ('draft', 'review', 'archived')));

create policy "listing photos visible with listing access"
on public.listing_photos for select
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_photos.listing_id
      and (listings.status = 'active' or listings.seller_id = auth.uid() or public.is_admin())
  )
);

create policy "sellers manage own listing photos"
on public.listing_photos for all
using (auth.uid() = seller_id or public.is_admin())
with check (auth.uid() = seller_id or public.is_admin());

create policy "order participants read orders"
on public.orders for select
using (auth.uid() in (buyer_id, seller_id) or public.is_admin());

create policy "buyers create orders"
on public.orders for insert
with check (auth.uid() = buyer_id);

create policy "order participants update orders"
on public.orders for update
using (auth.uid() in (buyer_id, seller_id) or public.is_admin())
with check (auth.uid() in (buyer_id, seller_id) or public.is_admin());

create policy "public gardens readable"
on public.gardens for select
using (is_public or user_id = auth.uid() or public.is_admin());

create policy "users manage own gardens"
on public.gardens for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "public garden plants readable"
on public.garden_plants for select
using (
  exists (
    select 1 from public.gardens
    where gardens.id = garden_plants.garden_id
      and (gardens.is_public or gardens.user_id = auth.uid() or public.is_admin())
  )
);

create policy "users manage own garden plants"
on public.garden_plants for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "garden plant photos readable with garden"
on public.garden_plant_photos for select
using (
  exists (
    select 1
    from public.garden_plants
    join public.gardens on gardens.id = garden_plants.garden_id
    where garden_plants.id = garden_plant_photos.garden_plant_id
      and (gardens.is_public or gardens.user_id = auth.uid() or public.is_admin())
  )
);

create policy "users manage own garden plant photos"
on public.garden_plant_photos for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "public feed posts readable"
on public.feed_posts for select
using (is_public or user_id = auth.uid() or public.is_admin());

create policy "users manage own feed posts"
on public.feed_posts for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "post reactions readable"
on public.post_reactions for select
using (true);

create policy "users manage own reactions"
on public.post_reactions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "post comments readable"
on public.post_comments for select
using (
  exists (
    select 1 from public.feed_posts
    where feed_posts.id = post_comments.post_id
      and (feed_posts.is_public or feed_posts.user_id = auth.uid() or public.is_admin())
  )
);

create policy "users manage own comments"
on public.post_comments for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "garden follows readable"
on public.garden_follows for select
using (true);

create policy "users manage own follows"
on public.garden_follows for all
using (auth.uid() = follower_id)
with check (auth.uid() = follower_id);

create policy "favorites readable by owner"
on public.favorites for select
using (auth.uid() = user_id);

create policy "users manage own favorites"
on public.favorites for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "conversation members can read conversations"
on public.conversations for select
using (
  exists (
    select 1 from public.conversation_members
    where conversation_members.conversation_id = conversations.id
      and conversation_members.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy "authenticated users can create conversations"
on public.conversations for insert
with check (auth.uid() is not null);

create policy "members can read conversation members"
on public.conversation_members for select
using (
  exists (
    select 1 from public.conversation_members members
    where members.conversation_id = conversation_members.conversation_id
      and members.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy "users can join created conversations"
on public.conversation_members for insert
with check (auth.uid() = user_id or public.is_admin());

create policy "members can read messages"
on public.messages for select
using (
  exists (
    select 1 from public.conversation_members
    where conversation_members.conversation_id = messages.conversation_id
      and conversation_members.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy "members can send messages"
on public.messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.conversation_members
    where conversation_members.conversation_id = messages.conversation_id
      and conversation_members.user_id = auth.uid()
  )
);

create policy "order participants read reviews"
on public.reviews for select
using (true);

create policy "order participants create reviews"
on public.reviews for insert
with check (
  auth.uid() = reviewer_id
  and exists (
    select 1 from public.orders
    where orders.id = reviews.order_id
      and orders.status = 'completed'
      and auth.uid() in (orders.buyer_id, orders.seller_id)
  )
);

create policy "rank events are public readable"
on public.rank_events for select
using (true);

create policy "system/admin manage rank events"
on public.rank_events for all
using (public.is_admin())
with check (public.is_admin());

create policy "users create reports"
on public.reports for insert
with check (auth.uid() = reporter_id);

create policy "users read own reports"
on public.reports for select
using (auth.uid() = reporter_id or public.is_admin());

create policy "admins manage reports"
on public.reports for update
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('listing-photos', 'listing-photos', true),
  ('garden-photos', 'garden-photos', true),
  ('feed-photos', 'feed-photos', true),
  ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

create policy "public image buckets readable"
on storage.objects for select
using (bucket_id in ('avatars', 'listing-photos', 'garden-photos', 'feed-photos'));

create policy "users upload own public images"
on storage.objects for insert
with check (
  bucket_id in ('avatars', 'listing-photos', 'garden-photos', 'feed-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users update own public images"
on storage.objects for update
using (
  bucket_id in ('avatars', 'listing-photos', 'garden-photos', 'feed-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id in ('avatars', 'listing-photos', 'garden-photos', 'feed-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users delete own public images"
on storage.objects for delete
using (
  bucket_id in ('avatars', 'listing-photos', 'garden-photos', 'feed-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "verification docs owner/admin readable"
on storage.objects for select
using (
  bucket_id = 'verification-docs'
  and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
);

create policy "users upload own verification docs"
on storage.objects for insert
with check (
  bucket_id = 'verification-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
);
