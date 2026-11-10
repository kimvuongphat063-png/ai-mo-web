# UI Redesign Plan — AI MỞ Studio: Editorial → B2B Workspace

**Status:** DRAFT — awaiting approval
**Scope:** `/app/*` (Studio workspace) only. Public marketing pages, `/account`, `/admin`, APIs are untouched.
**Constraint:** API contracts, data schemas, and functionality remain unchanged.

---

## 0. Audit Findings (Current State)

### Routes inspected

| Route | File | Rendering | Issues |
|---|---|---|---|
| `/app` | `src/app/app/page.tsx` | server | serif 4xl hero heading, marketing copy, gradient CTA card, hardcoded "Recent Activity" (not from data) |
| `/app` shell | `src/app/app/layout.tsx` | server | fixed 64 sidebar with **no mobile handling**, no active-route highlight, no top bar |
| `/app/products` | `src/app/app/products/page.tsx` | server | serif 4xl "Product *Library*" heading, card grid with decorative icon circles, no search/sort |
| `/app/products/new` | `src/app/app/products/new/page.tsx` | client | 11-field single-column form in one giant card, no field grouping, no per-field validation states |
| `/app/products/[id]` | `src/app/app/products/[id]/page.tsx` | server | flat serif sections, weak hierarchy, "Next Steps" marketing cards |
| `/app/scripts` | `src/app/app/scripts/page.tsx` | server | serif 4xl "Script *Lab*" heading, italic accent, hover lift animations |
| `/app/scripts/new` | `src/app/app/scripts/new/page.tsx` | client | wizard with serif headings, italic "Wizard" accent, hardcoded hex everywhere |
| `/app/scripts/[id]` | `src/app/app/scripts/[id]/page.tsx` | server | result page, decorative icon circles, italic serif headings |
| shell (unused alt) | `src/components/studio/studio-shell.tsx` | client | duplicate shell with emoji icons (🏠 📦 ✨), serif italic logo — **dead code candidate** |

### Systemic problems

1. **Dead token classes.** `layout.tsx` and most pages use classes that are **not defined** in `@theme`:
   `bg-warm-bg`, `bg-warm-surface`, `border-warm-border`, `text-warm-ink`, `text-warm-text`, `bg-warm-cream`,
   `bg-terracotta-main`, `bg-terracotta-tint`, `text-terracotta-main`, `hover:bg-terracotta-hover`.
   The `@theme` block only defines `warm-50…900` / `terracotta-50…900` / `ink` / `text`.
   → These elements render with **no background, no border, no color** (transparent/black fallback). The app is visually broken today.

2. **Mixed styling strategies.** Some pages use semantic-but-undefined token classes (`warm-surface`), others use raw hex (`bg-[#F7F4EF]`, `text-[#C4612F]`). Two parallel palettes, zero single source of truth.

3. **Editorial presentation style.**
   - `font-serif text-4xl` page headings on every screen.
   - `<em className="text-terracotta-main not-italic">` italic-accent words in headings ("Script *Wizard*", "Product *Library*").
   - Gradient CTA banner (`bg-gradient-to-br from-terracotta-tint to-warm-surface`) on the dashboard.
   - Oversized decorative icon circles (`h-16 w-16 rounded-full`) in empty states.
   - Marketing copy ("Ready to create your first video script?") instead of operational UI.

4. **Weak data hierarchy.** Everything is `rounded-2xl` cards with equal visual weight. No density difference between a list row and a detail panel. No tables for data that is tabular (products, scripts).

5. **Missing operational states.**
   - Dashboard "Recent Activity" is a **hardcoded array** of placeholder strings — never reads real data.
   - No loading skeletons anywhere; client pages flash empty before fetch resolves.
   - No error boundaries; script-wizard errors are a single red-ish banner.
   - No optimistic/pending states on list mutations.
   - `/app/scripts/new` re-runs full analysis on every product select with only a pulsing sparkle as feedback.

6. **Broken responsive behavior.** `layout.tsx` sidebar is `fixed` at all viewports; `main` has `pl-64` always → on mobile the sidebar covers content and there is no way to dismiss it. (The alt `studio-shell.tsx` has a working mobile drawer but is not used by the layout and uses emoji icons.)

7. **Root layout interference.** `src/app/layout.tsx` wraps ALL routes (including `/app`) with the public site `<Header/>` + `<Footer/>`, sets `body { background: var(--paper) }` and global marketing styles. Studio renders inside the marketing chrome → double navigation.

---

## 1. Design Direction

**Reference patterns:** Linear (dense lists, muted neutrals, single accent, keyboard-first feel), Notion (quiet surfaces, clear section labels, content over chrome), Vercel dashboard (top-level list + detail drill-in, monochrome + one accent, precise borders).

**Principles:**

1. **Tool, not brochure.** Every element earns its place by enabling a task: find a product, create a script, copy output. No hero sections, no motivational copy, no decorative gradients.
2. **Borders over shadows.** Separate surfaces with 1px borders, not elevation/shadow theatrics. Shadow only on floating layers (mobile drawer, dropdowns).
3. **Density by default.** Base text 13–14px, compact paddings (8/12/16px scale), lists over card grids where data is tabular.
4. **One accent, used sparingly.** Accent marks interactive/selected/primary only — never decorative fills or icon backgrounds.
5. **Real states for real operations.** Loading, empty, error, and success states on every data-driven region.
6. **No nested cards.** A panel contains content or sub-panels, never a card inside a card inside a card.

---

## 2. Compact Token System

Replace the current warm/terracotta `@theme` palette with a neutral workspace scale + one technical accent. Defined once in `src/app/globals.css` `@theme` (Tailwind v4), so every class below is guaranteed to resolve.

```css
@theme {
  /* Neutrals (cool neutral, Vercel-like) */
  --color-bg:        #FAFAFA;  /* app background */
  --color-surface:   #FFFFFF;  /* panels, inputs */
  --color-surface-2: #F4F4F5;  /* subtle fills, hover, code blocks */
  --color-border:    #E4E4E7;  /* default 1px border */
  --color-border-2:  #D4D4D8;  /* emphasis border, dividers in tables */
  --color-text:      #18181B;  /* primary text */
  --color-text-2:    #52525B;  /* secondary text */
  --color-muted:     #A1A1AA;  /* hints, timestamps, disabled */

  /* One technical accent (indigo) */
  --color-accent:        #4F46E5;
  --color-accent-hover:  #4338CA;
  --color-accent-subtle: #EEF2FF;

  /* Status */
  --color-success:        #16A34A;
  --color-success-subtle: #F0FDF4;
  --color-warning:        #D97706;
  --color-warning-subtle: #FFFBEB;
  --color-error:          #DC2626;
  --color-error-subtle:   #FEF2F2;

  /* Fonts */
  --font-ui: var(--font-sans); /* Be Vietnam Pro — Vietnamese subset already loaded */
}
```

**Rules**
- `bg` for the app canvas, `surface` for panels/inputs only.
- Borders: `border` default; `border-2` for table header dividers / selected rows.
- Text: `text` primary, `text-2` labels/secondary, `muted` meta only.
- `accent` for: primary buttons, active nav item, focus rings, links. Never large fills.
- Status colors appear only with their `-subtle` background + icon (badges/alerts), never as text-only color on neutral bg.
- Legacy warm/terracotta tokens remain defined for public pages but are **banned in `/app`**.

---

## 3. Typography

- **Font:** `Be Vietnam Pro` only (already loaded in root layout with Vietnamese subset). Applied via `font-ui` on the Studio shell.
- **Banned inside `/app`:** `font-serif`, `italic`, `<em>` heading accents, `font-light` (300) body text, `tracking-tight` display sizes.
- **Type scale (all sans-serif):**

| Role | Classes | Size/Weight |
|---|---|---|
| Page title | `text-lg font-semibold` | 18px / 600 |
| Section label | `text-sm font-medium` | 14px / 500 |
| Overline / table header | `text-xs font-medium uppercase tracking-wide text-muted` | 11px |
| Body | `text-sm` | 14px / 400 |
| Meta / timestamps | `text-xs text-muted` | 12px |
| Large metric (dashboard only) | `text-2xl font-semibold` | 24px / 600 |

---

## 4. Layout Rules

### 4.1 Shell
- **Desktop (≥1024px):** fixed left sidebar `w-60` (240px), `bg-surface`, `border-r border-border`. Main area scrolls independently. No top bar initially — page titles live in content. Sidebar: logo mark (20px, plain, no serif), nav list, user block pinned bottom, "Back to site" link.
- **Active nav item:** `bg-accent-subtle text-accent font-medium`, icon inherits accent. Inactive: `text-text-2 hover:bg-surface-2 hover:text-text`.
- **Mobile (<1024px):** sidebar hidden; sticky top bar (h-12) with menu button (opens drawer overlay) + product name + contextual action. Drawer uses the same nav markup; overlay `bg-black/40`.
- **Root layout separation:** wrap `/app` so the public `<Header/>`/`<Footer/>` and paper background do NOT apply to Studio routes (move chrome to a `(site)` route group or conditionally render). Body bg inside Studio = `bg-bg`.

### 4.2 List pages (`/app/products`, `/app/scripts`)
- **Header row:** page title (left) + count badge + primary action button (right). One row, `h-14`, `border-b`.
- **Data as tables on desktop** (not card grids): columns with clear headers; row hover `bg-surface-2`; whole row clickable → detail.
  - Products: Name | Target customer | Price | Analyzed? | Created.
  - Scripts: Title | Product | Platform | Duration | Variants | Created.
- **Mobile:** same data rendered as stacked row cards (`divide-y`), tappable, meta row under title.
- **Toolbar (phase 2, non-blocking):** search input + sort select. Out of scope for first pass but the header reserves the slot.

### 4.3 Forms (`/app/products/new`, `/app/scripts/new`)
- Max width `max-w-2xl` single column; related fields grouped under `text-xs uppercase` section labels ("Product", "Audience & claims", "Compliance") — no card-per-field, no nested cards.
- Inputs: `h-9 rounded-md border-border bg-surface text-sm focus:border-accent focus:ring-2 ring-accent/20`. Labels `text-sm font-medium` above, help text `text-xs text-muted` below.
- Required marked with `*` in `text-error`.
- Sticky footer action bar inside the form column: primary submit (right), cancel/back (left). Buttons `h-9 px-4 rounded-md text-sm font-medium`.
- Submit shows inline spinner + disabled state; failure shows a `error-subtle` alert box with the API message above the action bar.
- Script wizard: keep the 3-step flow but render steps as a compact horizontal stepper (`1 Product → 2 Angle → 3 Config`) with state (done/active/pending), not numbered serif headings. Angle selection = selectable rows, selected row gets `border-accent bg-accent-subtle`.

### 4.4 Detail pages (`/app/products/[id]`, `/app/scripts/[id]`)
- **Header:** back link (`text-xs text-muted hover:text-text`) → title + status badges → primary actions (right): e.g. "Generate script", "Re-analyze", "Copy".
- **Content:** definition-list style sections (`dt` = section label, `dd` = body) inside one panel, separated by `border-b`, instead of stacked cards.
- **Product detail:** facts panel + Product Brain analysis panel (loading skeleton while analyzing, error alert with retry).
- **Script detail:** variants as tabs or stacked panels; shot table (time | spoken | visual | CTA); caption/hashtags block with copy button; compliance + missing-info rendered as warning/error alert boxes. Copy uses the existing `CopyButton` client component, restyled to the new tokens.

### 4.5 Empty states
- Compact: `py-12 text-center`, 32px icon in `surface-2` circle, `text-sm font-medium` title, `text-xs text-muted` one-line explanation, single primary button. No dashed mega-borders, no 64px icons, no marketing sentences.

### 4.6 Dashboard (`/app`)
- No welcome hero. Layout:
  1. **Stats strip** (4 compact stat cells with real counts from `listProducts`/`listScripts`/campaigns): products, scripts, analyzed products, last created date.
  2. **Primary actions** as two compact buttons ("New product", "New script") in the header row.
  3. **Recent items:** two side-by-side lists (latest products, latest scripts) with real data, each row links to detail; empty state per list if none.

---

## 5. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `<640px` | Top bar + drawer nav; tables become stacked rows; forms full-width; detail sections stack; buttons full-width in action bars |
| `640–1023px` | Same as mobile but 2-column grids where useful (stats) |
| `≥1024px` | Fixed sidebar; tables; 2/3-column panels |

- Touch targets ≥ 40px high on mobile.
- No horizontal scroll except explicit tables with `overflow-x-auto`.
- `pl-64` content offset applies only at `lg:` (fixes the current always-on sidebar overlap).

---

## 6. Reusable Component Inventory

New shared primitives in `src/components/studio/ui/` (all Tailwind + Lucide, no new deps):

| Component | Purpose | Key props |
|---|---|---|
| `PageHeader` | title + optional description + actions slot | `title`, `actions?`, `backHref?` |
| `Button` | variants: primary / secondary / ghost / danger; sizes sm/md; `loading` spinner | `variant`, `size`, `loading` |
| `Badge` | neutral / success / warning / error / accent subtle | `tone`, `children` |
| `Panel` | single bordered surface (`rounded-lg border bg-surface`) | `title?`, `actions?` |
| `Stat` | metric cell for dashboard strip | `label`, `value`, `hint?` |
| `DataTable` | desktop table wrapper with `overflow-x-auto` | `columns`, `children` rows |
| `ListRow` | mobile/divided row (link + title + meta + trailing) | `href`, `title`, `meta`, `trailing?` |
| `EmptyState` | compact empty block | `icon`, `title`, `description?`, `action?` |
| `Alert` | error/warning/success/info inline box with icon | `tone`, `children` |
| `Field` | label + input/textarea/select wrapper + help + error text | `label`, `required?`, `hint?`, `error?` |
| `Skeleton` | shimmer block for loading regions | `className` |
| `Stepper` | compact wizard step indicator | `steps`, `current` |
| `Spinner` | `Loader2` wrapper standard sizes | `size` |

**Reuse existing:** `CopyButton` (restyled), `ProductBrainClient` (re-skinned in place), lucide-react icons throughout.

**Removal candidates:** `src/components/studio/studio-shell.tsx` (duplicate, emoji icons, unused by layout) — delete in implementation phase unless referenced elsewhere.

---

## 7. Implementation Order (after approval)

1. Tokens: add workspace palette to `globals.css` `@theme` (keep legacy tokens).
2. Shared UI primitives in `src/components/studio/ui/`.
3. Shell: rewrite `src/app/app/layout.tsx` (sidebar + mobile top bar + active state), isolate from public Header/Footer.
4. Screens in this order: `/app` → `/app/products` → `/app/products/new` → `/app/products/[id]` → `/app/scripts/new` → `/app/scripts/[id]`.
5. Real data on dashboard (counts + recent items) — read-only, no API changes.
6. Delete dead code (`studio-shell.tsx` if unused), remove hardcoded hex + undefined `warm-*`/`terracotta-*` classes from all touched files.
7. Typecheck + production build.
8. Visual review: dev server, screenshot/inspect at 1440px (desktop) and 390px (mobile) for each redesigned route; verify empty, loading, and error states.

**Explicit non-goals:** new Campaign/Performance/billing/referral/AI-provider features; API or schema changes; public marketing pages; dark mode.
