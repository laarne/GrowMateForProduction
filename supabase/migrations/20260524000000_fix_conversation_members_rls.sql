-- Fix: infinite recursion in conversation_members SELECT policy
-- The old policy checked conversation_members inside itself, causing a recursive loop.
-- The correct policy is simple: a user can read rows where their own user_id matches.

drop policy if exists "members can read conversation members" on public.conversation_members;

create policy "members can read conversation members"
on public.conversation_members for select
using (
  user_id = auth.uid()
  or public.is_admin()
);
