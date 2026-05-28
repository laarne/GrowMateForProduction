create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'GrowMate User'),
    new.raw_user_meta_data->>'avatar_url',
    nullif(new.raw_user_meta_data->>'location', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
