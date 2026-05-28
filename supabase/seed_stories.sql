-- Create users in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role, email_confirmed_at, encrypted_password)
VALUES 
('e0a1a8c8-bcf6-4444-8c88-e22db55ffd01', 'elena@growmate.com', '{"full_name":"Elena G.","avatar_url":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop"}', '{"provider":"email","providers":["email"]}', 'authenticated', 'authenticated', now(), crypt('password123', gen_salt('bf'))),
('e0a1a8c8-bcf6-4444-8c88-e22db55ffd02', 'mark@growmate.com', '{"full_name":"Mark R.","avatar_url":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop"}', '{"provider":"email","providers":["email"]}', 'authenticated', 'authenticated', now(), crypt('password123', gen_salt('bf'))),
('e0a1a8c8-bcf6-4444-8c88-e22db55ffd03', 'sofie@growmate.com', '{"full_name":"Sofie T.","avatar_url":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop"}', '{"provider":"email","providers":["email"]}', 'authenticated', 'authenticated', now(), crypt('password123', gen_salt('bf'))),
('e0a1a8c8-bcf6-4444-8c88-e22db55ffd04', 'leo@growmate.com', '{"full_name":"Leo K.","avatar_url":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop"}', '{"provider":"email","providers":["email"]}', 'authenticated', 'authenticated', now(), crypt('password123', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

-- Update profile locations and cover URLs (entire garden setup landscapes)
UPDATE public.profiles 
SET location = 'Butuan City',
    cover_url = CASE 
      WHEN id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd01' THEN 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=240&h=240&fit=crop'
      WHEN id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd02' THEN 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=240&h=240&fit=crop'
      WHEN id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd03' THEN 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=240&h=240&fit=crop'
      WHEN id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd04' THEN 'https://images.unsplash.com/photo-1530968033775-2c9273f0865e?w=240&h=240&fit=crop'
    END
WHERE id IN (
  'e0a1a8c8-bcf6-4444-8c88-e22db55ffd01',
  'e0a1a8c8-bcf6-4444-8c88-e22db55ffd02',
  'e0a1a8c8-bcf6-4444-8c88-e22db55ffd03',
  'e0a1a8c8-bcf6-4444-8c88-e22db55ffd04'
);

-- Create public gardens for them
INSERT INTO public.gardens (user_id, name, bio, is_public)
SELECT 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd01', 'Elena''s Rose Haven', 'Loving roses and outdoor flowers.', true
WHERE NOT EXISTS (SELECT 1 FROM public.gardens WHERE user_id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd01');

INSERT INTO public.gardens (user_id, name, bio, is_public)
SELECT 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd02', 'Mark''s Succulent Corner', 'Collecting rare cacti and desert beauties.', true
WHERE NOT EXISTS (SELECT 1 FROM public.gardens WHERE user_id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd02');

INSERT INTO public.gardens (user_id, name, bio, is_public)
SELECT 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd03', 'Sofie''s Aroid Shelf', 'Monsteras and Philodendrons propagation.', true
WHERE NOT EXISTS (SELECT 1 FROM public.gardens WHERE user_id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd03');

INSERT INTO public.gardens (user_id, name, bio, is_public)
SELECT 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd04', 'Leo''s Herb Patch', 'Fresh kitchen herbs and vertical greens.', true
WHERE NOT EXISTS (SELECT 1 FROM public.gardens WHERE user_id = 'e0a1a8c8-bcf6-4444-8c88-e22db55ffd04');
