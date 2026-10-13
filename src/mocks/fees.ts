/**
 * TODO: placeholder, not a real rate. Mock service fee for the UI only.
 * Real pricing must come from finance and compliance before anything ships.
 */
export const FEE_PER_TICKET = 5000; // centavos (₱50.00)

export function feesFor(subtotal: number, qty: number): number {
  return subtotal === 0 ? 0 : FEE_PER_TICKET * qty;
}

/** Hold length for checkout. */
export const HOLD_MS = 10 * 60 * 1000;
