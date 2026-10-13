# Design plan

Status: v5 · 8 Oct 2026. **Direction: Showcase** (a professional ticketing storefront, white first). §00 overrides §0, and both override anything below.
Base: `ep-design-repo-kit` v0.1.0 (brandless). This plan says what we keep, what we change, and what we drop.

---

## 00. Direction v5: Showcase (overrides §0 where they conflict)

The user asked for a real, professional ticketing storefront in the shape of a major promoter's site (hero carousel of featured shows, prominent search, upcoming and last-call rows, rich footer). It stays brandless: none of the reference's logo, name, colors, or copy.

- **Theme:** white first (`#ffffff` page, `#f4f4f5` sunken, ink `#0a0a0b`) with a true neutral dark mode (`#09090b`). There's a **user toggle** (light, dark, system) in both shells. This replaces decision D3.
- **Type:** Geist Sans for UI and body text. Bricolage Grotesque 800 (display face) only for headlines, event titles, and big numbers.
- **Shape:** sm 10px, inner 12px, lg 16px, pill. Event cards are image first (rounded-lg photo) with text below, with no tinted frame. Tints stay on event-page surfaces.
- **Home page** (replaces the date-led Discover from D5):
  - Featured hero carousel (Embla, autoplay with a visible progress bar, pauses on hover, focus, or reduced motion, swipe on phone).
  - Big search with suggestions (keyword, city, date, category).
  - A "Trending" ranked row.
  - A category and city marquee.
  - "This weekend", "Last call" with countdowns, "Upcoming" with load more, and "Browse by city".
  - A full footer.
- **Search page** `/search`: query-param driven, with filters (city, date, category, price, free), sort (soonest, price, popular), a result count, and empty-state suggestions. On phones the filters open in a sheet.
- **Motion (relaxed):** sections reveal once on scroll (250ms, small blur and fade, no stagger over 200ms). The hero carousel moves. Card photos zoom 1.04× inside the card on hover (the card itself never scales). Reduced motion disables all of it.
- **Allowed gradient:** a functional scrim behind text on the hero carousel (legibility only).
- **UI sources:** Magic UI (MIT) for Marquee and BlurFade (as `Reveal`), adapted in `components/ui/effects.tsx`. Embla Carousel (MIT).

## 0. Direction v4: Soft pop (overrides)

Referenced: Partiful, Luma, Airbnb Experiences. Warm, rounded, and playful, but still photo-led and unbranded. The personality comes from type, shape, and grid, not a brand color.

**Relaxed rules (approved 7 Oct 2026):** pills and a large radius, tilted stickers, and a photo-derived glow. **Kept:** no brand color yet (the shell is ink on cream, and each event's photo supplies the color), no decorative gradients other than the photo glow, motion at 150–250ms with no springs, AA contrast, and a one-file rebrand.

- **Type:** Bricolage Grotesque (variable: opsz, wdth, wght). Display at 800 weight with −0.035em tracking. UI text at 500–700. Geist Mono stays for codes and serials.
- **Color:** cream page `#fff6ee`, white raised surfaces, warm sunken `#f1e6db`, ink `#1d1530`, muted `#6a6178`. Dark theme uses warm darks. The brand accent stays monochrome (ink).
- **Photo tint:** cards, fact chips, and the ticket stub fill with `color-mix(event accent 10–14%, raised)`, so each event colors its own surfaces.
- **Shape:** `--radius-sm 12px` (inputs, small tiles), `--radius-lg 24px` (cards, panels, tickets, sheets), `--radius-pill` (buttons, chips, tabs, steppers, badges). Photos inside cards use an inner radius (`--radius-inner 18px`) with 6px padding, so card and photo corners stay concentric.
- **Stickers:** a small white date or status badge rotated −6°, sitting on a photo corner. Use it on cards (date) and the event hero (date), plus "Few left" or "Sold out" where relevant. At most one sticker per card.
- **Photo glow:** the blurred cover (blur 48px, opacity 0.35 light / 0.45 dark) behind the event hero and the full-screen QR only. Nowhere else.
- **Elevation:** a soft `--shadow-overlay` on floating things (hero panel, sheets, ticket, menus, cmdk, sticky CTA bars). Grid cards use a photo tint, not a shadow.
- **Grid:** 4 columns on phone (16px gutter, 12px gap), 8 on tablet, 12 on desktop (max 1200px, 24px gap). Discover uses a **bento** (a featured 2×2 card plus 1×1 cards). Every page aligns to the same container, with no full-bleed leftovers or orphan columns.
- **Balance:** the event page on desktop is a 7/5 split inside the container. The cover is a rounded frame on the left, and the info panel sticks on the right, top-aligned with the cover. The body continues in the same 7/5 split (content left, host and venue cards right). Nothing floats alone.

---

## 1. Principles for this product

1. **The photo is the brand.** Chrome is quiet so a host's cover photo carries the identity of each event. Anywhere the chrome gets louder than the photo is a bug.
2. **One job per screen.** Every screen in §9 names its one job. That job gets the largest type, the accent color, or the thumb zone, and nothing else competes for it.
3. **Numbers are content.** Prices, counts, and times use tabular figures, sit on a shared baseline, and never wrap mid-value.
4. **The ticket is the signature.** It's the only skeuomorphic object in the product. Everything else stays flat so the ticket feels special.

---

## 2. What we take from the kit

| Kit piece | Decision | Why |
|---|---|---|
| 3-layer tokens (primitive → semantic → Tailwind alias) | **Keep** | Already a one-file rebrand |
| Gray ramp, spacing scale (4px base) | **Keep**, warm the ramp slightly (§3.1) | Matches spec |
| Geist Sans / Geist Mono | **Keep** | One of the spec's three options, already wired |
| Focus ring, reduced-motion rule | **Keep** | Matches "done means" |
| Component set (`components/ui`, CSS modules) | **Keep as the base**, restyled per this plan | See D1 |
| `EmptyState` (requires a next action) | **Keep** | Enforces "empty with a next action" |
| `.mesh`, `.grain`, `.glass` | **Drop** | Decorative. Our panels sit over photos, and blur or texture there reads as decoration |
| 5 radius steps | **Cut to 2**, aliased so copied components can't drift (§5) | Spec |
| 80 / 120 / 200ms durations | **Retune to 150 / 200 / 250ms**, aliased (§8) | Spec range |
| Shadows sm / md / lg | **Replace with one `--shadow-overlay`** (§5) | No shadows by default |
| `--text-tertiary` gray-600 (≈3.3:1 on white) | **Darken** | Fails AA |
| Semantic 500s used as text | **Add text-safe steps per theme** (§3.3) | Fail AA as text |

---

## 3. Color

### 3.1 Neutrals (shell)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--surface` | `#f7f7f5` | `#111213` | Page |
| `--surface-raised` | `#ffffff` | `#1a1b1d` | Info panel, ticket body, sheets |
| `--surface-sunken` | `#efefec` | `#0a0b0c` | Inputs, skeleton slots, table header |
| `--text-primary` | `#16181b` | `#f3f3f1` | Titles, values |
| `--text-secondary` | `#495057` | `#c4c7cb` | Body, labels |
| `--text-tertiary` | `#5f6670` (≈5.0:1 on sunken, the worst case) | `#9aa0a6` (≈6.4:1 on raised) | Meta, helper text |
| `--border-subtle / default / strong` | ink at 8 / 12 / 22% | white at 8 / 14 / 24% | Kit technique, unchanged |

The ramp is slightly warm so skin tones and stage light in cover photos don't look clinical next to the chrome. Primitive-level only, so it's still one file.

### 3.2 Photo accent (per event)

**When it's computed:** never at view time. A mock-data script (`scripts/accents.ts`) runs `fast-average-color` over every mock cover now. Later, the wizard's Media step runs it when the host picks a cover. The three results are stored on the event record and rendered server-side as inline CSS variables on the event root, so there's no fallback-to-accent color pop on load.

**How it's derived** (`lib/accent.ts`, in OKLCH):
1. Extract the dominant color, ignoring near-white and near-black pixels.
2. **Chroma floor:** if chroma < 0.04 (gray, muddy, or olive-gray), use the monochrome `--accent` instead. A deliberate no-color beats a dirty one.
3. `--event-accent` (CTA fill, selected tier, stub band): adjust lightness until **both** hold: ≥3:1 against `--surface-raised`, and the chosen `--event-on-accent` (white or `#16181b`) clears **4.5:1** on it. That's two conditions, not "whichever is better."
4. `--event-accent-text` (links, small accent text): same hue, adjusted to ≥4.5:1 against the worst-case surface it can sit on: `--surface` in light mode (event body links sit on the page) and `--surface-raised` in dark mode.
5. Steps 3–4 run twice, against the light and dark `--surface-raised`. Six stored values per event, selected by theme in CSS.

**Scope:** event page, ticket select, checkout, confirmation, tickets. Discover stays neutral so a dozen accents never fight on one screen; the photos carry the color there.

### 3.3 Semantic

| Token | Fill (icons, flashes, bars) | Text, light (on raised / surface) | Text, dark (on raised `#1a1b1d`) |
|---|---|---|---|
| success | `#2f9e44` | `#237a35` (≈5.4 / 5.0:1) | `#69db7c` (≈9.8:1) |
| warning | `#f08c00` | `#a35f00` (≈5.1 / 4.7:1) | `#ffa94d` (≈8.9:1) |
| danger | `#e03131` | `#c02424` (≈6.0 / 5.5:1) | `#ff8787` (≈7.4:1) |

Semantic colors only mean state: valid/invalid scan, sold out, sales ending, payment failed, canceled. State is always icon + word too, never color alone. Ratios get re-verified with a contrast checker in step 2.

### 3.4 Brand slot

`--brand-*` (wordmark, `--accent-300…600`) stays monochrome. Rebrand = edit `src/styles/tokens.css`. `src/lib/tokens.ts` exports token **names** and the few numeric values JS needs (motion durations, breakpoints), generated from the same source, so it never hand-duplicates a raw color.

---

## 4. Type

Geist Sans. Geist Mono for order numbers and ticket codes only. A `.num` utility (`tabular-nums`) goes on every price, count, time, and timer.

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `--text-display` | `clamp(2.5rem, 6vw, 4.5rem)` / 1.08, `text-wrap: balance` | 600, tracking −0.03em | Event title, scanner result word |
| `--text-4xl` | 2.25rem / 1.1 | 600 | Dashboard lead sentence, confirmation title |
| `--text-2xl` | 1.5rem / 1.2 | 600 | Section titles on host and desktop screens |
| `--text-lg` | 1.125rem / 1.4 | 500 | Card titles, tier price, scanner count |
| `--text-base` | 1rem / 1.5 | 400 | Body, all inputs (no iOS zoom) |
| `--text-sm` | 0.875rem / 1.45 | 400 / 500 | Meta, table cells, buttons |
| `--text-xs` | 0.75rem / 1.4 | 500, +0.02em | Small calm labels. Uppercase only on the ticket |

Rule: **at most three sizes per section.** Big titles, small calm labels, nothing in between competing.

---

## 5. Shape, space, elevation

- **Radius:** `--radius-sm: 6px` for buttons, inputs, chips, tier rows, and menus. `--radius-lg: 16px` for cards, sheets, the event info panel, and tickets. In tokens.css, `--radius-md` aliases to `sm` and `--radius-xl` to `lg`, and `--radius-full` is deleted. Avatars use `border-radius: 50%` (a circle, not a step). Table rows get **no** radius. No pills anywhere.
- **Spacing:** the kit scale only (`--space-1, 2, 3, 4, 6, 8, 12, 16, 24` = 4–96px), plus `--space-32: 8rem` for the desktop hero offset. Fixed dimensions are named tokens, not loose numbers: `--bar-height: 3.5rem` (top bar, sticky CTA bars), `--rail-width: 15rem` (host rail).
- **Gutters:** `--space-4` (16px) below 768px, `--space-6` (24px) from 768px, `--space-12` (48px) from 1280px. Content max width 1280px.
- **Elevation:** borders by default. A single `--shadow-overlay` token goes on exactly these: the event info panel where it overlaps the photo, the ticket, sheets/drawers, and the cmdk palette. Popovers, dropdowns, toasts, and sticky CTA bars use a border only (sticky bars get a top hairline). Cards on a grid get nothing.

---

## 6. Layout

### 6.1 Fan (mobile-first)

**Shell:** a `--bar-height` top bar with the wordmark placeholder and a single search entry (opens the cmdk palette). There's no account control on mobile because the Profile tab is the account entry. The mobile bottom tab bar holds Discover · Tickets · Following · Profile. It's **hidden** on `/e/[slug]`, ticket select, `/checkout`, and `/tickets/[ticketId]`, where a sticky CTA bar takes its place, so bottom chrome never stacks. Every sticky bottom bar pads with `env(safe-area-inset-bottom)`. On desktop, the tabs move into the top bar, left-aligned after the wordmark, and the account menu sits at the right.

**Discover:** a filter row under the top bar (date, city, category, free/paid; horizontal scroll on mobile, `--radius-sm` chips). Then "This weekend" and "Near you" (layout depends on D5). Desktop grid, if rails are kept: 4 columns. Small cards are a 3:2 image plus a fixed-height title block (2 lines of title + 1 meta line), so baselines align across the row. The lead card in each section spans 2 columns × 2 rows. Its image height is derived from the span (two small-card heights + row gap − one title block), which works out to roughly 5:4 landscape, cropped via the host's `object-position`. Cards are photo first, with text below the image, never overlaid.

**Event page:**
- Mobile: full-bleed 4:5 cover. The info panel (raised, `--radius-lg` top corners only, `--shadow-overlay`) overlaps the photo by `--space-8` and holds the title (display), date and time, venue, and host. A sticky bottom bar shows "From ₱850.00" and **Get tickets**.
- Desktop: the cover spans columns 1–8, bleeding to the top and left viewport edges, with a max height of `100svh − var(--bar-height)` and `object-position` from the host's crop. The info panel covers columns 8–12, overlapping the photo by one column, offset down by `--space-32`, and stays sticky with the CTA inside. Body content (gallery strip, About, Tiers, Venue, Host, FAQ) sits in **columns 1–7**, left edge aligned to the page gutter, so it runs under the photo while the panel stays pinned on the right.
- The body's Tiers section is a read-only list. Tapping a row opens ticket select with that tier preselected, so there's one picker, not two.

**Ticket select:** a `vaul` bottom sheet on mobile. On desktop it replaces the info panel's content in place, so the photo stays in view. The CTA in the sheet/panel shows the live total: **Get 2 tickets · ₱1,700.00**.

**Checkout:** a single column, max 560px. On mobile, the order summary collapses to a tappable top row; on desktop it's a right column. A **sticky bottom bar** holds the hold timer, the total, and **Pay ₱1,785.00**. The bar is always in the thumb zone, and the timer never scrolls away.

**Confirmation:** the ticket is the largest thing, printing in (§8). Above it, a `--text-4xl` "You're going" line plus the order number in mono. Below it, **View tickets** (primary) and Add to calendar.

**My tickets:** Upcoming / Past tabs. The list shows tickets as compact stubs (photo strip, title, date) stacked with `--space-3` gaps. The next upcoming ticket shows expanded at the top. Tapping a ticket opens its full-screen QR.

**Following:** a list of hosts (avatar, name, next event date). Each row expands to that host's upcoming events as a horizontal strip of small cards.

**Host public profile `/h/[handle]`:** left-aligned header (avatar, name at `--text-4xl`, bio, **Follow**), then upcoming events in the Discover card grid, then past events as a compact list.

**Login:** not a centered card. A full-height split: left (desktop) or top (mobile) is a mock event cover from the dataset; right/bottom holds the wordmark and two stacked full-width buttons, **Continue as Fan** and **Continue as Host**, each with a one-line description. On mobile, the buttons sit in the thumb zone.

### 6.2 Host (desktop dashboard, phone scanner)

**Shell:** a `--rail-width` left rail (host name, Events, Promo codes, Profile). The account menu with the role switcher sits at the top right, the same as the Fan desktop. On tablet the rail collapses to icons; on phone, to a top bar with a menu sheet.

**Events list:** a table-like list, not cards. Each row has the cover thumbnail, title, date, a status word, and one inline capacity bar ("312 / 500"). Drafts / Live / Past tabs. **Create event** is a primary button at the top right.

**Event dashboard** (editorial):
1. A **lead sentence** at `--text-4xl`: "312 of 500 sold · ₱265,200.00 gross · sales end 27 Aug 2026". For free events it reads "184 of 200 RSVPs · RSVPs close 27 Aug 2026"; Gross is dropped. Check-ins replace sales as the lead during the event day. Each "·" clause is a `white-space: nowrap` span, so lines only break between clauses, never inside a number or date.
2. **Tier breakdown as capacity bars:** one row per tier, with a single bar showing sold, remaining, and checked in (three segments, labeled with numbers, not color alone).
3. **Sales over time:** a compact full-width line chart, 160px tall, axis labels only at the start, middle, and end.
4. **Recent orders** table.

**Attendees:** a search field at the top (full width on phone), filter chips (tier, checked in), and a table on desktop that becomes a list of rows on phone (name, tier, status, and a check-in button on the right edge for the thumb). The CSV export and resend actions are in the row menu and the page header.

**Promo codes:** a list (code in mono, discount, uses "12 / 50", expiry). **Create code** opens a sheet with the form.

**Wizard:** a left column with the step list. The active step's indicator uses a shared `layoutId` and moves between steps; there's no separate progress bar. The step form is centered at max 640px. On the review step, the right column shows the real Fan event page component in a bordered 375px-wide viewport (no device bezel or notch) with the draft data.

**Scanner:** full screen, always dark, one-handed.
- Top 55%: camera viewfinder. A close button is the only control in the top third.
- **Result block (largest):** the status word at `--text-display` with an icon ("Valid", "Already in", "Wrong event"), then the name and tier at `--text-lg`.
- Count: "312 / 500 in" at `--text-lg` `.num`.
- Bottom thumb zone: **Search attendees** (opens manual check-in).

---

## 7. The ticket (signature component)

`components/ticket/Ticket.tsx`, one component used in the wallet, confirmation, and host preview.

- **Portrait (mobile):** cover photo strip (3:1), then the body (title, date, time, venue, tier, and attendee on a 2-column label/value grid with `--text-xs` uppercase labels), then the **perforation**, then the **stub** (QR via `qrcode.react`, ticket code in Geist Mono, "Admit 1").
- **Landscape (≥768px):** the stub moves to the right, and the perforation runs vertically.
- **Perforation:** the ticket outline is an SVG path with two half-circle notches cut at the perforation line, plus a dotted rule between them in `--border-strong`. The shadow is `filter: drop-shadow()` on a wrapper, so it follows the notches. A CSS mask would clip a box-shadow.
- **Accent:** a 4px `--event-accent` band on the stub edge. The QR stays black on white for scanner reliability.
- **States:** valid · checked in (stub dimmed, "Checked in 7:42 PM") · transferred · refund requested · canceled ("Canceled" in danger text with an icon, QR hidden) · past (desaturated photo strip).

---

## 8. Motion

Tokens: `--duration-fast: 150ms`, `--duration-normal: 200ms`, `--duration-slow: 250ms`, `--ease-out: cubic-bezier(0.2, 0, 0, 1)`. Old kit names alias in (`--duration-instant` → fast).

**Enforced defaults (because library defaults break the rules):**
- The root layout wraps the app in `<MotionConfig transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }} reducedMotion="user">`. `layoutId` transitions therefore get a tween, not the default spring.
- `NumberFlow` is used only through a `components/ui/number.tsx` wrapper that sets `transformTiming`, `spinTiming`, and `opacityTiming` to 250ms ease-out. Its default is roughly 900ms and spring-like.
- `vaul` drawers: the transition is overridden to `--duration-normal` / `--ease-out` (the default is about 500ms).
- `sonner` toasts: the transition is overridden to `--duration-normal` (the default is 400ms).
- `recharts`: used only through a `components/ui/chart.tsx` wrapper that sets `isAnimationActive={false}` on every series (the default is about 1.5s on mount).
- No springs anywhere. Nothing animates on mount or page load.

| Moment | Behavior | Trigger |
|---|---|---|
| Quantity stepper | The digit rolls, and the CTA total rolls in sync (250ms) | Stepper tap |
| Add to cart | Label cross-fades to a check (150ms), the badge count rolls, and it reverts after 1.2s idle | Tap |
| Checkout success | The ticket translates up from a slot line, clipped (250ms) | **Only** the client-side transition after a successful Pay. A direct visit or refresh shows it static |
| Wallet expand | Shared-layout ticket → full-screen QR (250ms). The hint "Turn up your brightness" fades in over 150ms after | Tap |
| Scanner valid | Full-screen success overlay, opacity 0 → 24% → 0 (250ms), plus `navigator.vibrate(30)` | Scan result |
| Scanner invalid/duplicate | Result block shake, ±6px × 2 in 250ms, danger edge | Scan result |
| Wizard | Step indicator moves via `layoutId` (200ms). Content slides 24px left (next) or right (back) with opacity (200ms) | Next/Back |
| Dashboard numbers | Roll **only** on live changes (a new order or check-in while the page is open). Never count up from 0 on mount | Data change |

**Reduced motion:** every moment becomes an instant state change. The scanner flash stays as a static color for 600ms because it carries meaning.

**Skeletons:** static, no pulse. Shown only if loading takes longer than 300ms, so fast loads never flash. Each skeleton is the real component with a `loading` prop: borders, perforation, and real labels ("Date", "Venue", "Tier") render as text, and only the values become `--surface-sunken` slots sized to realistic content (a 3-word title, a "₱1,250.00" width, a date width).

---

## 9. Sitemap

### Auth `(auth)`
| Route | One job |
|---|---|
| `/login` | Pick a role |

### Fan `(fan)`
| Route | One job |
|---|---|
| `/` Discover | Find an event worth going to |
| `/e/[slug]` Event | Decide to go → **Get tickets** |
| `/e/[slug]/tickets` Ticket select (sheet/panel, deep-linkable) | Pick tier and quantity |
| `/checkout/[holdId]` Checkout | Pay before the hold runs out |
| `/orders/[orderId]` Confirmation | Know it worked, find the tickets |
| `/tickets` My tickets | Get into the event |
| `/tickets/[ticketId]` Full-screen QR | Show the QR at the door |
| `/following` Following | See what followed hosts have next |
| `/profile` Profile & settings | Edit details, switch role |
| `/h/[handle]` Host public profile | Follow the host, see their events |

### Host `(host)`
| Route | One job |
|---|---|
| `/host/onboarding` | Set up the public profile |
| `/host` Events list | Jump into an event |
| `/host/events/new?step=` Create wizard (6 steps) | Publish an event |
| `/host/events/[id]` Dashboard | See how sales are going |
| `/host/events/[id]/attendees` | Find and help an attendee |
| `/host/events/[id]/check-in` Scanner | Let the right people in |
| `/host/events/[id]/promo` Promo codes | Create and track discounts |
| `/host/profile` | Edit the public profile |

**Role switcher:** in the account menu only (the top right on desktop for both shells, and inside the Profile tab or the host menu sheet on mobile). Switching lands on the closest equivalent: Fan profile ↔ Host events list.

**Onboarding layout:** one column, max 560px, four fields stacked (name, photo, bio, payout placeholder showing `•••• 4821`), with a sticky **Save profile** bar on mobile.

---

## 10. State matrix

✓ = required. Every screen supports a dev-only `?state=` param to demo states.

| Screen | Empty | Loading | Error | Sold out | Ended | Canceled | Offline |
|---|---|---|---|---|---|---|---|
| Discover | ✓ no matches → clear filters | ✓ | ✓ | card label | hidden | hidden | — |
| Event page | — | ✓ | ✓ not found | ✓ waitlist CTA | ✓ + host's next events | ✓ refund note | — |
| Ticket select | — | ✓ | ✓ | ✓ per tier and all | ✓ sales closed | ✓ | — |
| Checkout | — | ✓ | ✓ payment failed → retry | ✓ sold out during hold | — | — | — |
| Hold expired | ✓ → back to tiers | — | — | — | — | — | — |
| My tickets | ✓ → Discover | ✓ | ✓ | — | Past tab | ✓ ticket state | ✓ cached QR still shows |
| Following | ✓ → Discover | ✓ | ✓ | — | — | — | — |
| Host events | ✓ → Create event | ✓ | ✓ | label | Past tab | label | — |
| Dashboard | ✓ no sales → share link | ✓ | ✓ | banner | read-only | banner | — |
| Attendees | ✓ → share link | ✓ | ✓ | — | — | — | — |
| Scanner | — | ✓ camera starting | ✓ camera denied → manual search | — | — | ✓ blocks scanning | ✓ "Offline · 4 to sync", queues check-ins |
| Promo codes | ✓ → Create code | ✓ | ✓ | — | expired label | — | — |

---

## 11. Mock and money conventions

- All formatting lives in `lib/format.ts`: `₱1,234.56`, `27 Aug 2026`, `7:30 PM`, always Asia/Manila via `date-fns-tz`. Free shows as "Free", never "₱0.00".
- Fees come from one mock config, `src/mocks/fees.ts`, flagged `TODO: placeholder, not a real rate`. They always show as their own line before payment.
- GCash, Maya, Card, and QR Ph appear as text labels with a neutral placeholder mark, not real logos. A dev toggle forces success or fail.
- No security, compliance, or certification badges.
- Host payout shows a masked sample only (`•••• 4821`), with no input for a real account number.

---

## 12. Open decisions (need your call)

**D1. Component base.** The kit already is a restyled, brandless component set (CSS modules), so adding shadcn means two button systems.
→ **Recommend:** kit components as the base, no shadcn install. Use the spec's behavior libraries where the kit lacks the behavior: `vaul`, `cmdk` (kit Command styling), `sonner` (kit Toast styling), `recharts` (sales chart).

**D2. Icons.** Kit = Phosphor, spec = lucide.
→ **Recommend:** lucide everywhere, re-pointed in the copied components.

**D3. Dark mode.** Free via tokens, but a toggle isn't in the spec.
→ **Recommend:** follow the system setting, no toggle. The scanner is always dark.

**D4. Wordmark placeholder.**
→ **Recommend:** the word "Tickets" in Geist 600, from one `brand.name` token.

**D5. Discover layout** (slop-stopper: rails + chips is the generic Airbnb/Netflix home).
→ **Recommend:** **date-led.** Events are grouped by day under a sticky left column showing the date in display-size tabular numerals ("Fri 9 Oct"), with a 3-column grid of the §6.1 small card to the right (a single column stacked under the date on mobile). "This weekend" becomes the top group, and "Near you" becomes a city filter preset chosen from the profile city. This changes the spec's "rails" wording, so it needs your OK.

**D6. Stub serial number** (new detail, not in spec).
→ **Recommend:** print "No. 0312 / 500" in mono on the stub from the **ticket** sequence (so 2-ticket orders get distinct numbers). Drop "/ 500" on events with no capacity cap. The scanner result shows the same number on a valid scan, so the ticket and the door read as one system.

---

## 000. Landing (`/`)

The landing page is the front door; the storefront moved to `/discover`. Each section has one job and the scroll reads like a story:

1. **Hero:** find your night. Dark over photos regardless of theme, with a functional scrim. Covers crossfade slowly with a gentle zoom (scale 1→1.08 over 12s). The headline reveals word by word once (the only load animation, done by 0.75s). The real search combobox has a rotating example placeholder (every 3s, paused on focus), plus a live count of events this week.
2. **Time reel:** what's on, in order (tonight → this weekend → next week → later). On desktop the frame pins and vertical scroll scrubs the reel sideways. The left label switches as cards pass, and state updates only when the label changes.
3. **Moods:** pick a feeling, get four events. Each card shows one reason derived from data (`features/fan/suggest.ts`): capacity, price, timing, popularity, or "Because you follow …" from the fan's own follows.
4. **Creators:** the people behind the nights. On desktop, a pinned horizontal sequence where each panel holds for 60% of its stretch, then slides (piecewise-linear, never resting between panels).
5. **The ticket moment:** the real Ticket rises out of a slot and its QR fades in. Desktop scrubs it over 150svh.
6. **Cities:** big type list. On desktop, hovering or focusing a row slides that city's photo alongside it.
7. **For hosts:** a sample dashboard from real data. A mock sale lands about every 5s, only while it's on screen, and numbers roll from their current value.
8. **Footer.**

**Scroll rules:** pinned scenes are `position: sticky` inside a tall wrapper, read with `useScroll`. Mappings are linear or piecewise-linear `useTransform` values bound to `style` (no springs, no smooth-scroll library, no scroll hijacking). Only transform and opacity animate. Tabbing to a card inside a pinned scene scrolls the page so the scene brings that card into view.

**Header:** fixed and transparent over the hero (dark tokens), solid with a hairline after it. It flips once at the threshold.

**Fallbacks:**

| Scene | Phone and tablet (<1024px) | Reduced motion (any size) |
|---|---|---|
| Hero montage | Same | First cover, static, no zoom; headline appears without movement |
| Time reel | Horizontal snap scroller with group labels | Same scroller, no pin |
| Creators | Vertical stack of panels | Stack, no pin |
| Ticket moment | Plays once when in view (250ms) | Finished state, static |
| Cities | Photo tiles | List without the following photo motion |
| Host dashboard | Same | Numbers update without rolling |

### 000.1 3D + micro-interactions

**3D scenes** (CSS perspective, rotateX/Y, translateZ, and `preserve-3d`, driven by `useScroll` → `useTransform` bound to `style`; linear or piecewise-linear, no springs, no per-frame React state):
- **Poster wall** (right after the hero): about 15 distinct covers on a plane tilted back (rotateX 48°, rotateZ −8°, translateZ −240px, scale 0.72) that flattens over the first 60% of the scene. "Every kind of night, in one place." fades in mid-scene on a solid plate. The wall zooms to 1.15 and fades into the time reel. Pinned on tablet (140svh) and desktop (180svh). Phone: an unpinned 3×3 wall whose 28° tilt flattens as it scrolls into view. The tiles are decorative; every event is a link in the reel right after.
- **Creator coverflow** (desktop): 3 panels on a ring (side panels rotateY ±40°, translateZ −260px, opacity 0.55). Each panel holds at the front for 55% of its stretch, then the ring turns. Only the front panel is interactive (`inert` moves when the front changes). Phone and tablet: the snap strip, where off-center cards turn up to ±14° from the strip's own scroll.
- **Ticket flip:** the ticket rises from the slot, then flips rotateY 0→180° from the event side to the QR side (two faces, `backface-visibility: hidden`). Desktop scrubs over 200svh. Phone plays once in view: 250ms rise, 150ms beat, 250ms flip.

**Micro-interactions** (each ≤250ms, transform or opacity only):
- **Card tilt** (opt-in `tilt` on EventCard; landing and Discover grids): the photo tilts toward the pointer, up to 6°, perspective 800px. Fine pointers only, rAF-throttled MotionValues. The card never scales, and there's no glare.
- **Surprise me:** an 8-step ticker through real on-sale events (70→120ms per step, about 0.9s in all) that lands on one pick, with a Get tickets link. The result is announced via `aria-live`.
- **Follow pill:** labels cross-fade inside a fixed-width pill (no layout animation). The follower count ticks ±1 via `Num`, and the toast reads "Following X".
- **Magnetic CTAs** (hero Search, Start hosting, Surprise me's Get tickets): pull up to 6px toward the pointer and snap back in 200ms.
- **Try it builder:** event name and 6 covers. The preview card's Get tickets pill and tinted chip take the cover's accent, computed client-side the same way as the wizard's Media step.
- **Progress hairline:** 2px under the solid landing header, scaleX bound to page scroll.
- **Small touches:** date blocks nudge up 2px on card hover, and buttons press to 0.97.

**Reduced motion:** every 3D scene renders flat through CSS (`motion-safe:` / `motion-reduce:`). The ticket shows both faces side by side. Tilt and magnetic pull are off, and the Surprise me result appears immediately.

### 000.2 Performance, smoothing, time tunnel

**Smoothing exception.** Scroll-following MotionValues go through one shared, critically damped spring (`SCROLL_SPRING` in `features/fan/landing/scene.ts`: stiffness 350, damping 26, mass 0.4, damping ratio ≈ 1.1, no overshoot). This is the only allowed spring. It is never used for data, UI state, hover, or one-shot reveals.

**Gating.** `useSceneProgress` follows scroll only while its section is within half a viewport of the screen. Offscreen scenes recompute nothing, and on re-entry the value jumps to the current position (no sweep). The hero montage, the Ken Burns zoom, and the rotating placeholder pause when the hero is offscreen or the tab is hidden. Scene stages use `contain: layout paint`, with `will-change` only while active. Scroll scenes never animate `filter`. The landing doesn't use the blur reveal.

**React work.** No re-render per scroll frame. State changes only on discrete events (front card or panel changes, in-view changes). In a dev count over a full top-to-bottom scroll (279 steps), the tunnel rendered 34 times, the coverflow 10, the ticket 6, and the poster wall 6. That includes dev double-renders, and the logging was removed afterward.

**Pinned lengths:**

| Scene | Desktop | Tablet | Phone |
|---|---|---|---|
| Poster wall | 160svh | 130svh | unpinned |
| Time tunnel | 250svh (14 cards) | 200svh (9 cards) | 200svh (9 cards) |
| Coverflow | 3 × 80svh = 240svh | strip | strip |
| Ticket | 170svh | plays once | plays once |

**Hand-offs.** Each scene ends on a full frame: the wall stays up (zoomed) while the tunnel's title arrives, the tunnel ends with the last card at the front, and the coverflow ends on its last panel. So scrolling between scenes is a normal page scroll with no blank screen. I tried overlapping pinned scenes with negative margins and dropped it, because the next scene slid visibly over the previous one.

**Time tunnel** (replaces the reel): cards sit in depth (z = −i × 560px on desktop, 440px on phone) in date order, alternating left and right (±24vw or ±11vw), ±6svh up and down, turned 8° toward the center. Scroll moves the camera forward. Only cards within about 2.6 spacings ahead are visible, so far cards don't pile up in the middle. Group words (Tonight, This week, This weekend, Next week, Later) sit just before their first card, so you fly through them. Only the front card is interactive (`inert` moves once per card).

The corner HUD shows:
- the front card's date block (ticks 150ms as cards pass)
- the group and its date span
- "x of N"
- See all
- Previous and Next buttons (44px), which scroll the page to a card; this is the keyboard and switch-access path

Reduced motion gets the flat grouped scroller.
