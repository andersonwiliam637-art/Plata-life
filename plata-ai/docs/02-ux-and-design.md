# UX/UI design spec (Phase 2)

## Design direction
Premium, calm, trustworthy and practical—not casino-like, not overly gamified. Dark forest base, muted surfaces, mint accent, high-contrast type, restrained motion. The design should remain usable with larger text and on small screens.

## Main routes
- `/`: public product landing page, transparent about planned vs available features.
- `/register`: account creation with email confirmation support.
- `/login`: sign in.
- `/dashboard`: authenticated starting point; no fake balances.
- Future: `/transactions`, `/accounts`, `/budgets`, `/reports`, `/settings`, `/billing`.

## Screen rules
- Currency is shown with explicit `Q` for GTQ, not an unlabeled number.
- Empty states explain the next action.
- Disabled future functions are labeled as planned; no fake success states.
- AI-extracted fields must be reviewable before persistence.
- Destructive actions require confirmation and a clear recovery policy.
- Forms have labels, keyboard focus states, inline errors and accessible status messages.

## Current implementation note
The landing page's finance graph and two transactions are explicitly labeled illustrative. The authenticated dashboard shows dashes rather than fictional user balances. The receipt scanner and AI assistant are described as planned, not implemented.
