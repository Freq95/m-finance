# Deep Technical Audit: Notifications, Calendar & Settings

**Date:** January 31, 2026  
**Auditor:** Senior Principal Software Engineer  
**Scope:** Focused review of Notifications, Calendar, and Settings modules in `m-finance-dash`

---

## Executive Summary

| Module | Readiness | Go/No-Go |
|--------|-----------|----------|
| **Notifications** | 65% | Conditional Go |
| **Calendar** | 85% | Go |
| **Settings** | 92% | Go |

**Overall Assessment:** The Calendar and Settings modules are production-ready. Notifications has significant gaps between what the UI promises and what is actually implemented.

---

## Module 1: Notifications

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Notifications Flow                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌───────────────────────────┐    ┌──────────────────┐  │
│  │ finance-store│───▶│ useDuePaymentsNotification│───▶│ Header (Bell)    │  │
│  │              │    │                           │    │                  │  │
│  │ settings:    │    │ - getPaymentsDueWithinDays│    │ - Shows count    │  │
│  │ - enabled    │    │ - session dismiss tracking│    │ - Opens modal    │  │
│  │ - daysBefore │    │ - Browser Notification API│    │ - Bell animation │  │
│  │              │    │                           │    │                  │  │
│  │ upcomingPay- │    └───────────────────────────┘    └────────┬─────────┘  │
│  │ ments[]      │                                              │            │
│  └──────────────┘                                              ▼            │
│                                                    ┌───────────────────────┐│
│                                                    │ DuePaymentsModal      ││
│                                                    │ - List due payments   ││
│                                                    │ - Mark as done        ││
│                                                    └───────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components Analyzed

| File | Purpose | Status |
|------|---------|--------|
| `lib/notifications.ts` | Pure functions for date calculations | ✅ Solid |
| `lib/useDuePaymentsNotification.ts` | React hook for notification state | ⚠️ Issues |
| `components/shared/DuePaymentsModal.tsx` | UI for viewing due payments | ✅ Good |
| `lib/__tests__/notifications.test.ts` | Unit tests | ✅ Good coverage |
| `lib/__tests__/useDuePaymentsNotification.test.ts` | Hook tests | ✅ Good coverage |

### Critical Issues

#### 1. Notification Persistence Uses Session Storage
**File:** `lib/useDuePaymentsNotification.ts` (lines 9-31)

```typescript
const STORAGE_KEY = "finance-notification-dismissed-ids";
// Uses sessionStorage, not localStorage
```

**Problem:** Dismissed notifications reset when the browser is closed. Users will see the same notifications again on next session.

**Impact:** User annoyance; defeats purpose of "dismiss" action.

**Fix:** Use `localStorage` instead of `sessionStorage`, or store dismissed IDs in the Zustand store (persisted).

#### 2. Browser Notifications Only Trigger When App Is Open
**File:** `lib/useDuePaymentsNotification.ts` (lines 101-139)

**Problem:** The `Notification` API is only triggered during React render cycles. If the user doesn't open the app, they never get notified about upcoming payments.

**Impact:** The "notification" feature is fundamentally limited—it's an in-app alert, not a system notification scheduler.

**User Expectation vs Reality:**
- **UI says:** "Remind before upcoming payments"
- **Reality:** Only reminds if you're already looking at the app

**Options:**
1. **Document limitation** clearly in UI ("Reminders shown when app is open")
2. **Add Service Worker** for background push notifications (requires backend)
3. **Add calendar export** (.ics) so users get reminders via their calendar app

#### 3. No Permission Pre-Request UI
**File:** `lib/useDuePaymentsNotification.ts` (lines 108-135)

**Problem:** Permission is only requested when there are already due payments. No way for users to proactively grant permission.

**Impact:** First notification might be missed because permission dialog appears too late.

**Fix:** Add a button in Settings to request notification permission:
```typescript
const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
};
```

### Major Risks

#### 4. Hardcoded Romanian Text in Notifications
**File:** `lib/useDuePaymentsNotification.ts` (lines 96-99)

```typescript
`${toShow.length} plăți în următoarele ${notificationsDaysBefore} zile: ...`
```

**Problem:** Even when `dateLocale` is set to "en", the notification summary is in Romanian.

**Impact:** Inconsistent i18n; confusing for non-Romanian users.

**Fix:** Use locale-aware message formatting.

#### 5. Days Selector Values Hardcoded
**File:** `components/shared/SettingsModal.tsx` (line 452)

```typescript
{([1, 3, 7, 14, 31] as const).map((days) => ...)}
```

**Problem:** Magic numbers; 31 days is an odd choice (why not 30?); not configurable.

**Recommendation:** Move to constants file; consider if 31 is intentional or should be 30.

### Minor Issues

#### 6. Dismiss Handles All Due Payments at Once
**File:** `lib/useDuePaymentsNotification.ts` (lines 141-145)

```typescript
const handleDismiss = () => {
  const ids = duePayments.map((p) => p.id);
  addDismissedIds(ids);
  ...
};
```

**Issue:** No way to dismiss individual payments; it's all-or-nothing.

**Improvement:** Add per-item dismiss in `DuePaymentsModal`.

#### 7. Bell Animation Never Stops
**File:** `components/layout/Header.tsx` (line 78)

```typescript
duePayments.length > 0 ? "... animate-bell-ring" : "..."
```

**Issue:** Animation runs continuously while there are due payments. Could be distracting.

**Improvement:** Consider one-time animation on count change, not constant.

### Test Coverage: ✅ Good

| Test File | Coverage |
|-----------|----------|
| `notifications.test.ts` | `getPaymentsDueWithinDays` - edge cases covered |
| `useDuePaymentsNotification.test.ts` | Hook behavior, dismissal, disabled state |

---

## Module 2: Calendar

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Calendar Flow                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Header.tsx                                                                  │
│       │                                                                      │
│       ▼ onOpenCalendar()                                                    │
│  AppShell.tsx ─────────────▶ CalendarModal.tsx                              │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│            12-Month Grid    Payment List    Year Navigator                  │
│                    │               │                                         │
│                    ▼               ▼                                         │
│            MiniMonthGrid    UpcomingPaymentViewModal                        │
│            (click day)           │                                           │
│                    │             ▼                                           │
│                    └───▶ UpcomingPaymentModal (add/edit)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components Analyzed

| File | Purpose | Status |
|------|---------|--------|
| `components/shared/CalendarModal.tsx` | Yearly calendar view | ✅ Well-built |
| `components/shared/UpcomingPaymentModal.tsx` | Add/edit payment | ✅ Good |
| `components/shared/UpcomingPaymentViewModal.tsx` | View/actions | ✅ Good |
| `lib/upcoming-payment-icons.tsx` | Icon registry | ✅ Clean |
| `docs/CALENDAR_YEARLY_VIEW_PLAN.md` | Implementation plan | ✅ Followed |
| `docs/APPLE_CALENDAR_SYNC.md` | Sync options doc | 📋 Not implemented |

### Critical Issues

None. Calendar module is complete and functional.

### Major Risks

#### 1. No Date Validation for "Upcoming" Payments
**File:** `components/shared/UpcomingPaymentModal.tsx` (lines 81-96)

**Problem:** Users can add payments with dates in the past. "Upcoming" implies future.

```typescript
const handleSubmit = (e: React.FormEvent) => {
  // No validation that form.date >= today
  ...
};
```

**Impact:** Confusion; past payments mixed with upcoming in the list.

**Fix:** Add validation:
```typescript
const today = new Date().toISOString().slice(0, 10);
if (form.date < today) {
  setError("Data trebuie să fie în viitor");
  return;
}
```

#### 2. No Recurring Payment Support
**Problem:** Each payment is one-time. Common bills (rent, subscriptions) need to be re-added monthly.

**Impact:** Significant manual effort for typical use cases.

**Recommendation:** Add recurrence field (`weekly`, `monthly`, `yearly`, `none`) and auto-generate future instances.

### Minor Issues

#### 3. Year Jump Limited to +/- 1
**File:** `components/shared/CalendarModal.tsx` (lines 200-220)

**Problem:** Can only navigate year by year. No quick jump to a specific year.

**Improvement:** Add clickable year label that opens a year picker.

#### 4. Deprecated Icon Migration
**File:** `lib/upcoming-payment-icons.tsx` (lines 38-41)

```typescript
const deprecatedIconFallback: Record<string, LucideIcon> = {
  Receipt: Wallet,
  Calendar: Home,
};
```

**Observation:** Good backward compatibility handling. Also in `UpcomingPaymentModal.tsx` line 57-61.

#### 5. No Filter/Search in Payments List
**File:** `components/shared/CalendarModal.tsx` (lines 272-387)

**Problem:** All payments shown; no way to filter by date range or search by title.

**Improvement:** Add search input and month filter for large payment lists.

#### 6. Export to Calendar Not Implemented
**File:** `docs/APPLE_CALENDAR_SYNC.md`

**Status:** Well-documented plan exists for .ics export. Option 1 (download .ics) is low-effort and would add significant value.

**Recommendation:** Implement .ics export as next feature.

### Test Coverage: ⚠️ Low

No dedicated unit tests for CalendarModal components. E2E tests don't cover calendar.

**Recommendation:** Add:
- Unit tests for `MiniMonthGrid` date calculations
- E2E test for opening calendar, navigating years, adding payment

---

## Module 3: Settings

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Settings Flow                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Header.tsx ──▶ AppShell.tsx ──▶ SettingsModal.tsx                          │
│                                       │                                      │
│                    ┌──────────────────┼──────────────────┐                  │
│                    ▼                  ▼                  ▼                  │
│            Net Cashflow        Profiles          Data I/O                   │
│            Toggle          Add/Rename/Remove    Export/Import               │
│                    │                  │                  │                  │
│                    ▼                  ▼                  ▼                  │
│            finance-store.ts    ConfirmationModal   data-io.ts               │
│            updateSettings()    (delete confirm)    exportBackup()           │
│                                                    importBackup()           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components Analyzed

| File | Purpose | Status |
|------|---------|--------|
| `components/shared/SettingsModal.tsx` | Main settings UI | ✅ Complete |
| `lib/settings/data-io.ts` | Export/import logic | ✅ Solid |
| `lib/settings/__tests__/data-io.test.ts` | Unit tests | ✅ Good |
| `e2e/settings.spec.ts` | E2E tests | ✅ Good |

### Critical Issues

All previously identified critical issues have been **FIXED**:

1. ✅ `SettingsModalProps` type added
2. ✅ Profile limits enforced (min 1, max 5)
3. ✅ UI reflects limits (disabled buttons, messages)

### Major Risks

#### 1. Exchange Rate Fetch Failure Silent
**File:** `components/layout/AppShell.tsx` (lines 35-43)

```typescript
useEffect(() => {
  fetchExchangeRates().then(setExchangeRates);
}, [setExchangeRates]);
```

**Problem:** If fetch fails, `exchangeRates` stays `null`. Header shows "$ — / € —" but no error message.

**Impact:** User doesn't know rates failed; currency display shows dashes without explanation.

**Fix:** Add error state or show toast on failure:
```typescript
fetchExchangeRates()
  .then(setExchangeRates)
  .catch(() => {
    // Show toast or set error state
  });
```

#### 2. Import Overwrites Without Merge Option
**File:** `lib/settings/data-io.ts` (lines 52-63)

**Problem:** Import always replaces all data. No option to merge with existing data.

**Impact:** User could accidentally lose data if they import an old backup.

**Improvement:** Add merge option: "Replace all" vs "Merge (keep newer)"

### Minor Issues

#### 3. Theme Toggle Not in Settings
**File:** `components/shared/SettingsModal.tsx`

**Problem:** Theme toggle is only in Header. Settings has other display preferences but not theme.

**Improvement:** Add theme setting to Settings for discoverability.

#### 4. Clear All Data Confirmation Could Be Stronger
**File:** `components/shared/SettingsModal.tsx` (lines 534-543)

**Current:** Single confirmation modal.

**Improvement:** Consider requiring user to type "DELETE" to confirm, preventing accidental clicks.

#### 5. Notifications Days Selector UX
**File:** `components/shared/SettingsModal.tsx` (lines 451-467)

**Problem:** Days buttons (1, 3, 7, 14, 31) have no explanation of what they mean.

**Improvement:** Add tooltip or subtitle explaining "Notify this many days before each payment's due date"

### Test Coverage: ✅ Good

| Test Type | Coverage |
|-----------|----------|
| Unit (`data-io.test.ts`) | Export/import logic |
| E2E (`settings.spec.ts`) | Modal open, export/import buttons, notifications toggle |

---

## Cross-Module Issues

### 1. No Central Error Handling for Async Operations
**Problem:** Export, import, exchange rate fetch all handle errors locally with varying approaches.

**Recommendation:** Create unified error toast/banner system.

### 2. Inconsistent i18n
**Problem:** Mix of Romanian and English text across modules.

| Location | Language |
|----------|----------|
| Notification summary | Romanian |
| Settings labels | English + Romanian |
| Calendar labels | Romanian |
| Button labels | Mixed |

**Recommendation:** Choose one language and apply consistently, or implement proper i18n.

### 3. No Undo for Destructive Actions
**Problem:** Deleting payment, clearing data, marking as done—all are immediate with no undo.

**Recommendation:** Implement undo toast pattern: "Payment deleted. [Undo]"

---

## Missing Components / Gaps

| Feature | Status | Priority |
|---------|--------|----------|
| .ics calendar export | Documented, not implemented | Medium |
| Recurring payments | Not supported | High |
| Notification permission button | Missing | Low |
| Merge import option | Missing | Low |
| Theme in Settings | Missing (only in Header) | Low |
| Notification scheduling/Service Worker | Not possible without backend | N/A |

---

## Improvement Roadmap

### Phase 1: Quick Wins (1-2 days)
1. Add past-date validation in UpcomingPaymentModal
2. Move dismissed notification IDs to localStorage or store
3. Add notification permission request button in Settings
4. Fix hardcoded Romanian in notification summary

### Phase 2: High Value (1 week)
5. Implement .ics calendar export
6. Add error toast for exchange rate fetch failure
7. Add theme toggle to Settings modal
8. Add E2E tests for Calendar

### Phase 3: Feature Enhancement (2+ weeks)
9. Implement recurring payments
10. Add merge option for import
11. Add search/filter in Calendar payments list
12. Consider Service Worker for background notifications

---

## Summary Table

| Issue | Severity | Module | Status |
|-------|----------|--------|--------|
| Dismissed notifications reset on browser close | Major | Notifications | Open |
| Notifications only work when app is open | Major | Notifications | By Design (document) |
| No notification permission pre-request | Minor | Notifications | Open |
| Hardcoded Romanian in notification text | Minor | Notifications | Open |
| No date validation for upcoming payments | Major | Calendar | Open |
| No recurring payment support | Major | Calendar | Open |
| .ics export not implemented | Minor | Calendar | Open (documented) |
| Exchange rate failure silent | Major | Settings | Open |
| No merge option for import | Minor | Settings | Open |
| SettingsModalProps missing | Critical | Settings | ✅ Fixed |
| No profile limits | Critical | Settings | ✅ Fixed |

---

## Conclusion

### Notifications Module (65% - Conditional Go)
The notification system works for in-app alerts but falls short of user expectations for "reminders." The implementation is technically correct but the feature is limited by the client-only architecture. **Recommendation:** Document limitations clearly or implement .ics export as an alternative.

### Calendar Module (85% - Go)
Well-implemented yearly calendar with good UX. Missing features (recurring payments, date validation) are enhancements rather than blockers. **Recommendation:** Ship, then iterate on recurring payments.

### Settings Module (92% - Go)
Production-ready after the recent fixes. Profile limits enforced, type safety restored. Remaining issues are minor UX improvements. **Recommendation:** Ship.

**Overall: The application can ship with these modules. Priority should be documenting notification limitations and adding past-date validation for payments.**
