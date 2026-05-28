alter table public.seller_applications
  add column if not exists id_front_url text,
  add column if not exists id_back_url text,
  add column if not exists selfie_with_id_url text,
  add column if not exists selfie_with_plant_url text;

update public.seller_applications
set id_front_url = coalesce(id_front_url, proof_photo_url)
where proof_photo_url is not null;
