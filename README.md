# CampusLoop

CampusLoop is a focused marketplace for **second-hand items** and **rooms, flats, and PGs** near campus.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The site includes sample content for browsing. Firebase configuration is needed for account sign-in and publishing real listings.

## Product areas

| Area | Route | What you can do |
|------|-------|-----------------|
| Second-hand items | `/marketplace` | Browse used books and devices, filter listings, and contact sellers |
| Books | `/books` | Search used books by subject, condition, and price |
| Rooms, flats, and PGs | `/homes` | Find places to rent or buy |
| Create a listing | `/sell` | Publish an item or property listing when signed in |
| Saved listings | `/saved` | Keep a personal list of saved items and homes on this device |
| My listings | `/my-listings` | View your listings after signing in |

## Development checks

```bash
npm run lint
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run build
npm run verify
```

The browser tests cover marketplace browsing, saving a listing, sign-in validation, the sign-in requirement for listing creation, and redirects from out-of-scope pages. They do not perform a real Firebase sign-in or publish data to a live project.

## Data and publishing

- The default data provider serves sample records for local browsing.
- Firebase Authentication and Firestore are used for account-based item and property listings. Configure the Firebase values in `.env.local` to enable those features.
- Deploy `firestore.rules` with `firebase deploy --only firestore:rules` when the rules change. A code deployment does not deploy Firestore rules.
- Supabase is available as an optional data provider for the seeded data. Its schema is in [`supabase/schema.sql`](supabase/schema.sql); review and configure access policies before using real data.
- Sample listings are for preview. Confirm the identity, availability, condition, location, and terms directly with the lister before paying or making a commitment. The site does not provide escrow or transaction guarantees.

## Environment

See [`.env.example`](.env.example) for optional Firebase and Supabase settings. Never commit `.env.local` or production credentials.
