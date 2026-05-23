# GrowMate Native

This is now the main production app for GrowMate. The old web prototype has been removed so development can focus on React Native, Supabase, verified sellers, and mobile-first buyer flows.

## Stack

- Expo React Native
- TypeScript
- Supabase Auth, Database, and Storage
- Plant scanning through a secure backend or Supabase Edge Function

## Migration Order

1. Supabase project connection and session handling
2. Buyer-first Market
3. Seller verification and Seller Dashboard
4. Leafy AI scan flow using native camera/image picker
5. Listings, orders, and buyer messages
6. Feed, Garden, Rankings, and Profile

## Environment

Create `native/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Keep private API secrets such as plant-identification keys on the backend only.

## Commands

```bash
npm start
npm run android
npm run web
```
