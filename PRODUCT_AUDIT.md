# Shop Management — Product Audit & Roadmap

> **Working reference for the frontend product effort.** Read the "How to use" and "Current status snapshot" first; the rest is the durable backlog.

_Last updated: 2026-04-30 · Owner: Kumar Singh (Shopkeeper persona)_

---

## How to use this doc

1. **Status snapshot** is the live progress bar — update it after each working session.
2. **Done log** captures _what changed and where_, in chronological order. Append, never delete.
3. **Phase backlogs** are the work plan, ordered by priority. When something gets done, move it from "Pending" to "Done log" with the date.
4. **Module gap tables** are the detailed audit (the "everything missing" view) — each row marked `done` / `pending` / `skipped` with priority. This survives across phases.
5. **Conventions** records design decisions so we don't re-litigate them.

When picking up next session: read the **status snapshot**, then check **next-up** in the active phase, then proceed.

---

## Current status snapshot

| Phase | Goal | Status |
|---|---|---|
| **Phase 1 — Trust pass** | "This looks real." Invoice numbers, GST, empty states, timestamps, notifications, onboarding. | **~75% done** |
| **Phase 2 — Depth** | "This can run my shop." Expenses, suppliers, ledger, returns, split-pay, advanced reports. | not started |
| **Phase 3 — Power & polish** | "I want to upgrade." Cmd+K search, activity logs, scorecards, bulk imports, mobile-first refinements. | not started |

**Next up (Phase 1 finishers):**
1. Per-module Export buttons (Inventory, Customers, BillsHistory, Reports)
2. Usage meters on Subscription page (`Bills 412/500`, `Items 87/100`, `Staff 3/5`) + trial-countdown banner
3. Loading states for BillsHistory / Inventory / Customers lists (extend the existing skeleton pattern)
4. Extend relative timestamps to Customers list ("last paid X ago")
5. Receipt preview rendered in a thermal-printer style (monospace, dotted dividers)

---

## Done log (this session)

### UI primitives created
- `src/components/ui/Skeleton.tsx` — `Skeleton` + `SkeletonText` (shimmer animated)
- `src/components/ui/Spinner.tsx` — themed spinner with `size` (xs/sm/md/lg) and `tone` (primary/neutral/white) variants, optional label
- `src/components/ui/EmptyState.tsx` — icon + title + description + action(s); `tone` (neutral/success/warning/info), `compact` mode

### UI primitives extended
- `Modal` (`src/components/ui/Modal.tsx`) — added `loading` + `loadingLabel` props; renders centered themed Spinner instead of children when loading
- `Badge` (`src/components/ui/Badge.tsx`) — accepts `className` (fixes pre-existing type errors at consumer sites)
- `Table` (`src/components/ui/Table.tsx`) — accepts `emptyState?: ReactNode` for designed empty states

### Utility functions
- `formatInvoiceNo(billId, dateIso)` → `INV-YYYY-MM-NNNN`
- `gstBreakdown(totalInclusive)` → `{ taxable, cgst, sgst, gst }` (assumes 18% inclusive)
- `formatRelativeTime(date)` → "2 min ago", "3 days ago", etc.

### CSS additions
- `.skeleton-shimmer` keyframe + class (light + dark)

### Module changes

**Dashboard (`src/modules/shop/Dashboard.tsx`)**
- Replaced 8-tile flat KPI grid with: Hero (Today's Sales + sparkline + delta chip) + 3 mini KPIs + 4-up secondary strip
- Quick actions collapsed from large cards to compact pill row (primary "New Bill" filled, others outlined)
- Bulk-selection Low Stock modal: category filter chips, select-all, per-row checkboxes, sticky bulk-action bar with consolidated WhatsApp message
- Skeleton placeholders for KPI block + Revenue chart (~800/1400ms)
- Refresh button wired to re-trigger loading
- Modal loading state on Pending Udhaar + Cleared Today + Low Stock modals (~700ms simulated fetch)
- Designed empty states for low-stock-clear / no-pending-udhaar / no-cleared-payments
- Setup checklist card on top: 5 onboarding steps with progress bar, dismissible (persists in localStorage)
- **Lower sections modernized**: Top Items (replaced Recharts BarChart with inline horizontal-bar list), Payments (donut with center total + per-row share bars + icon legend), Recent Transactions (deterministic pastel avatars + invoice numbers + relative timestamps + Paid/Udhaar amount color), Top Customers (rank + avatar + proportional spend bar), Low Stock Alert (per-card stock urgency progress bar + "X / 10 min" labelling), Inventory Value (donut + center total + ranked bar list side-by-side)
- `avatarTone(seed)` deterministic color helper (6 pastel tones)

**Reports (`src/modules/shop/Reports.tsx`)**
- Net Profit promoted out of the 8-card grid into a hero banner — auto-tints **red with warning icon** when negative, green when positive; shows the equation `Collected − Expenses = Profit` inline
- KPI grid consolidated 8 → 4 (money flows: Revenue / Collected / Pending / Expenses) + 3 (Bills / Avg Bill / Active Customers) hierarchy
- Top Selling Items: dropped duplicate list grid; chart tooltip now shows revenue + units
- Payment Methods chart standardized to donut style (matches Revenue by Category) with total in the center hole

**Billing / POS (`src/modules/shop/Billing.tsx`) — full rebuild**
- Compact header with `Next · INV-2026-04-XXXX` draft chip
- Search + category dropdown share one row; autoFocus on search (scanner-friendly)
- Horizontal-scrollable category pills below
- Item cards: tighter, denser grid (up to 5 per row at xl), `×N` floating badge for in-cart items
- Cart sidebar (380px): progressive disclosure
  - Empty cart shows a small icon + tip — no premature form fields
  - With items: "Add discount" / "Add note" collapsed inline triggers
  - Tax breakdown collapsible (closed by default)
  - Compact udhaar toggle + payment method buttons
  - Sticky bottom CTA: big payable amount + "Charge & Print" / "Save Udhaar" + "Hold" secondary
- Hold toasts a `DRAFT-XXXX` reference and clears the cart (stub for held-bills queue)
- Customer dropdown shows phone + existing udhaar balance inline when a real customer is selected
- Receipt modal updated with: `INV-…` invoice number, "TAX INVOICE" label, GSTIN, Taxable/CGST/SGST split, "Total (incl. GST)"

**Bills History (`src/modules/shop/BillsHistory.tsx`)**
- Invoice column shows `INV-2026-04-NNNN` (formatted)
- Detail modal: invoice number prominent, internal ref shown smaller, GST breakdown in totals
- Relative timestamps in date column ("5 hr ago" under the date)
- Mobile cards updated to match
- "Settled" badge for udhaar bills that were later paid
- EmptyState component for both no-bills and filtered-empty cases (desktop + mobile)

**Inventory (`src/modules/shop/Inventory.tsx`)**
- EmptyState for "no items in inventory" (with Add CTA) and "no items match filters" (with Clear filters)

**Customers (`src/modules/shop/Customers.tsx`)**
- EmptyState for both no-customers and no-matches

**Staff (`src/modules/shop/Staff.tsx`)**
- EmptyState for both members tab (no staff yet → Add + Invite via link CTAs) and invites tab (no invites yet → Send first invite)

**Header (`src/components/layout/Header.tsx`)**
- Notification dropdown panel: 8 mock notifications, grouped Today / Earlier, unread badge with red count, mark-all-read action, click-through navigation, settings + view-all footer
- Bell icon shows accurate unread count (red number badge, not just a dot)

---

## Phase 1 — Trust pass (in progress)

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Invoice numbers `INV-YYYY-MM-NNNN` | ✅ done | Helper in formatters; surfaced in cart, receipt, BillsHistory list/detail, toast |
| 2 | GST split (CGST/SGST/Taxable/Total incl. GST) | ✅ done | `gstBreakdown()` helper; in cart, receipt, bill detail |
| 3 | "Tax Invoice" label + GSTIN on receipt | ✅ done |  |
| 4 | EmptyState component | ✅ done | Reusable, used across Inventory/Customers/BillsHistory/Staff/Billing/Dashboard modals |
| 5 | Designed empty states across major lists | ✅ done | Inventory, Customers, BillsHistory, Staff (members + invites), Billing (search + cart), Dashboard modals |
| 6 | Skeleton + Spinner primitives | ✅ done |  |
| 7 | Modal `loading` prop | ✅ done | Used in Pending Udhaar, Cleared Today, Low Stock modals |
| 8 | Notification panel populated | ✅ done | Header dropdown with grouped sample notifications |
| 9 | Setup checklist on Dashboard | ✅ done | 5 steps, progress bar, localStorage dismissal |
| 10 | Relative timestamps in BillsHistory | ✅ done | Both desktop rows and mobile cards |
| 11 | Status badges — Settled variant | ✅ done | When udhaar bills get marked paid |
| 12 | Bulk selection in Low Stock modal | ✅ done | Filter chips + select-all + bulk WhatsApp |
| 13 | **Per-module Export buttons** (CSV/Excel/PDF dropdown on each table) | ⏳ pending | High visibility, low risk |
| 14 | **Subscription usage meters + trial banner** | ⏳ pending | Bills used, items used, staff used; "X days left in trial" |
| 15 | **Loading states for BillsHistory / Inventory / Customers** | ⏳ pending | Extend the existing skeleton pattern |
| 16 | **Relative timestamps in Customers** ("last paid X ago") | ⏳ pending | Needs derived `lastPaymentDate` from bills |
| 17 | **Thermal-printer style receipt preview** (monospace, dotted dividers) | ⏳ pending | Currently just a styled card |
| 18 | **Recently viewed** strip on Dashboard ("Continue: Bill INV-…") | ⏳ pending | localStorage-backed |
| 19 | **System status chip** in header ("All systems · synced 2 min ago") | ⏳ low | Easy trust win |
| 20 | **Indian comma grouping** (₹1,23,456) globally | ⏳ low | Already done by `formatCurrency` Intl format — verify in low-priority audit |

---

## Phase 2 — Depth ("this can run my shop")

| # | Item | Priority | Notes |
|---|---|---|---|
| 1 | **Expenses module** (CRUD page) | HIGH | Categories: Rent, Salary, Utilities, Inventory purchase, Marketing, Misc · recurring vs one-time toggle · attach receipt photo · vendor field |
| 2 | **Suppliers module** | HIGH | Supplier list (name, phone, GSTIN, payable balance, last order) · purchase orders · supplier ledger |
| 3 | **Per-customer ledger** | HIGH | Chronological: bill / payment / adjustment with running balance — the actual khata-book view |
| 4 | **Aging buckets for udhaar** (0-30 / 31-60 / 61-90 / 90+) | HIGH | Color-coded badges, visible in Customers list |
| 5 | **Credit limit per customer** + utilization bar | HIGH |  |
| 6 | **Returns flow** (Return tab/modal, generates credit note) | HIGH | Reverses items |
| 7 | **Split payment** UI (Cash + UPI + Udhaar mix) | HIGH | Multi-row payment entry |
| 8 | **Hold/Resume bill** queue (real list, not just toast) | HIGH | Currently a stub |
| 9 | **P&L view** (Revenue − COGS − Expenses) | HIGH | Needs cost-price field on items first |
| 10 | **Day Book / Cash Book** | HIGH | Daily closing ritual |
| 11 | **GST summary** (Output GST / Input GST / Net payable per month) | HIGH |  |
| 12 | **Inventory: cost price + margin %** | HIGH | Two-price model; margin auto-shown |
| 13 | **Inventory: SKU/barcode + reorder level + supplier + HSN + tax rate** | HIGH | Form expansion + advanced fields drawer |
| 14 | **Inventory: bulk import CSV** UI | HIGH | Even non-functional dropzone screen |
| 15 | **Settings expansion** (sub-tabs) | HIGH | Shop profile (logo) · Invoice template · Tax setup · Numbering · Notifications · Integrations · Backup · Danger zone |
| 16 | **Discount per line item** | MEDIUM | Currently only bill-level |
| 17 | **Round-off line** on bills | MEDIUM | Standard on Indian invoices |
| 18 | **Send via WhatsApp / SMS** as receipt alternative | MEDIUM |  |
| 19 | **Customer GSTIN field** (for B2B tax invoices) | HIGH |  |
| 20 | **Slow-moving inventory** report (no sales 30/60/90 days) | MEDIUM |  |
| 21 | **Hourly sales heatmap** | MEDIUM | Visually striking, helps staffing |
| 22 | **Date-range comparison overlay** in Reports | MEDIUM | "This week vs last week" |

---

## Phase 3 — Power & polish ("I want to upgrade")

| # | Item | Priority | Notes |
|---|---|---|---|
| 1 | **Global Cmd+K search** | HIGH | Customers, items, bills, invoice numbers · header input with `/` hint shifts perception massively |
| 2 | **Activity logs** per bill / customer / inventory item | HIGH | Read-only, append-only feel · in detail drawers |
| 3 | **Audit fields** ("Created by Ravi · Edited by Anita 2h ago") | MEDIUM | Inline on detail views |
| 4 | **Staff scorecard** (today's bills / revenue / collections per staff) | HIGH | In Staff list rows |
| 5 | **Staff activity log** (last login, last action, device) | HIGH |  |
| 6 | **Permission preview** when assigning a role (inline checklist) | HIGH |  |
| 7 | **Pending approvals queue** (e.g., discount > 10%, refund > ₹500) | MEDIUM |  |
| 8 | **Locked-feature CTAs** when free user clicks Reports etc. | HIGH | Sells upgrade in context |
| 9 | **Subscription: payment method card** (Visa •••• 4242, expiring 02/27) | HIGH |  |
| 10 | **Subscription: invoice/receipt history** (download PDF buttons) | HIGH |  |
| 11 | **Subscription: cancellation flow** ("We're sorry to see you go" + reason picker) | MEDIUM |  |
| 12 | **Subscription: monthly/annual toggle** with savings badge | MEDIUM |  |
| 13 | **Subscription: GST invoice option** for the SaaS payment itself | HIGH |  |
| 14 | **Mobile FAB** ("+ New Bill") on every screen | HIGH |  |
| 15 | **Tap-to-call** `tel:` links visible as buttons | HIGH |  |
| 16 | **Sticky bottom totals** on POS mobile (above soft keyboard) | HIGH |  |
| 17 | **Scanner button** as primary CTA on mobile POS | HIGH | Camera icon |
| 18 | **Single-column KPI strip** with horizontal scroll on mobile Dashboard | HIGH |  |
| 19 | **Swipe actions** on customer rows (right=WhatsApp, left=call) | MEDIUM |  |
| 20 | **Drawer-style filters** on mobile (bottom sheet) | MEDIUM |  |
| 21 | **Pull-to-refresh** visual cue | LOW |  |
| 22 | **Keyboard shortcuts overlay** (`?` key) | LOW |  |
| 23 | **What's new** changelog modal on first login of new version | LOW |  |
| 24 | **Sample-data toggle** ("View with demo / Start fresh") | LOW |  |

---

## Detailed module-level audit reference

> Status legend: ✅ done · ⏳ pending · ⏭ skipped · _italic_ = note

### A. Billing (POS)

| # | Missing | Priority | Status |
|---|---|---|---|
| 1 | Invoice number on cart + receipt | HIGH | ✅ |
| 2 | GSTIN + tax breakdown (CGST/SGST + HSN per item) | HIGH | ✅ (CGST/SGST done; HSN pending — needs Inventory field) |
| 3 | Partial / split payment (multi-tender) | HIGH | ⏳ Phase 2 |
| 4 | Discount per line item | MEDIUM | ⏳ Phase 2 |
| 5 | Hold / Resume bill queue | HIGH | ⏳ stub-only (toast); real list pending |
| 6 | Quick-add by barcode (autofocus input) | HIGH | ✅ search autoFocus; full barcode wedge handling pending |
| 7 | Last bill summary chip ("Last bill: ₹X · 2 min ago · Reprint") | MEDIUM | ⏳ |
| 8 | Customer mini-card on selection (name, phone, balance, credit limit) | HIGH | ✅ partial (phone + udhaar); credit limit pending |
| 9 | Returns / refund flow | HIGH | ⏳ Phase 2 |
| 10 | Round-off line | MEDIUM | ⏳ Phase 2 |
| 11 | Pricing trust strip (Subtotal · Discount · Tax · Round-off · Total) | HIGH | ✅ (in collapsible breakdown) |
| 12 | Confirm-before-print step | MEDIUM | ⏳ |
| 13 | Send via WhatsApp / SMS as alternative | MEDIUM | ⏳ Phase 2 |

### B. Inventory

| # | Missing | Priority | Status |
|---|---|---|---|
| 1 | Cost price + selling price + margin % | HIGH | ⏳ Phase 2 |
| 2 | SKU / barcode | HIGH | ⏳ Phase 2 |
| 3 | Reorder level (configurable, not hardcoded) | HIGH | ⏳ Phase 2 |
| 4 | Supplier reference per item | HIGH | ⏳ Phase 2 |
| 5 | HSN / tax rate per item | HIGH | ⏳ Phase 2 |
| 6 | Expiry / batch number | MEDIUM | ⏳ Phase 2 |
| 7 | Stock adjustment log (damage, shrinkage) | MEDIUM | ⏳ Phase 2 |
| 8 | Item image (optional thumbnail) | MEDIUM | ⏳ |
| 9 | Bulk import CSV UI | HIGH | ⏳ Phase 2 |
| 10 | Print barcode labels | LOW | ⏳ |
| 11 | Stock value column toggle | MEDIUM | ⏳ |
| 12 | Multi-unit (sell as piece, buy in box) | LOW | ⏳ |

### C. Customers / Udhaar

| # | Missing | Priority | Status |
|---|---|---|---|
| 1 | Credit limit per customer + utilization bar | HIGH | ⏳ Phase 2 |
| 2 | Aging buckets (0-30 / 31-60 / 61-90 / 90+) | HIGH | ⏳ Phase 2 |
| 3 | Per-customer ledger view | HIGH | ⏳ Phase 2 |
| 4 | Last payment date + relative time | HIGH | ⏳ Phase 1 finisher |
| 5 | Partial settlement UX (explicit) | HIGH | ⏳ |
| 6 | Reminder history ("WhatsApp 2 days ago") | MEDIUM | ⏳ |
| 7 | Customer tags / type (Wholesale, Retail, VIP) | MEDIUM | ⏳ |
| 8 | Birthday / anniversary | LOW | ⏳ |
| 9 | GSTIN per customer (B2B) | HIGH | ⏳ Phase 2 |
| 10 | Address with pin code, area | MEDIUM | ⏳ |
| 11 | Customer health badge (computed from aging) | MEDIUM | ⏳ |

### D. Reports

| # | Missing | Priority | Status |
|---|---|---|---|
| 1 | Profit & Loss view (proper, with COGS) | HIGH | ⏳ Phase 2 (needs cost price) |
| 2 | Day Book / Cash Book | HIGH | ⏳ Phase 2 |
| 3 | GST summary (output / input / payable per month) | HIGH | ⏳ Phase 2 |
| 4 | Top losses (out-of-stock days, returns, write-offs) | MEDIUM | ⏳ Phase 2 |
| 5 | Slow-moving inventory | MEDIUM | ⏳ Phase 2 |
| 6 | Customer concentration (top-10 as % revenue) | LOW | ⏳ |
| 7 | Hourly sales heatmap | MEDIUM | ⏳ Phase 2 |
| 8 | Date-range comparison ("this week vs last") | MEDIUM | ⏳ Phase 2 |
| 9 | Print / Export per report (PDF/Excel/CSV) | HIGH | ⏳ Phase 1 finisher |
| 10 | Save-as-scheduled-email UI | LOW | ⏳ |

### E. Staff & Roles

| # | Missing | Priority | Status |
|---|---|---|---|
| 1 | Staff sales / collection scorecard | HIGH | ⏳ Phase 3 |
| 2 | Activity log per staff | HIGH | ⏳ Phase 3 |
| 3 | Shift / attendance (clock in/out UI) | MEDIUM | ⏳ |
| 4 | Permission preview when assigning role | HIGH | ⏳ Phase 3 |
| 5 | Restricted hours (cashier 9am–9pm) | LOW | ⏳ |
| 6 | Disable login quick toggle (separate from delete) | MEDIUM | ⏳ |
| 7 | Commission setup per staff | LOW | ⏳ |
| 8 | Pending approvals queue | MEDIUM | ⏳ Phase 3 |

### F. Subscription

| # | Missing | Priority | Status |
|---|---|---|---|
| 1 | Trial countdown banner | HIGH | ⏳ Phase 1 finisher |
| 2 | Usage meters per plan limit | HIGH | ⏳ Phase 1 finisher |
| 3 | Locked-feature UX inline ("Upgrade to Pro") | HIGH | ⏳ Phase 3 |
| 4 | Invoice / receipt history (PDF download) | HIGH | ⏳ Phase 3 |
| 5 | Payment method card (Visa •••• 4242) | HIGH | ⏳ Phase 3 |
| 6 | Auto-renew toggle + next charge date | MEDIUM | ⏳ Phase 3 |
| 7 | Cancellation flow | MEDIUM | ⏳ Phase 3 |
| 8 | Add-ons / pay-as-you-go (SMS credits, extra seat) | MEDIUM | ⏳ |
| 9 | Annual vs Monthly toggle | MEDIUM | ⏳ Phase 3 |
| 10 | GST invoice option for the SaaS payment itself | HIGH | ⏳ Phase 3 |

### G. Completely missing modules

| # | Module | Priority | Status |
|---|---|---|---|
| 1 | **Expenses** (entry CRUD page) | HIGH | ⏳ Phase 2 |
| 2 | **Suppliers / Vendors** | HIGH | ⏳ Phase 2 |
| 3 | **Notifications panel** | HIGH | ✅ done |
| 4 | **Global search (Cmd+K)** | HIGH | ⏳ Phase 3 |
| 5 | **Data Export center** (or per-module Export buttons) | MEDIUM | ⏳ Phase 1 finisher |
| 6 | **Settings expansion** (sub-tabs: profile / template / tax / numbering / notifications / integrations / backup / danger) | HIGH | ⏳ Phase 2 |

---

## UX completeness checklist

| Item | Priority | Status |
|---|---|---|
| Empty states designed | HIGH | ✅ (component built; applied to Inventory/Customers/BillsHistory/Staff/Billing/Dashboard modals) |
| Skeleton loading states | HIGH | ✅ partial (Dashboard hero + chart only) — extend to other lists |
| Modal loading state | HIGH | ✅ |
| Error states (inline banner with retry, field errors, network offline toast, search "did you mean") | MEDIUM | ⏳ Phase 2 |
| Setup checklist / onboarding | HIGH | ✅ |
| Tooltips with `?` icons next to jargon (Udhaar, HSN, Margin) | MEDIUM | ⏳ |
| Sample-data toggle | LOW | ⏳ Phase 3 |
| What's-new changelog modal | LOW | ⏳ Phase 3 |

---

## Trust & realism factors checklist

| Item | Priority | Status |
|---|---|---|
| Timestamps everywhere ("X min ago") with absolute on hover | HIGH | ✅ partial (BillsHistory only) |
| Consistent status badges across modules | HIGH | ✅ partial (Paid/Udhaar/Settled in BillsHistory; need to standardize across Bills mobile, Receipt, etc.) |
| Activity log per bill / customer / item | HIGH | ⏳ Phase 3 |
| Audit fields ("Created by · Edited by") | MEDIUM | ⏳ Phase 3 |
| Real-looking numbers (mixed amounts, not all round) | HIGH | ✅ already realistic in dummy data |
| Invoice numbering | HIGH | ✅ |
| Receipt preview thermal-printer style | HIGH | ⏳ Phase 1 finisher |
| Version stamp in footer | LOW | ⏳ |
| System status chip | LOW | ⏳ Phase 1 finisher |
| Indian comma grouping (₹1,23,456) globally | HIGH | ✅ via `Intl.NumberFormat('en-IN')` |
| Time-stamped notifications with read/unread divider | HIGH | ✅ |
| Recently viewed strip | MEDIUM | ⏳ Phase 1 finisher |

---

## Mobile experience checklist

| Item | Priority | Status |
|---|---|---|
| Persistent FAB ("+ New Bill") on every screen | HIGH | ⏳ Phase 3 |
| Single-column KPI strip with horizontal scroll on Dashboard | HIGH | ⏳ Phase 3 |
| Swipe actions on customer rows | MEDIUM | ⏳ Phase 3 |
| Tap-to-call (`tel:` links) | HIGH | ⏳ Phase 3 |
| Drawer-style filters | MEDIUM | ⏳ Phase 3 |
| Compact inventory rows (single line, not big cards) | HIGH | ⏳ Phase 3 |
| Sticky bottom totals on POS mobile | HIGH | ✅ partial (mobile cart trigger exists; needs sticky-above-keyboard) |
| Pull-to-refresh visual | LOW | ⏳ |
| Toasts at bottom on mobile (above BottomNav) | MEDIUM | ⏳ |
| Scanner button as primary mobile POS CTA | HIGH | ⏳ Phase 3 |
| Hide secondary stats behind "More stats" expandable | HIGH | ⏳ Phase 3 |
| One-thumb reachable primary actions | HIGH | ⏳ Phase 3 |

---

## Conventions & decisions established this session

1. **Progressive disclosure rule** — primary screen shows the 80% case; advanced/edge cases live in:
   - Inline "More actions" / kebab menus
   - Right-side detail drawers (preferred over full-page nav)
   - Secondary tabs inside a module
   - Settings nested groups
   - "Advanced" accordions inside forms
   - `?` shortcuts overlay (planned)
2. **Tax computation** — GST is **inclusive** in displayed prices. `gstBreakdown(total)` divides by 1.18, splits half/half CGST/SGST. Switch to exclusive only if shop owner asks.
3. **Held bills** — currently toast-only stubs (`DRAFT-XXXX`). Real held-bills queue is Phase 2.
4. **Setup checklist** — auto-completes step 2 (5+ items) and step 3 (1+ customer) and step 4 (1+ bill). Steps 1 (logo+GST) and step 5 (tax rates) hardcoded incomplete until persistence is wired. Dismissal stored in `localStorage.shopmanager.setup.dismissed`.
5. **Internal bill IDs vs invoice numbers** — `Bill.id` ("B001", auto-gen) is internal; `formatInvoiceNo(id, date)` is the human-facing invoice. Both shown in the bill detail (the formatted one prominently, internal as a small ref).
6. **Loading durations** — KPI 800ms, charts 1400ms, modal fetches 700ms. Tunable from one place per concern.
7. **EmptyState always over plain text** — any "No X" message goes through the `EmptyState` component (icon + title + description + optional action), with `compact` variant for table cells.
8. **Modal loading prop** — replaces children with centered themed spinner. Caller toggles `loading={true}` after `setOpen(true)`. The shared API: `<Modal loading={isLoading} loadingLabel="Loading…">…</Modal>`.
9. **Receipt content vs internal data** — receipt modal computes GST breakdown on the fly via `gstBreakdown(total)`; doesn't store CGST/SGST in the Bill object (keeps dummy data simple, derivation deterministic).
10. **Notification panel** — currently 8 hardcoded sample notifications in Header.tsx. To persist read state across reloads, move state to a context + localStorage in Phase 1 finisher.

---

## Files touched this session (for grep / blame reference)

```
src/components/ui/EmptyState.tsx           (created)
src/components/ui/Skeleton.tsx             (created)
src/components/ui/Spinner.tsx              (created)
src/components/ui/Modal.tsx                (loading prop)
src/components/ui/Badge.tsx                (className prop)
src/components/ui/Table.tsx                (emptyState prop)
src/components/layout/Header.tsx           (notification panel)
src/utils/formatters.ts                    (formatInvoiceNo, gstBreakdown, formatRelativeTime)
src/index.css                              (skeleton-shimmer keyframe)
src/modules/shop/Dashboard.tsx             (hero KPI, sparkline, low-stock bulk, loading, setup checklist, empty states)
src/modules/shop/Reports.tsx               (profit hero, KPI consolidation, donut standardization)
src/modules/shop/Billing.tsx               (full POS rebuild)
src/modules/shop/BillsHistory.tsx          (invoice numbers, GST breakdown, timestamps, empty states)
src/modules/shop/Inventory.tsx             (empty states)
src/modules/shop/Customers.tsx             (empty states)
src/modules/shop/Staff.tsx                 (empty states)
```

---

## Pre-existing issues (not introduced by this work, not yet addressed)

These were detected by the type-checker but exist in untouched files. Document so they aren't confused with new regressions:

- `src/pages/Dashboard.tsx` — orphaned legacy file using older `StatCard`/`Card` API (`iconBg`, `animate`, `animationDelay`). Likely safe to delete; verify routing first.
- `src/pages/Roles.tsx`, `src/pages/Staff.tsx` — `RolePermissions` / `Permissions` type drift (some entries missing `udhaar` / `reports` keys). Pre-existing.
- `src/modules/shop/Roles.tsx` — `DEFAULT_MODULE_PERMISSIONS` import unused; type cast for `emptyPermissions` flagged. Pre-existing.
- `src/modules/shop/Customers.tsx` — `MessageSquare` import unused. Pre-existing.
- recharts `Cell` deprecation warnings — library-level, harmless.
