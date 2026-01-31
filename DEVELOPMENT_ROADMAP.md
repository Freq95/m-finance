# Finance Dashboard — Development Roadmap

**Created:** January 31, 2026  
**Based on:** Deep Financial & Technical Audit  
**Goal:** Transform expense tracker into FIRE-ready financial planning tool

---

## Development Phase Plan

```
Phase 0 ──────────────────────────────────────────────────────────────────────
│ FINANCIAL MODEL FIXES                                        Est: 3-5 days │
│ Fix misleading metrics, separate savings/investments                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ [0.1] Separate Savings Rate calculation                                    │
│ [0.2] Emergency Fund coverage metric                                       │
│ [0.3] Show both Net Cashflow variants                                      │
│ [0.4] Add data backup reminder system                                      │
│ [0.5] Remove or hide Savings Plan (defer redesign)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 1 ──────────────────────────────────────────────────────────────────────
│ NET WORTH FOUNDATION                                        Est: 1-2 weeks │
│ Add assets, liabilities, net worth tracking                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ [1.1] Assets data model & storage                                          │
│ [1.2] Liabilities data model & storage                                     │
│ [1.3] Net Worth calculation & dashboard widget                             │
│ [1.4] Monthly net worth snapshots                                          │
│ [1.5] Net Worth trend chart                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 2 ──────────────────────────────────────────────────────────────────────
│ FIRE METRICS                                                Est: 1 week    │
│ Calculate and display financial independence progress                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ [2.1] True Savings Rate calculation (post-tax)                             │
│ [2.2] FIRE number calculation (25× annual expenses)                        │
│ [2.3] FIRE progress percentage                                             │
│ [2.4] Years to FIRE projection                                             │
│ [2.5] FIRE dashboard panel                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 3 ──────────────────────────────────────────────────────────────────────
│ BUDGET VS ACTUAL                                            Est: 1-2 weeks │
│ Enable budget targets and variance tracking                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ [3.1] Budget targets data model                                            │
│ [3.2] Budget input UI per category                                         │
│ [3.3] Variance calculation (over/under)                                    │
│ [3.4] Budget vs Actual comparison view                                     │
│ [3.5] Overspending alerts                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 4 ──────────────────────────────────────────────────────────────────────
│ GOAL-BASED SAVINGS                                          Est: 1-2 weeks │
│ Replace disconnected Savings Plan with goal tracking                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ [4.1] Goals data model (name, target, deadline, progress)                  │
│ [4.2] Goals management UI                                                  │
│ [4.3] Progress tracking with auto-calculation                              │
│ [4.4] Goal allocation from monthly savings                                 │
│ [4.5] Goal completion notifications                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 5 ──────────────────────────────────────────────────────────────────────
│ DEBT PAYOFF TRACKER                                         Est: 1 week    │
│ Track loans with payoff projections                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [5.1] Debt data model (balance, rate, minimum payment)                     │
│ [5.2] Debt list UI with progress                                           │
│ [5.3] Payoff date projection                                               │
│ [5.4] Snowball vs Avalanche comparison                                     │
│ [5.5] Interest saved calculation                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 6 ──────────────────────────────────────────────────────────────────────
│ POLISH & CONSOLIDATION                                      Est: 1 week    │
│ UX improvements, calendar integration, cleanup                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [6.1] Merge upcoming payments into unified calendar                        │
│ [6.2] Auto-populate income estimates from records                          │
│ [6.3] Storage quota warning                                                │
│ [6.4] Exchange rate error feedback                                         │
│ [6.5] Dashboard layout optimization                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Phase 7 (Future) ─────────────────────────────────────────────────────────────
│ MULTI-USER & SYNC                                           Est: 2-3 weeks │
│ Optional cloud sync, audit trail, user roles                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ [7.1] Cloud sync integration (Google Drive / Dropbox)                      │
│ [7.2] Change audit trail                                                   │
│ [7.3] User roles (viewer / editor)                                         │
│ [7.4] Conflict resolution for multi-device                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Financial Model Fixes

**Goal:** Fix misleading metrics before adding new features  
**Duration:** 3-5 days  
**Priority:** CRITICAL — Current metrics can mislead financial decisions

### Task 0.1: Separate Savings Rate Calculation

**Problem:** Current `savingsRate` conflates savings + investments  

**Files to modify:**
- `lib/calculations/calculations.ts`
- `lib/dashboard/dashboard-data.ts`
- `app/page.tsx`

**Implementation:**

```typescript
// NEW: lib/calculations/calculations.ts

/** Savings only (emergency fund, short-term) */
export function calculateSavingsTotal(data: CategoryAmounts): number {
  return data.economii;
}

/** Investments only (long-term growth) */
export function calculateInvestmentsOnly(data: CategoryAmounts): number {
  return data.investitii;
}

/** True Savings Rate = Savings / Income × 100 */
export function calculateSavingsRate(data: CategoryAmounts): number {
  const income = calculateIncomeTotal(data);
  if (income <= 0) return 0;
  return Math.round((data.economii / income) * 100);
}

/** Investment Rate = Investments / Income × 100 */
export function calculateInvestmentRate(data: CategoryAmounts): number {
  const income = calculateIncomeTotal(data);
  if (income <= 0) return 0;
  return Math.round((data.investitii / income) * 100);
}

/** Combined Rate (for FIRE) = (Savings + Investments) / Income × 100 */
export function calculateCombinedSavingsRate(data: CategoryAmounts): number {
  const income = calculateIncomeTotal(data);
  if (income <= 0) return 0;
  return Math.round(((data.economii + data.investitii) / income) * 100);
}
```

**Dashboard changes:**
- Show "Savings Rate" and "Investment Rate" as separate metrics
- Add tooltip explaining the difference

**Acceptance criteria:**
- [ ] Savings and investments displayed separately
- [ ] Chart tooltips show both rates
- [ ] Settings explain what each means

---

### Task 0.2: Emergency Fund Coverage Metric

**Problem:** No visibility into financial safety buffer  

**Files to modify:**
- `lib/calculations/calculations.ts`
- `lib/dashboard/dashboard-data.ts`
- `app/page.tsx`

**Implementation:**

```typescript
// NEW: lib/calculations/calculations.ts

/**
 * Emergency Fund Coverage in months
 * Target: 3-6 months of expenses
 */
export function calculateEmergencyFundCoverage(
  savings: number,
  monthlyExpenses: number
): number {
  if (monthlyExpenses <= 0) return savings > 0 ? 12 : 0; // Cap at 12 if no expenses
  return Math.round((savings / monthlyExpenses) * 10) / 10; // 1 decimal
}

export function getEmergencyFundStatus(months: number): 'critical' | 'low' | 'good' | 'excellent' {
  if (months < 1) return 'critical';
  if (months < 3) return 'low';
  if (months < 6) return 'good';
  return 'excellent';
}
```

**Dashboard widget:**
```
┌─────────────────────────────┐
│ EMERGENCY FUND              │
│ 4.2 months coverage         │
│ ████████████░░░░ 70%        │
│ Target: 6 months            │
└─────────────────────────────┘
```

**Acceptance criteria:**
- [ ] Emergency fund months displayed on dashboard
- [ ] Color-coded status (red/yellow/green)
- [ ] Progress bar toward 6-month target

---

### Task 0.3: Show Both Net Cashflow Variants

**Problem:** Toggle in settings changes what "Cashflow net" means  

**Files to modify:**
- `app/page.tsx`
- `lib/dashboard/dashboard-data.ts`

**Implementation:**

Replace single "Cashflow net" card with two metrics:

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ SURPLUS DISPONIBIL          │  │ CASHFLOW FINAL              │
│ (înainte de economii)       │  │ (după economii)             │
│ +2,450 RON                  │  │ +650 RON                    │
└─────────────────────────────┘  └─────────────────────────────┘
```

**Labels:**
- "Surplus disponibil" = Income - Expenses (what you CAN save)
- "Cashflow final" = Income - Expenses - Savings - Investments (what's left)

**Acceptance criteria:**
- [ ] Both metrics always visible
- [ ] Remove confusing settings toggle
- [ ] Clear labels with tooltips

---

### Task 0.4: Data Backup Reminder System

**Problem:** Local-only storage, no backup prompts  

**Files to create/modify:**
- `lib/store/finance-store.ts` (add lastBackupDate)
- `components/shared/BackupReminderModal.tsx` (new)
- `components/layout/AppShell.tsx`

**Implementation:**

```typescript
// Store additions
interface FinanceState {
  // ... existing
  lastBackupDate: string | null; // ISO date
  setLastBackupDate: (date: string) => void;
}

// Check on app load
const daysSinceBackup = lastBackupDate 
  ? differenceInDays(new Date(), new Date(lastBackupDate))
  : Infinity;

if (daysSinceBackup > 30) {
  showBackupReminder();
}
```

**Reminder modal:**
- "Your last backup was X days ago"
- "Export Backup Now" button
- "Remind me later" (snooze 7 days)
- "Don't remind me" (persist preference)

**Acceptance criteria:**
- [ ] Reminder appears if no backup in 30 days
- [ ] Export button works from reminder
- [ ] Snooze/disable options work

---

### Task 0.5: Remove or Hide Savings Plan

**Problem:** Disconnected template creates confusion  

**Files to modify:**
- `components/layout/Header.tsx` (remove button)
- `components/shared/SavingsPlanModal.tsx` (keep but don't render)

**Implementation:**

Option A (Recommended): Hide the button, keep code for Phase 4 redesign
```typescript
// Header.tsx - comment out or remove
// <SavingsPlanButton onClick={() => setSavingsPlanOpen(true)} />
```

Option B: Delete entirely and rebuild in Phase 4

**Acceptance criteria:**
- [ ] Savings Plan button not visible
- [ ] No console errors
- [ ] Data preserved for future redesign

---

## Phase 1: Net Worth Foundation

**Goal:** Track assets and liabilities to calculate net worth  
**Duration:** 1-2 weeks  
**Priority:** HIGH — Core FIRE metric

### Task 1.1: Assets Data Model & Storage

**Files to create/modify:**
- `lib/types.ts`
- `lib/validation/schemas.ts`
- `lib/store/finance-store.ts`
- `lib/storage/migrations.ts`

**Data model:**

```typescript
// lib/types.ts

export type AssetType = 
  | 'cash'           // Bank accounts, cash
  | 'investments'    // Stocks, bonds, funds
  | 'retirement'     // Pension, 401k equivalent
  | 'property'       // Real estate
  | 'vehicle'        // Cars, motorcycles
  | 'other';         // Other valuable assets

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  balance: number;          // Current value
  currency: 'RON' | 'USD' | 'EUR';
  lastUpdated: string;      // ISO date
  notes?: string;
  /** For investments: annual return rate estimate */
  expectedReturn?: number;  // e.g., 0.07 for 7%
};

export type AssetSnapshot = {
  date: string;             // YYYY-MM-DD
  assets: Record<string, number>;  // assetId -> balance
  totalAssets: number;
};
```

**Store additions:**

```typescript
interface FinanceState {
  // ... existing
  assets: Asset[];
  assetSnapshots: AssetSnapshot[];
  
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  snapshotAssets: () => void;  // Monthly snapshot
}
```

**Acceptance criteria:**
- [ ] Asset CRUD operations work
- [ ] Assets persist to storage
- [ ] Migration handles existing data (no assets = empty array)

---

### Task 1.2: Liabilities Data Model & Storage

**Files to modify:**
- `lib/types.ts`
- `lib/validation/schemas.ts`
- `lib/store/finance-store.ts`

**Data model:**

```typescript
// lib/types.ts

export type LiabilityType = 
  | 'mortgage'       // Home loan
  | 'car_loan'       // Auto loan
  | 'personal_loan'  // Personal/consumer loan
  | 'credit_card'    // Credit card debt
  | 'student_loan'   // Education loan
  | 'other';         // Other debts

export type Liability = {
  id: string;
  name: string;
  type: LiabilityType;
  originalAmount: number;     // Initial loan amount
  currentBalance: number;     // Remaining balance
  interestRate: number;       // Annual rate (e.g., 0.05 for 5%)
  minimumPayment: number;     // Monthly minimum
  currency: 'RON' | 'USD' | 'EUR';
  startDate: string;          // When loan started
  endDate?: string;           // Expected payoff date
  linkedCategory?: string;    // Link to 'rate' category for tracking
  notes?: string;
};
```

**Store additions:**

```typescript
interface FinanceState {
  // ... existing
  liabilities: Liability[];
  
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  updateLiability: (id: string, updates: Partial<Liability>) => void;
  removeLiability: (id: string) => void;
}
```

**Acceptance criteria:**
- [ ] Liability CRUD operations work
- [ ] Liabilities persist to storage
- [ ] Interest rate stored correctly

---

### Task 1.3: Net Worth Calculation & Dashboard Widget

**Files to create/modify:**
- `lib/calculations/calculations.ts`
- `app/page.tsx`
- `components/dashboard/NetWorthCard.tsx` (new)

**Calculations:**

```typescript
// lib/calculations/calculations.ts

export function calculateTotalAssets(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.balance, 0);
}

export function calculateTotalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
}

export function calculateNetWorth(assets: Asset[], liabilities: Liability[]): number {
  return calculateTotalAssets(assets) - calculateTotalLiabilities(liabilities);
}
```

**Widget design:**

```
┌─────────────────────────────────────────┐
│ NET WORTH                               │
│ 142,350 RON                    ↑ 3.2%   │
│                                         │
│ Assets:      185,000 RON                │
│ Liabilities: -42,650 RON                │
└─────────────────────────────────────────┘
```

**Acceptance criteria:**
- [ ] Net Worth displayed prominently
- [ ] Breakdown shows assets vs liabilities
- [ ] Percentage change from last month

---

### Task 1.4: Monthly Net Worth Snapshots

**Files to modify:**
- `lib/store/finance-store.ts`
- `components/layout/AppShell.tsx`

**Implementation:**

```typescript
// Auto-snapshot on first day of month or when assets change significantly

function snapshotAssets(): void {
  const today = new Date().toISOString().split('T')[0];
  const existingToday = assetSnapshots.find(s => s.date === today);
  
  if (existingToday) {
    // Update today's snapshot
    updateSnapshot(today, assets);
  } else {
    // Create new snapshot
    addSnapshot({
      date: today,
      assets: Object.fromEntries(assets.map(a => [a.id, a.balance])),
      totalAssets: calculateTotalAssets(assets),
    });
  }
}
```

**Acceptance criteria:**
- [ ] Snapshot created on asset update
- [ ] Historical snapshots preserved
- [ ] At least one snapshot per month

---

### Task 1.5: Net Worth Trend Chart

**Files to create:**
- `components/dashboard/NetWorthChart.tsx`

**Chart design:**
- Line chart showing net worth over time
- X-axis: months
- Y-axis: RON value
- Optional: stacked area showing assets vs liabilities

**Acceptance criteria:**
- [ ] Chart displays 12-month history
- [ ] Tooltips show exact values
- [ ] Handles missing months gracefully

---

## Phase 2: FIRE Metrics

**Goal:** Calculate and display financial independence progress  
**Duration:** 1 week  
**Priority:** HIGH — Key motivation metrics

### Task 2.1: True Savings Rate Calculation

**Files to modify:**
- `lib/calculations/calculations.ts`
- `lib/types.ts`

**Implementation:**

```typescript
/**
 * True Savings Rate after expenses
 * = (Income - All Expenses) / Income × 100
 * 
 * Note: For Romania, gross ≈ net for most employees (taxes withheld)
 */
export function calculateTrueSavingsRate(
  income: number,
  expenses: number,
  savings: number,
  investments: number
): number {
  if (income <= 0) return 0;
  const saved = savings + investments;
  // Verify: saved should equal income - expenses in balanced budget
  return Math.round((saved / income) * 100);
}
```

---

### Task 2.2: FIRE Number Calculation

**Files to modify:**
- `lib/calculations/calculations.ts`
- `lib/store/finance-store.ts` (add settings)

**Implementation:**

```typescript
/**
 * FIRE Number = Annual Expenses × 25 (4% safe withdrawal rate)
 * Alternative: × 33 for 3% SWR (more conservative)
 */
export function calculateFIRENumber(
  annualExpenses: number,
  withdrawalRate: number = 0.04  // 4% default
): number {
  return annualExpenses / withdrawalRate;
}

// Example: 
// Monthly expenses: 5,000 RON
// Annual: 60,000 RON
// FIRE Number (4%): 1,500,000 RON
```

**Settings:**
- Allow user to choose SWR: 3%, 3.5%, 4%
- Show impact on FIRE number

---

### Task 2.3: FIRE Progress Percentage

**Implementation:**

```typescript
export function calculateFIREProgress(
  netWorth: number,
  fireNumber: number
): number {
  if (fireNumber <= 0) return 0;
  return Math.min(100, Math.round((netWorth / fireNumber) * 100));
}
```

---

### Task 2.4: Years to FIRE Projection

**Implementation:**

```typescript
/**
 * Years to FIRE using compound growth projection
 * 
 * Formula: Years = ln((FV/PMT + 1)) / ln(1 + r)
 * Where:
 *   FV = FIRE number - current net worth
 *   PMT = annual savings/investments
 *   r = expected return rate
 */
export function calculateYearsToFIRE(
  currentNetWorth: number,
  fireNumber: number,
  annualSavings: number,
  expectedReturn: number = 0.07  // 7% default
): number | null {
  const remaining = fireNumber - currentNetWorth;
  
  if (remaining <= 0) return 0; // Already FIRE!
  if (annualSavings <= 0) return null; // Never at current rate
  
  // Future value of annuity formula, solved for n
  const r = expectedReturn;
  const pmt = annualSavings;
  
  // Simplified: Years ≈ remaining / (annualSavings × (1 + r/2))
  // More accurate with logarithms for compound growth
  const years = Math.log((remaining * r / pmt) + 1) / Math.log(1 + r);
  
  return Math.round(years * 10) / 10; // 1 decimal
}
```

---

### Task 2.5: FIRE Dashboard Panel

**Files to create:**
- `components/dashboard/FIREPanel.tsx`

**Design:**

```
┌─────────────────────────────────────────────────────────────────┐
│ FIRE PROGRESS                                                   │
│                                                                 │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  18%         │
│                                                                 │
│ Current Net Worth:     142,350 RON                              │
│ FIRE Number (4% SWR):  1,500,000 RON                            │
│ Remaining:             1,357,650 RON                            │
│                                                                 │
│ At current savings rate: ~12.4 years to FIRE                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Savings Rate Impact                                         │ │
│ │ 25% → 30 years  |  35% → 18 years  |  50% → 12 years       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Budget vs Actual

**Goal:** Enable budget targets and variance tracking  
**Duration:** 1-2 weeks  
**Priority:** MEDIUM — Improves spending control

### Task 3.1: Budget Targets Data Model

```typescript
export type MonthlyBudget = {
  month: MonthString;
  targets: Partial<CategoryAmounts>;  // Only set categories have budgets
  createdAt: string;
};

// Or simpler: default budget that applies to all months
export type DefaultBudget = {
  targets: Partial<CategoryAmounts>;
  updatedAt: string;
};
```

### Task 3.2: Budget Input UI

Add budget column to Monthly Input or separate Budget Settings page.

### Task 3.3: Variance Calculation

```typescript
export function calculateVariance(actual: number, budget: number): {
  amount: number;
  percentage: number;
  status: 'under' | 'on-track' | 'over';
} {
  const amount = actual - budget;
  const percentage = budget > 0 ? Math.round((amount / budget) * 100) : 0;
  
  return {
    amount,
    percentage,
    status: percentage < -10 ? 'under' : percentage > 10 ? 'over' : 'on-track',
  };
}
```

### Task 3.4: Budget vs Actual View

Dashboard section or dedicated page showing variance per category.

### Task 3.5: Overspending Alerts

Notification when category exceeds budget by >10%.

---

## Phase 4: Goal-Based Savings

**Goal:** Replace disconnected Savings Plan with goal tracking  
**Duration:** 1-2 weeks  
**Priority:** MEDIUM — Improves motivation

### Task 4.1: Goals Data Model

```typescript
export type FinancialGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;           // YYYY-MM-DD
  priority: number;            // 1 = highest
  category: 'emergency' | 'short-term' | 'long-term';
  icon?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
};
```

### Task 4.2: Goals Management UI

Modal or page for CRUD operations on goals.

### Task 4.3: Progress Tracking

Visual progress bars, percentage complete, amount remaining.

### Task 4.4: Goal Allocation

Monthly allocation from savings to specific goals.

### Task 4.5: Goal Completion Notifications

Celebrate when goals are reached!

---

## Phase 5: Debt Payoff Tracker

**Goal:** Track loans with payoff projections  
**Duration:** 1 week  
**Priority:** MEDIUM — Important for debt-free path

### Tasks

5.1. Enhanced debt data model (extends Liability from Phase 1)
5.2. Debt list UI with progress bars
5.3. Payoff date projection calculator
5.4. Snowball vs Avalanche comparison tool
5.5. Interest saved calculation

---

## Phase 6: Polish & Consolidation

**Goal:** UX improvements and cleanup  
**Duration:** 1 week  
**Priority:** LOW — Quality of life

### Tasks

6.1. Merge upcoming payments into calendar
6.2. Auto-populate income estimates from actual records
6.3. Storage quota warning when approaching limit
6.4. Exchange rate fetch error feedback
6.5. Dashboard layout optimization

---

## Phase 7: Multi-User & Sync (Future)

**Goal:** Optional cloud sync and collaboration  
**Duration:** 2-3 weeks  
**Priority:** BACKLOG

### Tasks

7.1. Cloud sync integration (Google Drive / Dropbox / custom)
7.2. Change audit trail (who changed what, when)
7.3. User roles (viewer / editor)
7.4. Conflict resolution for multi-device sync

---

## Progress Tracking

### Phase 0: Financial Model Fixes
- [ ] 0.1 Separate Savings Rate calculation
- [ ] 0.2 Emergency Fund coverage metric
- [ ] 0.3 Show both Net Cashflow variants
- [ ] 0.4 Data backup reminder system
- [ ] 0.5 Remove/hide Savings Plan

### Phase 1: Net Worth Foundation
- [ ] 1.1 Assets data model & storage
- [ ] 1.2 Liabilities data model & storage
- [ ] 1.3 Net Worth calculation & dashboard widget
- [ ] 1.4 Monthly net worth snapshots
- [ ] 1.5 Net Worth trend chart

### Phase 2: FIRE Metrics
- [ ] 2.1 True Savings Rate calculation
- [ ] 2.2 FIRE number calculation
- [ ] 2.3 FIRE progress percentage
- [ ] 2.4 Years to FIRE projection
- [ ] 2.5 FIRE dashboard panel

### Phase 3: Budget vs Actual
- [ ] 3.1 Budget targets data model
- [ ] 3.2 Budget input UI
- [ ] 3.3 Variance calculation
- [ ] 3.4 Budget vs Actual view
- [ ] 3.5 Overspending alerts

### Phase 4: Goal-Based Savings
- [ ] 4.1 Goals data model
- [ ] 4.2 Goals management UI
- [ ] 4.3 Progress tracking
- [ ] 4.4 Goal allocation
- [ ] 4.5 Goal completion notifications

### Phase 5: Debt Payoff Tracker
- [ ] 5.1 Enhanced debt data model
- [ ] 5.2 Debt list UI
- [ ] 5.3 Payoff date projection
- [ ] 5.4 Snowball vs Avalanche comparison
- [ ] 5.5 Interest saved calculation

### Phase 6: Polish & Consolidation
- [ ] 6.1 Unified calendar
- [ ] 6.2 Auto-populate income estimates
- [ ] 6.3 Storage quota warning
- [ ] 6.4 Exchange rate error feedback
- [ ] 6.5 Dashboard layout optimization

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0 | 3-5 days | 1 week |
| Phase 1 | 1-2 weeks | 2-3 weeks |
| Phase 2 | 1 week | 3-4 weeks |
| Phase 3 | 1-2 weeks | 5-6 weeks |
| Phase 4 | 1-2 weeks | 7-8 weeks |
| Phase 5 | 1 week | 8-9 weeks |
| Phase 6 | 1 week | 9-10 weeks |

**Total: ~10 weeks for full implementation**

---

## Success Metrics

After implementation, the app should answer:

1. **"What is my net worth?"** → Net Worth widget (Phase 1)
2. **"Am I saving enough?"** → Savings Rate metric (Phase 0, 2)
3. **"When can I retire?"** → Years to FIRE (Phase 2)
4. **"Am I on budget?"** → Budget vs Actual (Phase 3)
5. **"How are my goals progressing?"** → Goal tracking (Phase 4)
6. **"When will I be debt-free?"** → Payoff projections (Phase 5)

**Target Financial Usefulness Score: 85/100** (up from 58/100)
