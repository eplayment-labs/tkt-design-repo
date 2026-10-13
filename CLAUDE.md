# tkt-design-repo

Neutral, unbranded event ticketing platform. Two POVs: HOST and FAN. Branding comes later. Built on the brandless components of `ep-design-repo-kit` (`~/Documents/ep-design-repo-kit`).

## Build order (stop at each checkpoint for review)
1. Plan first, no code: `docs/DESIGN_PLAN.md` (layout, type scale, color tokens, motion rules, sitemap for both POVs). Review with slop-stopper and fix what it flags. → Checkpoint
2. Foundation: scaffold the stack, tokens as code, restyled base components, mock data, role switcher. → Checkpoint
3. Fan flow end to end. → Checkpoint
4. Host flow end to end. → Checkpoint
5. Polish: run copy-polisher, then slop-stopper, on every screen. Fix everything, then give a short report.

If a feature isn't in the spec, ask before adding it.

## What this is
A simple ticketing network for Hosts (from 20-person workshops to 5,000-seat concerts) and Fans (buy tickets, show up). No brand yet. The UI must be neutral and photo-led so each host's event photos make it feel like theirs.

## Hard rules
- Mock everything. No real payment gateways, API keys, or credentials. Placeholders go in `.env.example` only. Payment is a fake success/fail toggle.
- US English copy (center, color, canceled). Sentence case.
- Philippine format: `₱1,234.56`, `27 Aug 2026`, `7:30 PM`, timezone Asia/Manila. Payment labels (GCash, Maya, Card, QR Ph) are UI placeholders only.
- No security or certification badges or claims.
- All brand values (color, type, radius, motion) live in tokens. A rebrand should be a one-file change.
- Mobile-first. Fans use phones. Hosts use desktop for the dashboard and a phone for the scanner.

## Stack
Next.js (App Router) + TypeScript, Tailwind + CSS variable tokens (`src/styles/tokens.css`, `src/lib/tokens.ts`), shadcn/ui RESTYLED (never the default look), `motion`, `@number-flow/react`, `sonner`, `vaul`, `cmdk`, `react-hook-form` + `zod`, `date-fns` + `date-fns-tz`, `qrcode.react`, `html5-qrcode`, `recharts`, `fast-average-color`, `zustand`, `lucide-react`. Check current docs before using each library.

## Design direction
> **Updated 7 Oct 2026: Soft pop direction** (see docs/DESIGN_PLAN.md §0). Bricolage Grotesque, warm cream and ink shell, photo-tinted cards, pills and a 24px radius, tilted date stickers, photo glow on the event hero and QR only, bento grids. Still no brand color. Where the lines below conflict, §0 wins.

- Neutral shell, photo-led content. The chrome is quiet: off-white / near-black and one gray ramp. Each event page pulls its accent color from the cover photo (fast-average-color).
- Type: one characterful sans (Geist, Inter Tight, or General Sans) with tabular numbers for prices and counts. Big event titles, small calm labels.
- Layout: editorial, not a dashboard template. Asymmetric event hero (the photo bleeds, info sits on a solid panel), strong left alignment, dense where data matters.
- Signature moment: tickets look like real tickets (perforated edge, stub, QR).
- Color: neutrals + photo accent + semantic colors only. No decorative gradients.
- Radius: one small value and one large value. Not everything is a pill.

## Motion (150–250ms, ease-out, respect prefers-reduced-motion)
- Quantity stepper rolls numbers, and the total updates live.
- Add to cart: the button morphs into a check, and the cart count ticks up.
- Checkout success: the ticket "prints" up from a slot.
- Wallet: tap a ticket to expand it to a full-screen QR.
- Scanner: green flash on a valid scan, red shake on an invalid or duplicate one.
- Wizard: a shared-layout progress bar, with directional slides between steps.
- Skeletons shaped like the real content.

## Accounts
A mock login with "Continue as Host" / "Continue as Fan", plus a role switcher in the account menu. One person can be both.

## FAN screens
1. Discover: cmdk search; filters for date, city, category, and free/paid; "This weekend" and "Near you" rails; photo-first cards.
2. Event page: cover + gallery, date/time, venue (map placeholder) or online, host profile, description, tiers, FAQ, share, add to calendar (.ics).
3. Ticket select: tiers, price, remaining count, sales end date, quantity stepper, per-order limit, sold out/waitlist, promo code.
4. Checkout: name, email, mobile (+63), optional attendee names, mock payment picker, fees shown up front, 10:00 hold timer.
5. Confirmation: order number, tickets, add to calendar, view tickets.
6. My Tickets: upcoming/past tabs, wallet, full-screen QR, transfer (mock), refund request (mock).
7. Following: followed hosts and their upcoming events.
8. Profile & settings.

## HOST screens
1. Onboarding: name, photo, bio, payout placeholder (masked sample only).
2. Events list: drafts/live/past, with quick stats.
3. Create Event wizard: Basics → When & where (single/multi-day; in-person/online/hybrid) → Media (cover with crop, gallery, live accent preview) → Tickets (free RSVP, paid tiers, early bird, capacity, per-order limit, hidden tiers unlocked by code) → Settings (refund policy, attendee questions, public/unlisted) → Review & publish, with a phone-size preview of the Fan event page.
4. Event dashboard: sold, gross, check-ins (animated numbers), sales chart, tier breakdown, recent orders.
5. Attendees: searchable table, filters, CSV export (mock), resend ticket, manual check-in.
6. Check-in scanner: camera plus manual search fallback, live "312 / 500 in", one-handed use.
7. Promo codes: percent or fixed amount, usage limit, expiry.
8. Host public profile.

Scale: the same UI handles a free single-tier RSVP and a multi-tier paid event with a waitlist. Out of scope (leave TODOs): seat maps, multi-host teams, real payouts.

## Every screen needs these states
Empty (with a next action), loading skeleton, error, sold out, ended, canceled, offline (scanner).

## Mock data (`src/mocks/`)
~12 events of varied sizes in Manila, Quezon City, Cebu, Davao, and online, with Unsplash photos; 2 hosts; 1 fan with past and upcoming tickets; ~300 attendees for one big event.

## Folders
`src/app/(fan)`, `(host)`, `(auth)` · `components/ui` · `components/ticket` · `features/` · `lib/tokens.ts`, `lib/format.ts`, `lib/motion.ts` · `mocks/` · `styles/tokens.css` · `docs/DESIGN_PLAN.md`, `docs/COPY.md`

## Done means
copy-polisher passed, slop-stopper passed, checked at 375px and 1440px, keyboard-navigable, visible focus, labeled inputs, AA contrast.

## Agents
- `slop-stopper`: design review, run on plans and screens.
- `copy-polisher`: UI copy rewrite, maintains `docs/COPY.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
