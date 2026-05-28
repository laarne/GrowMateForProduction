-- ============================================================
-- GrowMate Mock Seed Data
-- Account: jm3677545555555555@gmail.com
--
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard → your project
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Paste ALL of this script
-- 5. Click "Run" (or press Ctrl+Enter)
-- ============================================================

-- Step 1: Set seller_status to 'verified' bypassing the RLS trigger
-- (Must be done as service role / SQL editor which has superuser access)
UPDATE public.profiles
SET
  display_name  = 'JM Plants',
  username      = 'jm_plants',
  location      = 'Butuan City',
  bio           = 'Plant enthusiast from Butuan City 🌿 I grow, collect and trade healthy indoor plants. Leafy AI verified seller.',
  seller_status = 'verified'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'jm3677545555555555@gmail.com' LIMIT 1
);

-- Step 2: Insert all mock data in a DO block
DO $$
DECLARE
  v_user_id    uuid;
  v_buyer_id   uuid;
  v_garden_id  uuid;

  p_monstera   uuid := gen_random_uuid();
  p_pothos     uuid := gen_random_uuid();
  p_syngonium  uuid := gen_random_uuid();
  p_pilea      uuid := gen_random_uuid();
  p_peace_lily uuid := gen_random_uuid();
  p_snake      uuid := gen_random_uuid();
  p_zz         uuid := gen_random_uuid();
  p_calathea   uuid := gen_random_uuid();

  l_monstera   uuid := gen_random_uuid();
  l_pothos     uuid := gen_random_uuid();
  l_syngonium  uuid := gen_random_uuid();
  l_snake      uuid := gen_random_uuid();

BEGIN

  -- Resolve user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jm3677545555555555@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User jm3677545555555555@gmail.com not found. Sign up first in the app.';
  END IF;

  -- ── Seller profile ────────────────────────────────────────
  INSERT INTO public.seller_profiles (user_id, shop_name, seller_bio, trust_score, completed_sales)
  VALUES (
    v_user_id,
    'JM Plants & Co.',
    'Passionate plant propagator from Butuan City. All plants grown with love, organically. Leafy AI scanned before every listing. Fast response, safe packaging guaranteed. 14 happy buyers and counting! 🌿',
    4.8,
    14
  )
  ON CONFLICT (user_id) DO UPDATE
    SET shop_name       = EXCLUDED.shop_name,
        seller_bio      = EXCLUDED.seller_bio,
        trust_score     = EXCLUDED.trust_score,
        completed_sales = EXCLUDED.completed_sales;

  -- ── Garden ────────────────────────────────────────────────
  SELECT id INTO v_garden_id
  FROM public.gardens
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_garden_id IS NULL THEN
    INSERT INTO public.gardens (user_id, name, bio, is_public)
    VALUES (
      v_user_id,
      'JM''s Indoor Jungle',
      'My personal indoor plant collection 🌿 Mostly aroids, tropicals and low-light beauties from Butuan City.',
      true
    )
    RETURNING id INTO v_garden_id;
  END IF;

  -- ── Garden plants (8 plants) ──────────────────────────────
  INSERT INTO public.garden_plants
    (id, garden_id, user_id, name, local_name, scientific_name, category, condition, care_notes)
  VALUES
    (p_monstera, v_garden_id, v_user_id,
     'Monstera', 'Monstera', 'Monstera deliciosa', 'Indoor', 'Healthy',
     'Water once a week. Bright indirect light. Wipe leaves monthly for shine.'),

    (p_pothos, v_garden_id, v_user_id,
     'Golden Pothos', 'Devil''s Ivy', 'Epipremnum aureum', 'Indoor', 'Thriving',
     'Water when top soil is dry. Low to bright indirect light. Very easy care.'),

    (p_syngonium, v_garden_id, v_user_id,
     'Syngonium Pink', 'Arrowhead Plant', 'Syngonium podophyllum', 'Indoor', 'Healthy',
     'Keep soil moist but not soggy. High humidity preferred. Pink fades in low light.'),

    (p_pilea, v_garden_id, v_user_id,
     'Pilea', 'Chinese Money Plant', 'Pilea peperomioides', 'Indoor', 'Growing',
     'Rotate weekly for even growth. Water thoroughly then let drain completely.'),

    (p_peace_lily, v_garden_id, v_user_id,
     'Peace Lily', 'Peace Lily', 'Spathiphyllum wallisii', 'Indoor', 'Blooming',
     'Tolerates low light. Water when slightly drooping. Mist for humidity.'),

    (p_snake, v_garden_id, v_user_id,
     'Snake Plant', 'Mother-in-Law''s Tongue', 'Sansevieria trifasciata', 'Indoor', 'Thriving',
     'Water every 2-3 weeks. Tolerates any light. Never overwater — root rot kills it.'),

    (p_zz, v_garden_id, v_user_id,
     'ZZ Plant', 'Zanzibar Gem', 'Zamioculcas zamiifolia', 'Indoor', 'Healthy',
     'Water sparingly every 2-3 weeks. Extremely drought tolerant. Indirect light.'),

    (p_calathea, v_garden_id, v_user_id,
     'Calathea Medallion', 'Prayer Plant', 'Calathea veitchiana', 'Indoor', 'Needs Care',
     'Use filtered water — sensitive to fluoride. High humidity essential. No direct sun.')

  ON CONFLICT (id) DO NOTHING;

  -- ── Feed posts (5 posts, mixed types) ─────────────────────
  INSERT INTO public.feed_posts
    (user_id, garden_plant_id, type, body, is_public, created_at)
  VALUES
    (v_user_id, p_monstera, 'harvest',
     '🌿 Finally harvested my first Monstera cutting! The node is healthy and already showing aerial roots. Leafy AI confirmed it''s safe to sell — listing it on the marketplace now. DM me if you''re interested before it goes live!',
     true, now() - interval '5 days'),

    (v_user_id, p_pothos, 'update',
     'Day 30 update on my Golden Pothos propagation project 🪴 Started with 6 cuttings in water — 4 now have strong roots and are potted. The water propagation trick really works! Change water every 3 days, bright indirect light, and patience 🙌',
     true, now() - interval '4 days'),

    (v_user_id, p_calathea, 'question',
     'My Calathea Medallion leaves are curling even though I water regularly. I''m using tap water — could that be the problem? Humidity is 60% with a pebble tray. Any plant parents experienced this? 🙏',
     true, now() - interval '3 days'),

    (v_user_id, p_snake, 'tip',
     '💡 Pro tip for Snake Plant owners: STOP overwatering! Root rot is the #1 killer of Sansevierias. I water mine every 2-3 weeks in summer and once a month in the rainy season. Let the soil dry out COMPLETELY between waterings. Your snake plant will be grateful! 🐍🌱',
     true, now() - interval '2 days'),

    (v_user_id, p_syngonium, 'update',
     'New Syngonium Pink arrived via trade with a fellow plant parent! 💕 Look at those gorgeous variegated leaves. Already repotted in fresh aroid mix (perlite + bark + coco coir). Fingers crossed it adjusts well to Butuan''s humidity. Will update in 2 weeks! 🌸',
     true, now() - interval '1 day')

  ON CONFLICT DO NOTHING;

  -- ── Listings (4 active, Leafy AI verified) ────────────────
  INSERT INTO public.listings
    (id, seller_id, name, local_name, scientific_name, category,
     price, quantity, unit, location, delivery_option, description,
     status, ai_provider, ai_confidence, ai_result, published_at)
  VALUES
    -- 1. Monstera Cutting
    (l_monstera, v_user_id,
     'Monstera Deliciosa', 'Monstera', 'Monstera deliciosa', 'Indoor',
     350.00, 2, 'Cutting', 'Butuan City', 'Delivery',
     'Healthy Monstera cutting with 1 node and visible aerial roots. Leafy AI scanned — safe to sell, no protected species flags. Grown organically, never exposed to pesticides. Will be wrapped in moist sphagnum moss for delivery. Serious buyers only please.',
     'active', 'plant.id', 91.5,
     '{"bestMatch":"Monstera deliciosa","confidence":91.5,"saleStatus":"safe_to_sell","category":"Indoor","reviewReason":"No protected-species flag detected. Safe to trade locally."}',
     now() - interval '3 days'),

    -- 2. Golden Pothos Pot
    (l_pothos, v_user_id,
     'Golden Pothos', 'Devil''s Ivy', 'Epipremnum aureum', 'Indoor',
     150.00, 5, 'Pot', 'Butuan City', 'Delivery',
     'Bushy Golden Pothos in 4-inch nursery pot. Very easy to care for — perfect for beginners! Long trailing vines, full and healthy. Great for shelves, hanging baskets, or desk plants. Leafy AI verified safe to sell.',
     'active', 'plant.id', 95.2,
     '{"bestMatch":"Epipremnum aureum","confidence":95.2,"saleStatus":"safe_to_sell","category":"Indoor","reviewReason":"Common household plant. No restrictions."}',
     now() - interval '2 days'),

    -- 3. Syngonium Pink Seedling
    (l_syngonium, v_user_id,
     'Syngonium Pink', 'Arrowhead Plant', 'Syngonium podophyllum', 'Indoor',
     220.00, 3, 'Seedling', 'Butuan City', 'Delivery',
     'Beautiful pink-variegated Syngonium seedlings, approx. 3 months old. Healthy root system in premium aroid mix. Pink coloration is stable and vibrant. Each seedling individually wrapped for safe delivery. Limited stock!',
     'active', 'plant.id', 88.7,
     '{"bestMatch":"Syngonium podophyllum","confidence":88.7,"saleStatus":"safe_to_sell","category":"Indoor","reviewReason":"Common ornamental plant. No export restrictions."}',
     now() - interval '1 day'),

    -- 4. Snake Plant Pot
    (l_snake, v_user_id,
     'Snake Plant', 'Mother-in-Law''s Tongue', 'Sansevieria trifasciata', 'Indoor',
     280.00, 4, 'Pot', 'Butuan City', 'Delivery',
     'Mature snake plant in 6-inch decorative pot. Standing 40-50cm tall with multiple healthy offshoots. Virtually indestructible — perfect for offices, bedrooms, or busy people. Air-purifying and ultra low-maintenance. Leafy AI verified. Free care guide included.',
     'active', 'plant.id', 97.0,
     '{"bestMatch":"Sansevieria trifasciata","confidence":97.0,"saleStatus":"safe_to_sell","category":"Indoor","reviewReason":"Very common household plant. No restrictions apply."}',
     now() - interval '12 hours')

  ON CONFLICT (id) DO NOTHING;

  -- ── Rank events ───────────────────────────────────────────
  INSERT INTO public.rank_events (user_id, source, points, metadata)
  VALUES
    (v_user_id, 'listing_created',   10, '{"listing":"Monstera Deliciosa"}'),
    (v_user_id, 'listing_created',   10, '{"listing":"Golden Pothos"}'),
    (v_user_id, 'listing_created',   10, '{"listing":"Syngonium Pink"}'),
    (v_user_id, 'listing_created',   10, '{"listing":"Snake Plant"}'),
    (v_user_id, 'post_created',       5, '{"type":"harvest"}'),
    (v_user_id, 'post_created',       5, '{"type":"update"}'),
    (v_user_id, 'post_created',       5, '{"type":"question"}'),
    (v_user_id, 'post_created',       5, '{"type":"tip"}'),
    (v_user_id, 'post_created',       5, '{"type":"update"}'),
    (v_user_id, 'garden_plant_added', 3, '{"plant":"Monstera"}'),
    (v_user_id, 'garden_plant_added', 3, '{"plant":"Golden Pothos"}'),
    (v_user_id, 'garden_plant_added', 3, '{"plant":"Syngonium"}'),
    (v_user_id, 'sale_completed',    25, '{"note":"completed_14_sales"}')
  ON CONFLICT DO NOTHING;

  -- ── Orders (4 varied orders for testing) ──────────────────
  SELECT id INTO v_buyer_id
  FROM public.profiles
  WHERE id != v_user_id
  LIMIT 1;

  IF v_buyer_id IS NOT NULL THEN
    -- Delete existing orders to avoid duplicates and have a fresh varied list
    DELETE FROM public.orders WHERE buyer_id = v_buyer_id;

    -- Order 1: Monstera Deliciosa (status: pending, subtotal: 350.00, qty: 1)
    INSERT INTO public.orders (listing_id, buyer_id, seller_id, quantity, subtotal, platform_fee, status, meetup_or_delivery)
    VALUES (
      l_monstera,
      v_buyer_id,
      v_user_id,
      1,
      350.00,
      35.00,
      'pending',
      'Delivery'
    );

    -- Order 2: Golden Pothos (status: accepted, subtotal: 150.00, qty: 1)
    INSERT INTO public.orders (listing_id, buyer_id, seller_id, quantity, subtotal, platform_fee, status, meetup_or_delivery)
    VALUES (
      l_pothos,
      v_buyer_id,
      v_user_id,
      1,
      150.00,
      15.00,
      'accepted',
      'Delivery'
    );

    -- Order 3: Syngonium Pink (status: paid, subtotal: 440.00, qty: 2)
    INSERT INTO public.orders (listing_id, buyer_id, seller_id, quantity, subtotal, platform_fee, status, meetup_or_delivery)
    VALUES (
      l_syngonium,
      v_buyer_id,
      v_user_id,
      2,
      440.00,
      44.00,
      'paid',
      'Delivery'
    );

    -- Order 4: Snake Plant (status: completed, subtotal: 280.00, qty: 1)
    INSERT INTO public.orders (listing_id, buyer_id, seller_id, quantity, subtotal, platform_fee, status, meetup_or_delivery)
    VALUES (
      l_snake,
      v_buyer_id,
      v_user_id,
      1,
      280.00,
      28.00,
      'completed',
      'Delivery'
    );

    RAISE NOTICE '   ✔ 4 varied orders seeded for buyer: %', v_buyer_id;
  ELSE
    RAISE NOTICE '   ⚠ No buyer profile found. Order seeding skipped. Sign up in the app first!';
  END IF;

  RAISE NOTICE '✅ Seed complete!';
  RAISE NOTICE '   User ID    : %', v_user_id;
  RAISE NOTICE '   Garden ID  : %', v_garden_id;
  RAISE NOTICE '   ✔ Profile updated → verified seller @ JM Plants & Co.';
  RAISE NOTICE '   ✔ Seller profile created (trust: 4.8, sales: 14)';
  RAISE NOTICE '   ✔ 8 garden plants added';
  RAISE NOTICE '   ✔ 5 feed posts created (harvest, update, question, tip, update)';
  RAISE NOTICE '   ✔ 4 active marketplace listings created';
  RAISE NOTICE '   ✔ Rank events added (112 points total)';

END $$;
