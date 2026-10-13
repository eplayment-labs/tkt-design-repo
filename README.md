# tkt-design-repo

A neutral, unbranded event ticketing prototype with two points of view: **Fan** and **Host**. Everything is mocked. There are no real payments, accounts, or credentials.

Built on the brandless foundation of `ep-design-repo-kit`. The design decisions are in [`docs/DESIGN_PLAN.md`](docs/DESIGN_PLAN.md) and the copy rules in [`docs/COPY.md`](docs/COPY.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Start at `/login` and pick **Continue as fan** or **Continue as host**. Switch roles anytime from the account menu.

## Demo controls

- **Payment result:** a "Demo" toggle at checkout makes payment succeed or fail.
- **Screen states:** add `?state=loading|error|empty|sold-out|ended|canceled|offline` to any screen.
- **Scanner:** add `?demo=1` to the check-in screen for "Simulate scan" and an offline toggle. They're hidden otherwise, so the real one-handed layout stays clean.
- **Reset:** clear the site's local storage (`tkt-demo`) to restore the seed data.

## Rebrand

Edit `src/styles/tokens.css`. Colors, type, radius, and motion all live there. `src/lib/tokens.ts` only mirrors the few numbers JS needs.

Each event's accent color comes from its cover photo. It's computed ahead of time (`npm run accents` for mock data, and in the wizard's Media step for new events), then adjusted until it meets AA contrast.

## Structure

```
src/
  app/(auth)  (fan)  (host)  (scanner)   routes
  components/ui        restyled kit components
  components/ticket    the ticket
  components/shell     fan + host shells, account menu, role switcher
  features/            store (zustand), fan + host feature code
  lib/                 tokens, format (₱, dates, Asia/Manila), motion, accent, event rules
  mocks/               events, hosts, fan, attendees, promo codes, fees (placeholder rate)
  styles/tokens.css    the one file a rebrand touches
```

## Out of scope (TODOs in code)

Seat maps, multi-host teams, and real payouts.
