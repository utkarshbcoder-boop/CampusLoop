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

- The default data provider serves sample records for local browsing. These records are not automatically copied into Firebase.
- Firebase Authentication and Firestore are used for account-based item and property listings. Configure the Firebase values in `.env.local` to enable those features.
- **Deploy the security rules BEFORE adding real data:** `firebase deploy --only firestore:rules` and `firebase deploy --only storage`. Never create the Firestore database in test mode — test mode leaves it world-writable for 30 days, and a code deployment does **not** deploy rules. The rules in this repo are the real authorization layer (the `/admin` UI check is only a convenience layer on top of them).
- Email/password users must verify their email before they can publish listings or register interest (the app sends the verification link on sign-up; Google sign-ins are pre-verified).
- Optional second password gate for `/admin`: set `ADMIN_PANEL_PASSWORD` (server-side, see `.env.example`). When set, `/admin` requires this password in addition to the Firebase admin check; when unset, the Firebase admin check alone applies.
- Listing photos use Firebase Storage. Rules restrict uploads to the owner, bare UUID filenames, images only, and 5 MB per file.
- Sample book and device cards are labelled **Sample listing**. Firebase-backed deployments show records already stored in Firestore; there is no bulk sample-data seeding page.
- Supabase is available as an optional data provider for the seeded data. Its schema is in [`supabase/schema.sql`](supabase/schema.sql); review and configure access policies before using real data — the `profiles` select policy exposes email/phone and must be tightened before real user data is stored there.
- Sample listings are for preview. Confirm the identity, availability, condition, location, and terms directly with the lister before paying or making a commitment. The site does not provide escrow or transaction guarantees.

## Environment

See [`.env.example`](.env.example) for optional Firebase and Supabase settings. Never commit `.env.local` or production credentials.
