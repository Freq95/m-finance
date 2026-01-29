# Finance Dashboard — Deep Dive Review

**Date**: 2026-01-29  
**Scope**: Entire platform — features, architecture, implementation, and gaps

---

## 1. Executive Summary

The **Finance Dashboard** is a local-only, client-side Next.js 14 app for tracking household finances (Paul / Codru / Împreună) with Romanian locale (RON), IndexedDB persistence, and a three-column layout aligned to the design target. The codebase is well-structured, typed, and validated. **One major functional gap**: the dashboard page ignores the profile selector and always shows combined data; the selector only affects the right sidebar. Otherwise the platform is feature-complete for the documented scope, with solid error handling, validation, and UX.

---

## 2. Platform Overview

### 2.1 Purpose & Constraints

- **Purpose**: Track monthly income, bills, expenses, and investments for two people (“Paul”, “Codru”) with a combined view (“Împreună”).
- **Constraints**: No backend, no auth, single-user; all data in browser (IndexedDB with localStorage fallback).
- **Locale**: Romanian (RON, Romanian month names, Romanian labels).

### 2.2 Tech Stack (Actual)

| Layer        | Choice                | Notes                                      |
|-------------|------------------------|--------------------------------------------|
| Framework   | Next.js 14 (App Router)| TypeScript strict                          |
| State       | Zustand                | Persist only UI prefs; data from IndexedDB |
| Storage     | localforage            | IndexedDB preferred, localStorage fallback |
| Validation  | Zod                    | Runtime schemas + defaults                 |
| Charts      | Recharts               | Bar chart, tooltips, grid                  |
| UI          | Tailwind + shadcn-style| Design tokens in Tailwind + `lib/design-tokens.ts` |
| Dates       | date-fns + ro locale   | MonthString `YYYY-MM`                      |
| Autosave    | use-debounce           | 1000 ms, flush on exit                     |

---

## 3. Features — Implemented vs Planned

### 3.1 Implemented Features

| Feature | Status | Where |
|--------|--------|--------|
| **Dashboard** | ✅ | `app/page.tsx` |
| 4 metric cards (Venit, Facturi, Cheltuieli, Cashflow net) | ✅ | Same |
| Balance + bar chart (last 12 months expenses) | ✅ | Same |
| History list (last 6 months, Saved/Draft badges) | ✅ | Same |
| Skeleton loading | ✅ | Same |
| Error banner (Retry/Dismiss) | ✅ | Same |
| **Monthly Input** | ✅ | `app/monthly-input/page.tsx`, `MonthlyInputClient.tsx` |
| Month picker (dialog + calendar) | ✅ | `MonthPicker.tsx`, `calendar.tsx` (month-only) |
| Input table (sections: Venit, Rate, Facturi, Altele, Cheltuieli, Economii) | ✅ | `CATEGORY_SECTIONS`, `MonthlyInputClient` |
| Paul / Codru columns | ✅ | Two `CurrencyInput` columns |
| Autosave (debounced 1s) | ✅ | `useDebouncedCallback` + `updateMonthFull` |
| Save (mark as saved) | ✅ | `saveMonth` |
| Duplicate previous month | ✅ | Store + confirm dialog |
| Reset month | ✅ | Store + confirm dialog |
| Sticky totals footer | ✅ | Fixed bar with combined totals |
| Last saved + Saved/Draft badge | ✅ | From `record.meta` |
| **Settings** | ✅ | `app/settings/page.tsx`, `SettingsModal.tsx` |
| “Include investments in net cashflow” toggle | ✅ | Store `settings.includeInvestmentsInNetCashflow` |
| **Layout** | ✅ | `AppShell`, `Sidebar`, `Header`, `RightSidebar` |
| Left sidebar (nav, mobile drawer) | ✅ | `Sidebar.tsx` |
| Header (title, search placeholder, profile selector, Settings) | ✅ | `Header.tsx` |
| Right sidebar (credit card, Recent Activities, Upcoming Payments) | ✅ | `RightSidebar.tsx` |
| **Data & persistence** | ✅ | |
| IndexedDB via localforage | ✅ | `lib/storage/storage.ts` |
| Schema validation on load/save (Zod) | ✅ | `StorageSchema` in storage + schemas |
| Migrations (v0 → v1, validate v1) | ✅ | `lib/storage/migrations.ts` |
| Browser fallback (IndexedDB → localStorage) | ✅ | `lib/utils/browser.ts`, `getStorage()` |
| **Calculations** | ✅ | `lib/calculations/calculations.ts` |
| Income, bills, expenses, investments, profit/loss, net cashflow | ✅ | Pure functions |
| Combined view (me + wife) | ✅ | `combineCategoryAmounts` |
| **UX & polish** | ✅ | |
| RON formatting (incl. NaN/Infinity) | ✅ | `lib/utils/currency.ts` |
| Romanian months | ✅ | `lib/utils/date.ts`, date-fns `ro` |
| Error boundary | ✅ | `ErrorBoundary.tsx` |
| Confirmation dialogs (duplicate, reset) | ✅ | Dialog in `MonthlyInputClient` |
| ARIA / labels (e.g. Duplică, Resetează, Salvează) | ✅ | Buttons and inputs |
| Responsive layout (sidebar drawer, right panel hidden on small) | ✅ | Tailwind, `RightSidebar` hidden `< lg` |

### 3.2 Profile Selector — Critical Gap

- **Intended behavior (from plan)**: Dashboard metrics, balance, chart, and history should respect **Paul | Codru | Împreună** (show data for selected person or combined).
- **Actual behavior**: The dashboard page **never reads `selectedPerson`**. It always uses `getCombinedData(month)` for:
  - Metric cards
  - Balance
  - Chart (last 12 months)
  - History (last 6 months)
- **Where selector is used**: Only in `RightSidebar` (credit card “Card holder” label and Recent Activities source). So the header profile selector does not filter the main dashboard content.
- **Recommendation**: In `app/page.tsx`, derive “current data” and chart/history data from `selectedPerson`: for `"me"` use `record.people.me`, for `"wife"` use `record.people.wife`, for `"combined"` use `getCombinedData(month)`. Same for “latest” month: use the same person/combined slice for metrics and chart.

### 3.3 Other Gaps / Nice-to-haves

- **Search (header)**: Input is present; no behavior or routing. Acceptable as placeholder.
- **Calendar / Notifications**: Icon buttons only; no logic.
- **Upcoming Payments**: Fixed placeholder list; no data model or editing (per plan).
- **Data export/import**: Not implemented (mentioned as optional in plan).
- **Tests**: No Jest/RTL or E2E; calculations and store are good candidates for unit tests.

---

## 4. Architecture & Data Flow

### 4.1 App Structure

```
app/
  layout.tsx          → ErrorBoundary, AppShell
  page.tsx            → Dashboard (client)
  monthly-input/page.tsx → MonthlyInputClient
  settings/page.tsx   → Settings (client)
  globals.css
```

- **Layout**: Single shell (sidebar + header + main + right sidebar). Settings accessible from dashboard (modal) and from dedicated `/settings` page.
- **Data loading**: Dashboard and Monthly Input call `loadRecords()` on mount; store holds `records`, `isLoading`, `error`.

### 4.2 State (Zustand)

- **Persisted to localStorage (via Zustand persist)**: `selectedPerson`, `selectedMonth`, `settings`. Records are **not** persisted in Zustand; they live only in IndexedDB.
- **In-memory**: `records`, `isLoading`, `isSaving`, `error`.
- **Actions**: `loadRecords`, `updateMonth`, `updateMonthFull`, `saveMonth`, `duplicateMonth`, `resetMonth`, `setSelectedPerson`, `setSelectedMonth`, `updateSettings`, `clearError`.
- **Selectors**: `getCurrentMonthRecord`, `getLast12Months`, `getLast6Months`, `getCombinedData`.

Design is clear; the only behavioral issue is that the dashboard does not use `selectedPerson` when calling these selectors / when choosing which data to display.

### 4.3 Storage Layer

- **Key**: `finance-dashboard-data`.
- **Schema**: `{ version: number, data: MonthRecord[] }`. Current version 1.
- **Flow**: Load → Zod parse; on failure, migration runs (`migrations.ts`). Save path validates before write.
- **Fallback**: If IndexedDB unavailable, `getBestStorageType()` returns `localstorage` and localforage uses localStorage. No in-memory-only fallback.

### 4.4 Types & Validation

- **Types** (`lib/types.ts`): `MonthString`, `Person`, `PersonView`, `CategoryAmounts`, `MonthRecord`, `StorageSchema`. Aligned with plan.
- **Zod** (`lib/validation/schemas.ts`): `CategoryAmountsSchema`, `MonthRecordSchema`, `StorageSchema`; `createDefaultCategoryAmounts()`. Used by storage and migrations.
- **Constants** (`lib/constants.ts`): `CATEGORY_SECTIONS`, `PERSON_LABELS`. Single source of truth for sections and labels.

---

## 5. Key Implementation Details

### 5.1 Calculations

- **File**: `lib/calculations/calculations.ts`.
- **Functions**: `calculateIncomeTotal`, `calculateBillsTotal`, `calculateExpensesTotal`, `calculateInvestmentsTotal`, `calculateProfitLoss`, `calculateNetCashflow( data, includeInvestments )`, `combineCategoryAmounts`.
- **Net cashflow**: When `includeInvestments` is true, net = income − expenses − investments; when false, net = income − expenses (same as profit/loss). Toggle is respected in dashboard and Monthly Input totals.

### 5.2 Monthly Input Form

- **State**: Local `formData` for `me` and `wife`; synced from store when `selectedMonth` or init key changes; flushed to store via debounced `updateMonthFull` (1s).
- **Save**: Flush, then `saveMonth(selectedMonth)` to set `meta.isSaved = true`, then re-init form from store.
- **Duplicate**: Copies previous month’s record into current month (overwrites after confirm). **Reset**: Replaces current month with default amounts (after confirm).
- **CurrencyInput**: RON display/parse, non-negative, blur commits; “RON” suffix. Prevents minus and `e` in keydown.

### 5.3 Dashboard Data Source

- **currentData**: From `last12[0]` (latest month) and `getCombinedData(latest.month)` — always combined.
- **chartData**: Last 12 months, each point = `getCombinedData(r.month)` → `calculateExpensesTotal` — always combined.
- **History**: Last 6 months from store; each row uses `getCombinedData(r.month)` for cashflow — always combined.
- **RightSidebar**: Uses `selectedPerson` for card holder label and `getCombinedData(latestMonth)` for Recent Activities (so activities are always combined; only label changes). Upcoming Payments are static.

So: **profile selector must be wired into dashboard page** so that metrics, chart, and history respect Paul / Codru / Împreună.

---

## 6. UI / Design System

### 6.1 Design Tokens

- **Defined in**: `lib/design-tokens.ts` and extended in `tailwind.config.ts` (colors, font sizes, spacing, shadows, radii).
- **Usage**: Tailwind classes (e.g. `text-textPrimary`, `bg-accentPositive`, `rounded-card`). Some components still use hardcoded hex (e.g. `#111827`, `#6B7280`) instead of token names; consistency could be improved by using Tailwind theme only.

### 6.2 Layout & Responsiveness

- **Desktop**: Sidebar 72px, main flexible, right sidebar 320px (`RightSidebar` hidden below `lg`).
- **Mobile**: Sidebar as overlay drawer; hamburger; main full width. Right sidebar not shown on small screens.
- **Dashboard**: Metric cards grid (1/2/4 columns); balance + chart; history list. All in main column.

### 6.3 Components

- **Layout**: AppShell, Sidebar, Header, RightSidebar — all client components, coherent.
- **Shared**: ErrorBanner (role=alert, Retry/Dismiss), ErrorBoundary (class, fallback UI), SettingsModal, LoadingSpinner.
- **UI**: Button, Card, Badge, Dialog, Input, CurrencyInput, Calendar (with month-only mode), etc. Dialog used for MonthPicker and confirmations; focus and ARIA are considered.

---

## 7. Error Handling & Edge Cases

- **Load error**: Store sets `error`; dashboard and Monthly Input show ErrorBanner with Retry/Dismiss.
- **Save error**: Same; retry triggers `saveMonth` or `loadRecords` as appropriate.
- **Validation**: Stored data validated with Zod on load; invalid records skipped in migration. Defaults from `createDefaultCategoryAmounts()`.
- **Currency**: `formatRON` guards NaN/Infinity; `parseRON` returns 0 on invalid input. CurrencyInput clamps to ≥ 0.
- **Duplicate**: Disabled when there is no previous month; confirm before overwrite.
- **Reset**: Confirm before reset. No undo.
- **Empty state**: Dashboard shows messages like “Completează date în Monthly Input pentru grafic” and “No records. Add data in Monthly Input.” when there is no data.

---

## 8. Accessibility & i18n

- **Language**: UI and plan are Romanian (labels, messages, buttons). No formal i18n framework; strings are inline.
- **ARIA**: Buttons and inputs have `aria-label` where needed; ErrorBanner has `role="alert"`; profile group has `role="group"` and `aria-label`.
- **Keyboard**: Dialog and focus behavior via shadcn-style Dialog; minus/e prevented in CurrencyInput.
- **Contrast**: Design tokens use dark text on light background and status colors that meet typical contrast needs; no audit referenced.

---

## 9. Performance

- **Memoization**: Dashboard uses `useMemo` for `currentData` and `chartData` to avoid recomputing on every render.
- **Selectors**: Components subscribe to store slices (e.g. `useFinanceStore((s) => s.records)`), which helps limit re-renders.
- **Debounce**: Autosave debounced at 1s with flush on exit, reducing write frequency.
- **Chart**: Recharts with fixed height; no virtualization. History is last 6 months only; no virtualization needed at current scale.

---

## 10. Security & Privacy

- **No server**: All data stays in the browser; no transmission of financial data.
- **No auth**: Single-user; anyone with device access can see/edit data. Matches “local-only” goal.
- **Storage**: IndexedDB/localStorage are origin-scoped; no explicit encryption. Acceptable for local-only.

---

## 11. Recommendations (Prioritized)

1. **High — Profile selector on dashboard**: Use `selectedPerson` in `app/page.tsx` to choose data source for metrics, balance, chart, and history (me / wife / combined). This makes the header selector match user expectations and the original plan.
2. **Medium — Tests**: Add unit tests for `lib/calculations/calculations.ts` and, if possible, for store actions and storage load/save with mocked localforage.
3. **Medium — Design tokens**: Prefer Tailwind theme classes (e.g. `text-textPrimary`) over raw hex in components for consistency and theming.
4. **Low — Search / Calendar / Notifications**: Either implement or remove; or keep as visual placeholders and document as such.
5. **Low — Export/import**: If users need backup or migration, add JSON export/import for `MonthRecord[]` (and optionally respect schema version).

---

## 12. Conclusion

The Finance Dashboard is in good shape: clear architecture, strong typing, validation, migrations, and UX (autosave, confirmations, error handling, RON/Romanian). The only major functional gap is that **the dashboard does not respect the profile selector** and always shows combined data; fixing that in `app/page.tsx` would align behavior with the design and the rest of the app. After that, the platform can be considered feature-complete for the current scope, with optional improvements in tests, token usage, and export/import.
