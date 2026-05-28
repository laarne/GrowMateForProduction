-- Add 'accepted' status to public.order_status enum
-- To execute this on your remote database, run it in the Supabase Dashboard SQL Editor.

-- Alter type if it exists
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'accepted' BEFORE 'paid';
