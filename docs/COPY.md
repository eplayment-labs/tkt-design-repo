# Copy guide

Living guide for every user-facing string. Maintained by `copy-polisher`. Brand name is the placeholder **Tickets** (`brand.name` in `src/lib/tokens.ts`). Never hard-code it.

## Voice
Plain, warm, direct, like a friend who runs events. Say what happened and what to do next. No hype, no jokes in errors, no blame.

## Rules
- **US English**: canceled, color, center, organize, license.
- **Sentence case everywhere**: headings, buttons, tabs, labels, menu items, page titles. Proper nouns keep their case: GCash, Maya, QR Ph, Discover, My tickets (screen name), city names.
- **No exclamation marks** anywhere in the UI.
- **Buttons**: verb + object, 1 to 3 words. "Get tickets", "Publish event", "Copy link". Bare verbs are fine when the object is obvious in context: "Apply", "Remove", "Next".
- **Labels**: 1 to 2 words. "Full name", "Usage limit", "Per-order limit".
- **Helper text**: one line, a full sentence with a period. "We send your tickets here."
- **Inline field errors**: short imperative that tells the fix, no trailing period. "Enter your name", "Use at least 3 characters".
- **Format**: `₱1,234.56`, `27 Aug 2026`, `7:30 PM`, Manila time. Use `lib/format.ts`, never hand-format.
- **Fees before payment**: the ticket footer shows "Plus ₱100.00 service fee, itemized at checkout" and the order summary lists "Service fee" before the Pay button.
- **"N left" only for low stock**: render it only when `tierState()` returns `"low"` (≤15% of capacity, min 3). Host stats say "unsold", never "left".
- **Payment labels are placeholders**: GCash, Maya, Card, QR Ph. Hints describe the action only ("Pay in the GCash app"). No logos, no "official", "partner", "secure", or "verified".
- **No security or compliance claims** anywhere: no "safe", "secure", "encrypted", "certified", "PCI", "trusted".
- **Demo controls say Demo**: every demo-only control is labeled "Demo" and says it isn't real. "Demo: payment result" / "Mock checkout. No real payment is made." Scanner: "Prototype controls. Not part of the real scanner."
- **Numbers**: digits, not words ("3 tickets"). Use `f.plural()` for counts.

## Banned words
unlock (in copy; fine as a code identifier), seamless, elevate, effortless, empower, revolutionize, journey, curated, next-level, supercharge, "Oops", "Uh oh", "Whoops", safe/secure/protected (as reassurance), simply, just (as a softener), please (in buttons).

## Patterns

### Buttons
| Do | Don't |
|---|---|
| Get tickets | Buy Now! |
| Join waitlist | Notify me when available |
| Pay ₱2,500.00 | Proceed to payment |
| Confirm RSVP | Submit |
| Send ticket | Transfer this ticket now |
| Show more | Show 50 more (when fewer may remain) |

### Empty states: what's missing + next step
- "No tickets yet" / "Tickets you get show up here, ready for the door." → **Find events**
- "No events match these filters" / "Try another date or city, or clear the filters." → **Clear filters**
- "No attendees yet" / "Share the event page. Everyone who gets a ticket shows up here." → **Copy link**
- "No promo codes yet" / "Create a code to give fans a percent or fixed discount." → **Create code**
- "You're not following anyone yet" / "Follow hosts to see their new events here first." → **Find events**

### Errors: what happened + how to fix
- Load failure title: "[Thing] didn't load". Default body: "Check your connection, then try again." → **Try again**
- "Payment didn't go through" / "GCash didn't confirm the payment, so nothing was charged. Your tickets are still held. Try again or pick another method."
- "Camera unavailable" / "Allow camera access in your browser settings, or find people by name below."
- "We couldn't find that event" / "The link may be wrong, or the host may have taken the event down."
- Field: "That code has expired", "Enter a 10-digit number starting with 9".
- Always say whether money moved: "Nothing was charged."

### Toasts: past tense, specific
- "Ticket sent to migs@email.com"
- "Joined the waitlist for VIP weekend"
- "Checked in Bea Cruz" / "Undid check-in for Bea Cruz"
- "Exported 312 attendees"
- "Published \"Midnight Garden\"" / "Saved \"Midnight Garden\" as a draft"
- "Copied the event link", "Saved your profile", "3 check-ins synced"

### States
| State | Copy |
|---|---|
| Low stock | "4 left" (warning tone) |
| Sold out | "Sold out" · with waitlist: "Sold out · Waitlist open" → **Join waitlist** |
| Sales closed | "Sales closed" |
| Ended | "This event has ended" / "See what's next from this host" |
| Canceled (fan) | "Canceled" / "The host canceled this event. If you bought tickets, you'll get a full refund to the payment method you used." |
| Canceled (host) | "This event was canceled" / "Sales and check-in are off." |
| Hold expired | "Your hold ran out" / "We held your tickets for 10 minutes. Nothing was charged, and they may still be available." → **Pick tickets** |
| Sold out mid-checkout | "These tickets sold out" / "The last ones went before payment finished. Nothing was charged." |
| Offline (fan) | "Offline. Your tickets still work." |
| Offline (scanner) | "Offline · 3 to sync" / switch hint "Queue check-ins until you're back online." |
| Scan results | "Valid", "Already in", "Wrong event", "Not found" |
| Loading | Skeleton only; screen-reader text "Loading [thing]". |

## Glossary
- **Ticket**: one admission for one person, with a QR and code. Paid or free.
- **Tier**: a ticket type with its own price, capacity, and sales end ("General", "VIP weekend"). Not "category" or "level".
- **RSVP**: a free ticket. Button says "RSVP"; counts say "RSVPs". Never "free ticket purchase".
- **Hold**: tickets reserved for 10:00 while a fan checks out. Shown as "Held for 9:42".
- **Check-in**: noun and label ("Check-in"). Verb is two words: "Check in Bea", "Checked in at 7:45 PM".
- **Promo code**: a discount code (percent or fixed). A code that reveals a hidden tier is an **access code**; fans enter both in the same "Promo code" field.
- **Waitlist**: one word. "Join waitlist", "On the waitlist".
- **Host**: the person or group running the event. "Hosted by", "Switch to hosting".
- **Fan**: someone who gets tickets. In UI, prefer "you"; use "fans" only in host-facing copy ("Fans type this at checkout.").
