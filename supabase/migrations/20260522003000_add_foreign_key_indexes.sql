-- Add indexes for common foreign-key lookups.

create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
create index if not exists conversations_garden_idx on public.conversations(garden_id);
create index if not exists conversations_listing_idx on public.conversations(listing_id);
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists feed_posts_garden_plant_idx on public.feed_posts(garden_plant_id);
create index if not exists feed_posts_user_idx on public.feed_posts(user_id);
create index if not exists garden_follows_follower_idx on public.garden_follows(follower_id);
create index if not exists garden_plant_photos_plant_idx on public.garden_plant_photos(garden_plant_id);
create index if not exists garden_plant_photos_user_idx on public.garden_plant_photos(user_id);
create index if not exists garden_plants_source_listing_idx on public.garden_plants(source_listing_id);
create index if not exists garden_plants_user_idx on public.garden_plants(user_id);
create index if not exists gardens_user_idx on public.gardens(user_id);
create index if not exists listing_photos_listing_idx on public.listing_photos(listing_id);
create index if not exists listing_photos_seller_idx on public.listing_photos(seller_id);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists orders_buyer_idx on public.orders(buyer_id);
create index if not exists orders_listing_idx on public.orders(listing_id);
create index if not exists orders_seller_idx on public.orders(seller_id);
create index if not exists post_comments_post_idx on public.post_comments(post_id);
create index if not exists post_comments_user_idx on public.post_comments(user_id);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id);
create index if not exists reports_listing_idx on public.reports(listing_id);
create index if not exists reports_post_idx on public.reports(post_id);
create index if not exists reports_reported_user_idx on public.reports(reported_user_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reviews_reviewee_idx on public.reviews(reviewee_id);
create index if not exists reviews_reviewer_idx on public.reviews(reviewer_id);
create index if not exists seller_applications_reviewed_by_idx on public.seller_applications(reviewed_by);
create index if not exists seller_applications_user_idx on public.seller_applications(user_id);

