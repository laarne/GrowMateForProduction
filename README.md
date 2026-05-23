# GrowMate

GrowMate is now focused on the production React Native mobile app.

## Active Project Areas

- `native/` - Expo React Native app
- `supabase/` - database schema, RLS policies, and storage setup

## Removed From Active Development

The old Vite web prototype, Netlify landing page, and Capacitor web APK wrapper were removed so the project can focus on the real mobile app.

## Commands

Run these from the repository root:

```bash
npm start
npm run android
npm run typecheck
```

The root scripts delegate to the Expo app inside `native/`.

## Environment

Create `native/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Private API keys must stay on a backend or Supabase Edge Function, not inside the mobile app.
