# AI Mở Studio — UI Direction

Practical B2B AI content workspace. Density and clarity of Linear / Notion / Vercel dashboards. This document is the single source of truth for the Studio (`/app`) redesign. Dribbble is broad inspiration only — no shot is copied, no marketing/portfolio surface is built inside `/app`.

Scope: everything under `src/app/app/**` and `src/components/studio/**`. Public marketing site (`src/app/(public)`, `.site-*`, `.hero`, warm/terracotta tokens) is out of scope and unchanged.

---

## 1. Design principles

1. Tool, not brochure. Screens exist to get work done: capture a product, analyze it, generate a script, save it.
2. Density over decoration. Compact spacing, real data, information-first layouts. No oversized hero copy.
3. Borders over shadows. Structure comes from `1px` gray borders and surface contrast, not drop shadows or floating cards.
4. One accent. A single technical blue (`#2563EB`) marks primary actions, active state, and focus. Everything else is neutral.
5. Real states. Every async surface has explicit loading, empty, error, disabled, and success states.
6. No nesting. Panels do not sit inside other panels. Flatten hierarchy.

Banned inside `/app`: serif fonts, italic editorial titles, terracotta / warm palette (`#C4612F`, `#F7F4EF`, `#1F2421`, etc.), gradients, oversized hero text, floating decorative cards, nested cards, emoji icons.

---

## 2. Color tokens

Defined in `src/app/globals.css` under the `@theme` block. Tailwind v4 consumes these as `bg-*`, `text-*`, `border-*` utilities.

### Neutrals
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#FAFAFA` | App background |
| `--color-surface` | `#FFFFFF` | Panels, cards, table surface |
| `--color-surface-2` | `#F4F4F5` | Subtle fills, inset blocks, table header |
| `--color-border` | `#E4E4E7` | Default `1px` borders, dividers |
| `--color-border-2` | `#D4D4D8` | Stronger borders, hover borders |
| `--color-text` | `#18181B` | Primary text |
| `--color-text-2` | `#52525B` | Secondary text, labels |
| `--color-muted` | `#A1A1AA` | Tertiary text, placeholders, icons |

### Accent — single technical blue (CHANGE from current indigo)
| Token | Current | Target | Usage |
|-------|---------|--------|-------|
| `--color-accent` | `#4F46E5` | **`#2563EB`** (blue-600) | Primary buttons, active nav, links |
| `--color-accent-hover` | `#4338CA` | **`#1D4ED8`** (blue-700) | Primary button hover |
| `--color-accent-subtle` | `#EEF2FF` | **`#EFF6FF`** (blue-50) | Active nav bg, selected radio card, badges |

### Status (success / warning / error only)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` / `--color-success-subtle` | `#16A34A` / `#F0FDF4` | Published, saved, valid |
| `--color-warning` / `--color-warning-subtle` | `#D97706` / `#FFFBEB` | Missing info, compliance caution |
| `--color-error` / `--color-error-subtle` | `#DC2626` / `#FEF2F2` | Validation errors, failed actions |

No other hues. No hardcoded hex inside `/app` components — always reference a token utility.

---

## 3. Typography

Sans-serif only (the app font stack; no serif families). No italics for emphasis.

| Role | Size / weight | Tailwind |
|------|---------------|----------|
| Page title | 18px / semibold | `text-lg font-semibold text-text` |
| Section / panel title | 14px / medium | `text-sm font-medium text-text` |
| Body | 14px / normal | `text-sm text-text` |
| Secondary / meta | 13px | `text-[13px] text-text-2` |
| Label / caption | 12px | `text-xs text-text-2` |
| Micro (hints, footnotes) | 11–12px | `text-xs text-muted` |

Line length in reading panels capped around `max-w-3xl`. Numeric/tabular data uses `tabular-nums` where alignment matters.

---

## 4. Spacing, radius, shadow

- Spacing scale: `2 / 3 / 4 / 6` (8/12/16/24px) as the working set. Page container `px-4 py-6 sm:px-6`, `max-w-7xl`.
- Panel padding: `p-4`. Panel header height: `h-12` (fixed, `px-4`).
- Gaps between stacked panels: `space-y-4`.
- Radius: `rounded-md` (6px) for inputs/buttons, `rounded-lg` (8px) for panels. Never fully-rounded pills except badges (`rounded-full` small only).
- Shadow: none by default. Only `shadow-lg` on the mobile nav drawer overlay. Structure = borders, not shadow.
- Focus: `focus:border-accent` + `focus:ring-2 focus:ring-accent/20` on interactive controls.

---

## 5. Layout rules

### Desktop (≥ lg)
- Fixed left sidebar `w-60`, `border-r border-border bg-surface`. Logo mark, `StudioNav`, user block, "← Về AI Mở".
- Main content offset `lg:pl-60`, inner container `mx-auto max-w-7xl px-4 py-6 sm:px-6`.
- Top bar: **56px (`h-14`)** — currently 48px (`h-12`), must be raised. Holds page context / breadcrumb + primary action on wide screens.
- Collections → list/table. Detail generation → focused wizard or split-pane. Script shots → vertical timeline list.

### Mobile (< lg)
- Sidebar hidden; `StudioTopBar` sticky **`h-14` (56px)** with Menu button opening a `w-64` drawer over a `bg-black/40` scrim.
- Tables collapse to stacked `<ul>` rows (label + value pairs). No horizontal scroll.
- Actions move into the page header; sticky bottom action bar for long forms.

### Page header pattern (`PageHeader` primitive)
Every route opens with: optional back link → title → one-line context description → primary action(s) on the right.

---

## 6. Component inventory (reuse — do not duplicate)

Source: `src/components/studio/ui/index.tsx` (all present and on-token).

| Primitive | Purpose |
|-----------|---------|
| `cx()` | className joiner |
| `Spinner` | inline loading indicator |
| `Button` | variants `primary` / `secondary` / `ghost` / `danger`; sizes `sm` (h-8) / `md` (h-9); `loading` |
| `ButtonLink` | anchor styled as button |
| `Badge` | tones `neutral` / `accent` / `success` / `warning` / `error` |
| `Panel` | `rounded-lg border bg-surface`, `h-12` header, no nesting |
| `PageHeader` | backHref, title, description, actions |
| `Stat` | dashboard metric cell |
| `EmptyState` | icon + title + description + action |
| `Alert` | tones error / warning / success / info with Lucide icons |
| `inputClass` / `textareaClass` | `h-9 rounded-md` field styles with accent focus ring |
| `Field` | label + required + hint + error wrapper |
| `SectionLabel` | small uppercase group label |
| `Skeleton` | loading placeholder block |
| `Stepper` | wizard step indicator (done / active / pending) |

Other reusable modules:
- `src/components/studio/studio-nav.tsx` — nav list, active-state logic.
- `src/components/studio/studio-topbar.tsx` — mobile top bar + drawer.
- `src/components/studio/product-brain-client.tsx` — analysis panel (states handled).
- `src/app/app/scripts/[id]/CopyButton.tsx` — copy-to-clipboard.
- `src/app/app/layout.tsx` — the redesigned shell.

To add:
- `Tooltip` — required by the brief for every icon-only button. Add to `ui/index.tsx`.

Dead code to remove:
- `src/components/studio/studio-shell.tsx` — old warm/serif/emoji shell, not imported anywhere (confirmed). Delete.

---

## 7. UI states (mandatory per surface)

- Loading: `Skeleton` blocks matching final layout, or `Button loading`. No layout shift.
- Empty: `EmptyState` with icon, one-line explanation, and the primary next action.
- Error: `Alert tone="error"` with a plain-language message and a retry/fix path. Never a bare thrown error.
- Disabled: reduced opacity, `cursor-not-allowed`, no hover; buttons disabled while any request is in flight.
- Success: `Alert tone="success"` or `Badge tone="success"`; navigate/confirm after save.

---

## 8. Redesign status & plan

### Already on-direction (verified 2026-08-19)
Shell (`layout.tsx`), `StudioNav`, `StudioTopBar` (`h-14`), `Tooltip`, dashboard (`/app`), products list/new/detail, `product-brain-client`, scripts list/new/[id], campaigns list/new/[id], brand, performance list/new, settings — all use workspace tokens/primitives. Accent is blue `#2563EB`. Dead `studio-shell.tsx` removed.

### Remaining (non-blocking)
1. Capture 1440px + 390px screenshots (Playwright) for core + extended flows; fix any visual defects.
2. Optional: wire Brand Memory into script generation prompts more deeply; campaign day → script assignment UI mutations.

### Preserved (no behavior change)
All routes under `src/app/api/studio/**` (brand, campaigns[/id], performance, products[/id][/analyze], scripts[/id]), all Zod schemas and persistence in `src/lib/studio.ts`, and all user flows / deep links (`?productId=`).
