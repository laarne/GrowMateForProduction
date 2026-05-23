-- Remove default PUBLIC execute access from internal trigger functions.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.protect_profile_admin_fields() from public;

