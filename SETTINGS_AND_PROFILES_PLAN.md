# Settings Modal + Dynamic Profiles — Development Plan

## Scope

- **Settings modal:** Clear all data, Refresh exchange rates, Decimal places, Date/locale, Export format, Default person view.
- **Profiles:** Add / delete / rename profiles (Paul & Codru become two of N). **Soft delete:** removing a profile hides it from the UI but keeps its data in month records; "restore" can be added later.
- **Notifications:** Placeholder only (e.g. settings toggle + comment for future implementation).

---

## Phase 1 — Settings-only features (no profile refactor)

These do not depend on the new profile model. Ship first so the modal is stable and usable.

### 1.1 Clear all data

- **Where:** [SettingsModal](components/shared/SettingsModal.tsx), [storage](lib/storage/storage.ts) (already has `clearStorage()`).
- **Behavior:** New "Clear all data" section with a destructive button. On confirm: (1) call `clearStorage()` to remove records from IndexedDB; (2) reset Zustand state (records `[]`, and optionally theme/currency/settings/upcoming payments to defaults); (3) clear the persist key used by Zustand so reload doesn't rehydrate old state (or call a store action that replaces state with initial values and persists once).
- **UX:** Confirmation dialog ("This will delete all month data and reset settings. You cannot undo.") with type-to-confirm or explicit "Clear" / "Cancel".

### 1.2 Refresh exchange rates

- **Where:** [AppShell](components/layout/AppShell.tsx) already fetches rates when `displayCurrency !== "RON"`; [currency](lib/utils/currency.ts) has `fetchExchangeRates()`.
- **Behavior:** In Settings modal, "Exchange rates" section with "Refresh rates" button that calls `fetchExchangeRates()`, then `setExchangeRates(...)`. Optionally show last-updated time if we store it (later).
- **Store:** Add optional `exchangeRatesUpdatedAt: string | null` if you want to display "Updated 5 min ago".

### 1.3 Decimal places

- **Where:** [lib/utils/currency.ts](lib/utils/currency.ts) `formatCurrency` currently uses `minimumFractionDigits: 0, maximumFractionDigits: 0`.
- **Behavior:** Add to `settings`: `decimalPlaces: 0 | 2` (or 0..2). Pass into `formatCurrency` and use for `minimumFractionDigits` / `maximumFractionDigits`. Settings modal: "Amount display" → "No decimals" / "2 decimals".
- **Touchpoints:** Every call site that formats money should use the same helper (already `formatCurrency`); ensure no hardcoded 0 decimals elsewhere.

### 1.4 Date/locale

- **Where:** [lib/utils/date.ts](lib/utils/date.ts) uses Romanian (`ro`) for month names; [dashboard-data](lib/dashboard/dashboard-data.ts) uses `formatMonthShort`.
- **Behavior:** Add to `settings`: `dateLocale: "ro" | "en"` (or a BCP 47 string). Store in Zustand `settings`. In `date.ts`, use the locale from a small "date config" module or pass locale into formatters; use `date-fns` locale (`ro`, `enUS`) based on setting. Settings modal: "Date format" → "Romanian (Ian 2026)" / "English (Jan 2026)".
- **Default:** Keep `ro` so existing behavior unchanged.

### 1.5 Export format

- **Where:** [lib/settings/data-io.ts](lib/settings/data-io.ts) `exportBackup`; [lib/storage/storage.ts](lib/storage/storage.ts) `exportData`.
- **Behavior:** Add setting or one-time choice in modal: "Export format" — "Full backup" (current: records + version; later can include profiles/settings if we store them in backup) vs "Data only" (records only, minimal JSON). Implement by either (a) two export buttons ("Export full backup" / "Export data only") or (b) dropdown + single "Export" button. Data-only = same `StorageSchema` shape (records array + version) without including future extra keys (e.g. profiles snapshot). For now, full and data-only can be the same payload; later, "full" can add `profiles`, `settings`, `theme`, etc. into the JSON.

### 1.6 Default person view (logic only, no profiles yet)

- **Where:** Store already persists `selectedPerson`; on first load we could respect a "default" instead of last selected.
- **Behavior:** Add `settings.defaultPersonView: PersonView` (or "last used"). If "last used", keep current behavior (persisted `selectedPerson`). If a specific view, on app init set `selectedPerson` to that value when there's no rehydrated preference (or always apply default on load and let user change). Settings modal: "Default view" → "Last used" / "Paul" / "Codru" / "Împreună". This will be reused in Phase 2 for "Profile A / Profile B / … / Combined".

---

## Phase 2 — Dynamic profiles (data model + migration)

### 2.1 Types and schema

- **Types ([lib/types.ts](lib/types.ts)):**
  - Replace `Person = "me" | "wife"` with `ProfileId = string` (opaque id, e.g. UUID or `profile-1`).
  - Replace `PersonView = "me" | "wife" | "combined"` with `PersonView = ProfileId | "combined"`.
  - Add `Profile = { id: ProfileId; name: string }`.
  - Change `MonthRecord.people` from `{ me: CategoryAmounts; wife: CategoryAmounts }` to `Record<ProfileId, CategoryAmounts>` (or `Record<string, CategoryAmounts>` with runtime validation).
- **Validation ([lib/validation/schemas.ts](lib/validation/schemas.ts)):**
  - `MonthRecordSchema`: `people` as `z.record(z.string(), CategoryAmountsSchema)` (and optionally restrict keys to known profile ids at runtime).
  - Keep strict validation for category keys inside `CategoryAmounts`.
- **Storage schema version:** Bump to 3. Records in v3 have `people: Record<string, CategoryAmounts>`.

### 2.2 Migration (v2 → v3)

- **New migration in [lib/storage/migrations.ts](lib/storage/migrations.ts):**
  - For each record: `people: { me, wife }` → `people: { "me": me, "wife": wife }` (same keys so existing code can migrate; profile list will be `[{ id: "me", name: "Paul" }, { id: "wife", name: "Codru" }]` by default).
  - Migrated data stays valid: profile ids `"me"` and `"wife"` are the first two profiles.
- **Default profiles in store:** `profiles: [{ id: "me", name: "Paul" }, { id: "wife", name: "Codru" }]` when no persisted profiles (and partialize `profiles` in persist so they are saved).

### 2.3 Store changes ([lib/store/finance-store.ts](lib/store/finance-store.ts))

- **State:** `profiles: Profile[]` (ordered list of active profiles). `selectedPerson: PersonView`.
- **Actions:** `addProfile(name: string)`, `removeProfile(id: ProfileId)`, `renameProfile(id: ProfileId, name: string)`, `setDefaultPersonView(view: PersonView)` (or use `settings.defaultPersonView`).
- **Soft delete:** `removeProfile(id)` only removes the profile from `profiles`. Month records keep `people[id]` unchanged. No removal of keys from records.
- **Combined data:** `getCombinedData(month)` should sum `record.people[id]` for every `id` in `profiles` that exists in `record.people` (so combined = sum over active profiles that have data for that month).
- **updateMonth(month, data, person):** `person` becomes `ProfileId`. Ensure new records get default `CategoryAmounts` for every active profile (and optionally for orphaned ids present in other months, or only active ones).
- **updateMonthFull:** Accept `Record<ProfileId, CategoryAmounts>` or an array/keyed object for current profiles; when creating a new month, initialize `people` for all `profiles[*].id`.
- **duplicateMonth / resetMonth:** Operate on `record.people` as a record (copy or reset all keys that are in the source record or in active profiles).

### 2.4 Calculations and dashboard data

- **[lib/calculations/calculations.ts](lib/calculations/calculations.ts):** Add `combineCategoryAmountsMany(items: CategoryAmounts[]): CategoryAmounts` (or reuse `sumCategoryAmounts`). `getCombinedData` will pass `Object.values(record.people)` filtered by active profile ids and then sum.
- **[lib/dashboard/dashboard-data.ts](lib/dashboard/dashboard-data.ts):** `getDataForPerson(record, selectedPerson, getCombinedData)` — when `selectedPerson === "combined"` use new combined logic; otherwise `record.people[selectedPerson]`. Replace hardcoded `buildPaulVsCodruData` with a generic "per-profile comparison" that takes `profiles` and builds rows for each profile (columns = profile names, rows = Venit / Cheltuieli / Investiții / Cashflow net). Function name e.g. `buildProfileComparisonData(recordByMonth, selectedYear, profileIds, profileNames, ...)`.

### 2.5 UI — Settings modal: Profiles section

- **Profiles list:** Show each profile with display name and "Rename" / "Remove". "Add profile" button.
- **Rename:** Inline edit or small modal; update store `renameProfile(id, name)`.
- **Remove:** Confirm "Hide this profile? Its data will stay but won't be shown. You can add it back later." Then `removeProfile(id)`.
- **Default person view:** Dropdown or segments: "Last used" plus each active profile plus "Combined". Save to `settings.defaultPersonView`.

### 2.6 UI — Header and dashboard

- **Header ([components/layout/Header.tsx](components/layout/Header.tsx)):** Person segment options = `profiles.map(p => ({ value: p.id, label: p.name }))` plus `{ value: "combined", label: "Împreună" }`. Same for dashboard page segment control.
- **Dashboard ([app/page.tsx](app/page.tsx)):** `personOptions` from store `profiles` + combined. All `getDataForPerson` / chart calls already take `selectedPerson`; they will receive profile id or `"combined"`. Replace Paul/Codru comparison table with the generic profile-comparison table (columns = profile names from `profiles`).

### 2.7 UI — Monthly input

- **[components/monthly-input/MonthlyInputClient.tsx](components/monthly-input/MonthlyInputClient.tsx):** Replace fixed two columns (me / wife) with dynamic columns: one per `profiles` entry. Each column header = profile name; each row = category; values from `formData[profileId]`. `formData` shape: `Record<ProfileId, CategoryAmounts>`. Load/save using `people` from record keyed by profile id. When there are 0 profiles, show empty state and prompt to add a profile in Settings.

### 2.8 Constants and PERSON_LABELS

- **Remove or replace [lib/constants.ts](lib/constants.ts) `PERSON_LABELS`:** Labels come from store `profiles` (id → name). Any remaining references (e.g. aria-labels, tests) should use `profiles` or a helper `getProfileName(id)`.

### 2.9 Export/import and backup

- **Export:** Include `profiles` in the backup payload (so "full backup" has records + profiles). Data-only can stay records-only. When we add profiles to the store, export logic in [lib/settings/data-io.ts](lib/settings/data-io.ts) (or storage) should include profiles in the exported JSON if doing full backup.
- **Import:** On restore, if backup contains `profiles`, restore them into the store; otherwise keep current store profiles (or default to me/wife with default names for v2 backups). Validate records so `people` keys are not required to match current profile list (orphaned ids are allowed for soft delete).

### 2.10 Tests and cleanup

- Update [lib/storage/__tests__/migrations.test.ts](lib/storage/__tests__/migrations.test.ts) for v2→v3 migration.
- Update [lib/dashboard/__tests__/dashboard-data.test.ts](lib/dashboard/__tests__/dashboard-data.test.ts): use profile ids instead of `"me"`/`"wife"` where needed; add combined test over record with dynamic keys.
- Update [lib/store/record-helpers.ts](lib/store/record-helpers.ts) if it assumes `me`/`wife`.
- Fix any remaining `Person`/`PersonView`/`PERSON_LABELS`/`people.me`/`people.wife` references across the app and e2e.

---

## Phase 3 — Notifications (placeholder)

- **Settings modal:** "Notifications" section with a short description ("Remind before upcoming payments", etc.) and a disabled toggle or "Coming soon" note.
- **Store:** Optional `settings.notificationsEnabled: boolean` (default false) and `settings.notificationsDaysBefore: number` (e.g. 1) so future implementation can hook into the same settings without another migration.

---

## Implementation order (summary)

| Order | Item | Phase |
|-------|------|--------|
| 1 | Clear all data | 1 |
| 2 | Refresh exchange rates | 1 |
| 3 | Decimal places | 1 |
| 4 | Date/locale | 1 |
| 5 | Export format | 1 |
| 6 | Default person view (store + UI, still me/wife) | 1 |
| 7 | Types + schema + migration v2→v3 (profiles + people record) | 2 |
| 8 | Store: profiles state + add/remove/rename + getCombinedData | 2 |
| 9 | Calculations + dashboard-data (combined many, profile comparison) | 2 |
| 10 | Settings modal: Profiles management + default view | 2 |
| 11 | Header + dashboard page: options from profiles | 2 |
| 12 | Monthly input: dynamic columns from profiles | 2 |
| 13 | Export/import include profiles; constants cleanup | 2 |
| 14 | Tests + e2e + any remaining references | 2 |
| 15 | Notifications placeholder in settings | 3 |

---

## Files to touch (high level)

- **Settings:** [SettingsModal.tsx](components/shared/SettingsModal.tsx), [finance-store.ts](lib/store/finance-store.ts), [data-io.ts](lib/settings/data-io.ts), [currency.ts](lib/utils/currency.ts), [date.ts](lib/utils/date.ts).
- **Profiles:** [types.ts](lib/types.ts), [schemas.ts](lib/validation/schemas.ts), [migrations.ts](lib/storage/migrations.ts), [storage.ts](lib/storage/storage.ts), [finance-store.ts](lib/store/finance-store.ts), [calculations.ts](lib/calculations/calculations.ts), [dashboard-data.ts](lib/dashboard/dashboard-data.ts), [Header.tsx](components/layout/Header.tsx), [page.tsx](app/page.tsx), [MonthlyInputClient.tsx](components/monthly-input/MonthlyInputClient.tsx), [constants.ts](lib/constants.ts), plus tests and e2e.

---

## Risk / notes

- **Profile id stability:** Use stable ids (e.g. `crypto.randomUUID()` on add). Migration uses `"me"` and `"wife"` so existing data gets the same ids and names via default profiles.
- **Soft delete + "Restore":** Not in this plan. Later you can add "Add profile from existing data" by scanning records for keys not in `profiles` and offering to create a profile with that id and a new name.
- **Min profiles:** Allow 0 profiles for monthly input (show empty state) or enforce ≥ 1 in UI (e.g. "Add at least one profile"). Recommend ≥ 1 for combined view to make sense.
