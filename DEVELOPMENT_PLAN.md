# Finance Dashboard - Development Plan

**Version**: Final (v2.0)  
**Last Updated**: 2026-01-28  
**Status**: Ready for Implementation

---

## 📋 Project Overview

**Project**: Local-only finance dashboard web application  
**Framework**: Next.js 14+ (App Router) + React + TypeScript  
**Styling**: Tailwind CSS  
**Components**: shadcn/ui  
**Charts**: Recharts  
**State**: Zustand with persistence  
**Storage**: IndexedDB via localforage (no backend, no auth)

### Technology Stack Details
- **Next.js 14+**: App Router with TypeScript strict mode
- **React 18+**: Server and Client Components
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **shadcn/ui**: Accessible component library
- **Zustand**: Lightweight state management with persistence middleware
- **localforage**: IndexedDB abstraction with fallback support
- **Recharts**: Charting library for financial visualizations
- **Zod**: Runtime validation and schema definition
- **date-fns**: Date manipulation with Romanian locale support
- **use-debounce**: Debounce hook for autosave functionality

---

## 🎨 Design System

### Design reference (target we aim for)

**The design we are building toward** is the **dashboard UI** in:

- **Image**: `design/design-target-dashboard.png`
- **Description**: `design/DESIGN_TARGET.md`

It features a three-column layout (dark left nav, main content with transfer cards / balance chart / history, right sidebar with credit card / recent activities / upcoming payments), light grey background, white cards, rounded corners, and subtle shadows. All layout and visual decisions should align with this reference.

### Layout structure
- **Desktop (>1024px)**: Three-column layout
  - Left sidebar: ~200px (15%)
  - Main content: ~800px (60%)
  - Right sidebar: ~333px (25%)
- **Tablet (768px-1024px)**: Two-column layout
  - Sidebar collapses to hamburger menu
  - Right panel stacks below main content
- **Mobile (<768px)**: Single column
  - Sidebar becomes drawer overlay
  - All panels stack vertically

### Color Palette

```typescript
// Design Tokens - lib/design-tokens.ts
export const colors = {
  // Backgrounds
  background: '#F5F7FA',      // Very light gray-blue
  card: '#FFFFFF',            // Pure white
  sidebar: '#1F2937',        // Dark gray-800
  
  // Text
  textPrimary: '#111827',     // Gray-900
  textSecondary: '#6B7280',  // Gray-500
  textMuted: '#9CA3AF',      // Gray-400
  
  // Accents
  accentPositive: '#10B981', // Green-500
  accentNegative: '#EF4444', // Red-500
  accentPrimary: '#3B82F6',  // Blue-500
  accentPrimaryHover: '#2563EB', // Blue-600
  accentPrimaryActive: '#1D4ED8', // Blue-700
  
  // Borders & Dividers
  border: '#E5E7EB',         // Gray-200
  divider: '#E5E7EB',        // Gray-200
  
  // Status Colors
  saved: '#10B981',          // Green
  savedBg: '#D1FAE5',        // Green-100
  savedText: '#065F46',      // Green-800
  draft: '#F59E0B',          // Amber
  draftBg: '#FEF3C7',        // Amber-100
  draftText: '#92400E',      // Amber-800
  pending: '#6B7280',        // Gray
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.05)',
  shadowHover: 'rgba(0, 0, 0, 0.1)',
};
```

### Typography System

```typescript
export const typography = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  
  // Headings
  h1: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  
  // Body
  body: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  
  // Labels & Small
  label: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  small: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  muted: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.4,
    color: colors.textMuted,
  },
  
  // Metric Values
  metricValue: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
};
```

### Spacing System

```typescript
export const spacing = {
  xs: '4px',   // Tight spacing, icons
  sm: '8px',   // Small gaps
  md: '16px',  // Card padding, section gaps
  lg: '24px',  // Between major sections
  xl: '32px',  // Page margins
  '2xl': '48px', // Large section separators
  
  // Specific Usage
  cardPadding: '24px',      // p-6
  sectionGap: '24px',       // gap-6
  inputSpacing: '16px',     // mb-4
  buttonPadding: '12px 24px', // px-6 py-3
};
```

### Shadow System

```typescript
export const shadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  modal: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  sidebar: '2px 0 4px rgba(0, 0, 0, 0.05)',
};
```

### Icon System

- **Library**: `lucide-react` (matches shadcn/ui)
- **Sizes**:
  - Small: 16px (inline with text)
  - Medium: 20px (buttons, cards)
  - Large: 24px (metric cards)
- **Colors**:
  - Default: `gray-600`
  - Active: `gray-900`
  - Muted: `gray-400`
  - Accent: Primary color

### Component Design Specifications

#### Metric Cards
- **Min Height**: 120px
- **Padding**: 24px
- **Layout**: Flex column, space-between
- **Icon**: Top left, 32px, category-specific color
- **Label**: Below icon, 14px, gray-600, font-weight 500
- **Value**: Large, 28px, font-weight 700, gray-900
- **Hover**: Scale 1.02, shadow increase, 150ms ease transition
- **Border Radius**: 12px

#### Chart Components
- **Bar Color**: `#3B82F6` (blue-500)
- **Bar Hover**: `#2563EB` (blue-600)
- **Grid Lines**: `#E5E7EB` (gray-200), 1px
- **Axis Labels**: 12px, gray-500
- **Tooltip**: White background, shadow, padding 12px, border radius 8px
- **Tooltip Text**: 14px, gray-900
- **Empty State**: Centered message, gray-400, 16px
- **Height**: ~300px

#### Input Table
- **Row Height**: 48px minimum
- **Section Header**: 16px padding top/bottom, gray-100 background, font-weight 600
- **Input Width**: Full width of column
- **Input Height**: 40px
- **Input Border**: 1px solid gray-300
- **Input Border Radius**: 6px
- **Input Padding**: 12px horizontal
- **Focus**: Blue border (#3B82F6), ring-2
- **Error**: Red border (#EF4444), error message below
- **Disabled** (Combined view): Gray background, cursor not-allowed

#### Credit Card Widget
- **Background**: Linear gradient (#1F2937 to #111827)
- **Dimensions**: Full width, height 200px
- **Border Radius**: 16px
- **Padding**: 24px
- **Card Number**: White, 18px, font-weight 600, letter-spacing 2px
- **Cardholder Name**: Gray-300, 14px
- **Chip**: SVG icon, top-left
- **Logo**: Bottom-right, opacity 0.8
- **Glossy Overlay**: Subtle effect

#### Button System

**Primary Button**:
- Background: `#3B82F6` (blue-500)
- Text: White
- Hover: `#2563EB` (blue-600)
- Active: `#1D4ED8` (blue-700)
- Padding: 12px 24px
- Border Radius: 6px
- Font: 14px, font-weight 500
- Transition: 150ms

**Secondary Button**:
- Background: White
- Border: 1px solid gray-300
- Text: gray-700
- Hover: gray-50 background
- Same padding and border radius as primary

**Danger Button** (Reset):
- Background: `#EF4444` (red-500)
- Text: White
- Hover: `#DC2626` (red-600)

#### Status Badges

**Saved Badge**:
- Background: `#D1FAE5` (green-100)
- Text: `#065F46` (green-800)
- Icon: Check circle, 16px
- Border Radius: 12px
- Padding: 4px 12px

**Draft Badge**:
- Background: `#FEF3C7` (amber-100)
- Text: `#92400E` (amber-800)
- Icon: Clock, 16px
- Border Radius: 12px
- Padding: 4px 12px

#### Profile Selector
- **Type**: Segmented control (tabs) in header
- **Style**: Pill-shaped buttons, 3 options side-by-side
- **Active**: Blue background (#3B82F6), white text
- **Inactive**: Gray background (#F3F4F6), gray-700 text
- **Padding**: 8px 16px
- **Border Radius**: 20px (pill)
- **Font**: 14px, font-weight 500
- **Hover**: Slight background darkening

#### Loading & Empty States

**Loading States**:
- Skeleton: Gray-200 background, shimmer animation
- Spinner: Blue-500, 24px, centered
- Chart loading: Skeleton bars with same dimensions

**Empty States**:
- Icon: 48px, gray-400
- Message: 16px, gray-500, centered
- CTA button (if applicable)

#### Animations & Transitions
- **Page Transition**: Fade in, 200ms ease-out
- **Card Hover**: Scale 1.02, shadow increase, 150ms ease
- **Button Hover**: Background color transition, 150ms
- **Modal**: Fade in + slide up, 200ms ease-out
- **Save Feedback**: Checkmark icon animation, 300ms
- **Input Focus**: Border color + ring, 150ms

---

## 🏗️ Technical Architecture

### Error Handling Strategy

```typescript
// Error Boundary Component
- React Error Boundary for component errors
- Try-catch wrappers for IndexedDB operations
- Data validation on load (Zod schema validation)
- Graceful degradation if IndexedDB unavailable (fallback to localStorage)
- User-friendly error messages
- Error logging for debugging
```

### Performance Optimizations

```typescript
// Store Optimizations
- Use Zustand selectors to prevent unnecessary re-renders
- Memoize calculation results with useMemo
- Memoize chart data transformation
- If history grows > 50 items, add virtualization (react-window)

// Calculation Optimizations
- Pure functions for calculations (easily memoizable)
- Cache calculation results per month/person combination
- Debounce expensive operations
```

### Data Validation & Type Safety

```typescript
// Enhanced Type Definitions
type MonthString = `${number}-${'01'|'02'|'03'|'04'|'05'|'06'|'07'|'08'|'09'|'10'|'11'|'12'}`;

type CategoryAmounts = {
  // ... all categories as numbers
};

type MonthRecord = {
  month: MonthString;
  people: {
    me: CategoryAmounts;
    wife: CategoryAmounts;
  };
  meta: {
    updatedAt: string; // ISOString
    isSaved: boolean; // Required, default false
  };
};

// Zod Schemas for Runtime Validation
import { z } from 'zod';

const CategoryAmountsSchema = z.object({
  venit: z.number().min(0),
  bonuri: z.number().min(0),
  extra: z.number().min(0),
  // ... all categories
});

const MonthRecordSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  people: z.object({
    me: CategoryAmountsSchema,
    wife: CategoryAmountsSchema,
  }),
  meta: z.object({
    updatedAt: z.string().datetime(),
    isSaved: z.boolean(),
  }),
});
```

### Data Migration & Versioning

```typescript
// Storage Schema with Versioning
type StorageSchema = {
  version: number;
  data: MonthRecord[];
};

// Migration Functions
- migrateV1ToV2(oldData: any): StorageSchema
- validateSchema(data: unknown): boolean
- Handle corrupted or old data formats gracefully
```

### Store Structure

```typescript
interface FinanceStore {
  // State
  records: MonthRecord[];
  selectedPerson: 'me' | 'wife' | 'combined';
  selectedMonth: string; // "YYYY-MM"
  isLoading: boolean;
  error: string | null;
  settings: {
    includeInvestmentsInNetCashflow: boolean; // Default: true
  };
  
  // Actions
  loadRecords: () => Promise<void>;
  updateMonth: (month: string, data: Partial<CategoryAmounts>, person: 'me' | 'wife') => void;
  saveMonth: (month: string) => void;
  duplicateMonth: (fromMonth: string, toMonth: string) => void;
  resetMonth: (month: string) => void;
  setSelectedPerson: (person: 'me' | 'wife' | 'combined') => void;
  setSelectedMonth: (month: string) => void;
  updateSettings: (settings: Partial<FinanceStore['settings']>) => void;
  
  // Selectors (computed)
  getCurrentMonthRecord: () => MonthRecord | null;
  getLast12Months: () => MonthRecord[];
  getLast6Months: () => MonthRecord[];
  getCombinedData: (month: string) => CategoryAmounts | null;
}
```

### Debounce Implementation

```typescript
// Exact Implementation
import { useDebouncedCallback } from 'use-debounce';

const DEBOUNCE_DELAY = 1000; // ms (1000ms = 1 second)

// Trigger on input change, save after 1s of inactivity
const debouncedSave = useDebouncedCallback(
  (month: string, data: CategoryAmounts, person: 'me' | 'wife') => {
    // Save to store and IndexedDB
  },
  DEBOUNCE_DELAY
);
```

### Currency Formatting

```typescript
// Comprehensive Currency Utils
export function formatRON(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0,00 RON';
  
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseRON(input: string): number {
  // Handle both formats: "1234.56" and "1.234,56"
  // Strip "RON" text
  // Parse correctly with Romanian locale
  const cleaned = input.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
```

### Date Handling

```typescript
// Use date-fns with Romanian locale
import { format, parse } from 'date-fns';
import { ro } from 'date-fns/locale';

// Month picker: Use shadcn/ui Calendar component (month-only mode)
// Timezone: Always use user's local timezone consistently

export function formatMonthDisplay(monthString: string): string {
  // "2026-01" -> "Ian 2026"
  const date = parse(monthString + '-01', 'yyyy-MM-dd', new Date());
  return format(date, 'LLL yyyy', { locale: ro });
}

export const ROMANIAN_MONTHS = [
  'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
  'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
```

### Accessibility Requirements

- All interactive elements have `aria-labels`
- Keyboard navigation support
- Focus management (focus trap in modals)
- High contrast mode support
- Screen reader announcements for saves
- WCAG AA color contrast compliance
- Semantic HTML structure

---

## 📐 Core Requirements

### User Profiles
- **"Paul"**: Personal finance data
- **"Codru"**: Partner's finance data  
- **"Împreună"**: Combined view (Paul + Codru), READ-ONLY, auto-updates

### Data Model

```typescript
type CategoryAmounts = {
  // Income
  venit: number;
  bonuri: number;
  extra: number;

  // Rates
  rate: number;

  // Bills
  apple: number;
  intretinere: number;
  internet: number;
  gaz: number;
  curent: number;
  telefon: number;
  netflix: number;
  sala: number;

  // Other
  educatie: number;
  sanatate: number;
  beauty: number;
  haine: number;

  // Spending
  diverse: number;
  transport: number;
  cadouri: number;
  vacante: number;
  casa: number;
  gadgets: number;
  tazz: number;
  alimente: number;

  // Investments
  economii_investitii: number;
};

type MonthRecord = {
  month: MonthString; // "YYYY-MM"
  people: {
    me: CategoryAmounts;
    wife: CategoryAmounts;
  };
  meta: {
    updatedAt: string; // ISOString
    isSaved: boolean; // Explicit save flag
  };
};
```

### Calculations (per person and Combined)

- `incomeTotal = venit + bonuri + extra`
- `billsTotal = sum(apple, intretinere, internet, gaz, curent, telefon, netflix, sala)`
- `expensesTotal = rate + billsTotal + sum(educatie, sanatate, beauty, haine, diverse, transport, cadouri, vacante, casa, gadgets, tazz, alimente)`
- `investmentsTotal = economii_investitii` (NOT included in expensesTotal)
- `profitLoss = incomeTotal - expensesTotal` (label: "Profit/Pierdere (înainte de investiții)")
- `netCashflow = incomeTotal - expensesTotal - investmentsTotal` (label: "Cashflow net (după investiții)")

**Settings Toggle**: "Include investments in net cashflow" (default ON)
- If OFF: `netCashflow = incomeTotal - expensesTotal` (same as profitLoss)

---

## 📄 Pages

### 1. Dashboard Page
**Layout matching design reference:**

- **Top Metric Cards Row** (4 cards):
  1. Venit total
  2. Total facturi
  3. Cheltuieli totale (includes rate)
  4. Cashflow net (după investiții) [respects toggle]

- **Balance Section**:
  - Show "Profit/Pierdere (înainte de investiții)" for selected month/person
  - Large amount display

- **Bar Chart**:
  - Last 12 months of `expensesTotal` for selected person
  - Tooltip and grid like reference
  - X-axis: Month abbreviations (Ian, Feb, Mar, etc.)
  - Y-axis: Amount scale

- **History Section**:
  - "History / Transactions of last 6 months" style list
  - Show last 6 months summary rows:
    - Month label (Ian 2026)
    - incomeTotal, expensesTotal, investmentsTotal, netCashflow
    - Status "Saved" or "Draft" based on autosave/saved state

- **Right Panel**:
  - **Dark Credit Card Widget**: 
    - Stylized like reference
    - Show selected person + month + key number (netCashflow or balance)
  - **Recent Activities**: 
    - Top 4 spending categories by amount for selected month/person
    - Exclude income; optionally exclude investments
  - **Upcoming Payments**: 
    - Simple fixed placeholders (e.g., Chirie, Asigurare) with "Pending"
    - Purely UI (no logic needed now)

### 2. Monthly Input Page

- **Month Selector**: Display "Ian 2026", store "YYYY-MM"
- **Action Buttons**:
  - "Save" (marks as saved)
  - "Duplicate previous month" (CRITICAL - copies most recent month's data)
  - "Reset month" (clears current month)
- **Main Input Table**:
  - Rows grouped by sections: Income, Bills, Rates, Other, Spending, Investments
  - Two columns: "Paul" and "Codru"
  - Numeric inputs with RON formatting on blur; allow typing raw numbers
  - Investments section has note: "Investițiile nu intră în cheltuieli totale."
- **Sticky Totals Footer**:
  - Show totals for Paul, Codru, Împreună:
    - incomeTotal, billsTotal, expensesTotal, investmentsTotal, profitLoss, netCashflow
- **Status Display**:
  - "Last saved at HH:MM" (from meta.updatedAt)
  - "Saved" or "Draft" badge

---

## 🔧 Technical Features

### Autosave & Persistence
- Autosave drafts while typing (debounced, 1000ms) into IndexedDB
- Show "Last saved at HH:MM" in Monthly Input header (from meta.updatedAt)
- Explicit Save marks record as "Saved" (flag), but autosave still updates updatedAt

### Duplicate Previous Month
- Copy most recent existing MonthRecord values into currently selected month for both Paul and Codru
- If current month has data, confirm overwrite via dialog

### Validation & UX
- Empty input = 0
- Disallow negative values by default
- Clear error states for invalid input
- Combined view is computed only; no inputs editable in Combined mode anywhere

### Error Handling
- Try-catch for all IndexedDB operations
- User-friendly error messages
- Graceful fallback to localStorage if IndexedDB unavailable
- Data validation on load with Zod schemas

---

## 🚀 Development Phases

### Phase 1: Foundation & Setup
**Goal**: Project structure, core infrastructure, design system, basic UI shell

**Tasks**:
1. Initialize Next.js 14+ project with TypeScript **strict mode**
2. Install dependencies:
   - Core: Next.js, React, TypeScript
   - Styling: Tailwind CSS
   - Components: shadcn/ui (Card, Input, Select, Tabs, Button, Dialog, Tooltip, Calendar)
   - Charts: Recharts
   - State: Zustand
   - Storage: localforage
   - Validation: Zod
   - Dates: date-fns
   - Utils: use-debounce
3. Set up development tools:
   - ESLint + Prettier configuration
   - TypeScript path aliases (`@/components`, `@/lib`)
   - Jest + React Testing Library (optional, can be added incrementally)
4. Configure Tailwind CSS with design tokens:
   - Complete color palette
   - Typography scale
   - Spacing system
   - Shadow utilities
   - Custom breakpoints
5. Create design tokens file (`lib/design-tokens.ts`)
6. Set up shadcn/ui components
7. Create basic layout structure (Sidebar + Header)
8. Set up Zustand store structure with persistence middleware
9. Create TypeScript types and Zod schemas
10. Set up IndexedDB persistence layer (localforage) with error handling
11. Create calculation utilities (pure functions, unit-testable)
12. Set up Romanian date/currency formatters
13. Create error boundary component
14. Implement data migration utilities
15. Add browser compatibility checks

**Deliverables**:
- Project structure
- Complete design system (colors, typography, spacing, shadows)
- Basic layout shell matching design proportions
- Type definitions with Zod validation
- Store structure with loading/error states
- Persistence layer with error handling
- Calculation utilities
- Date/currency formatters

---

### Phase 2: Monthly Input Page
**Goal**: Complete data entry functionality

**Tasks**:
1. Create Monthly Input page component
2. Implement month selector (display "Ian 2026", store "YYYY-MM")
   - Use shadcn/ui Calendar component (month-only mode)
3. Build input table with sections (Income, Bills, Rates, Other, Spending, Investments)
4. Implement two-column layout (Paul, Codru)
5. Create CurrencyInput component with RON formatting
6. Implement autosave (debounced, 1000ms) using use-debounce
7. Add "Save", "Duplicate previous month", "Reset month" buttons
8. Create confirmation dialogs for duplicate and reset actions
9. Create sticky totals footer with calculations
10. Add "Last saved at HH:MM" display
11. Add "Saved" vs "Draft" status badge
12. Implement validation (empty = 0, no negatives)
13. Add error states for invalid input
14. Wire up Zustand store for data persistence
15. Test data persistence and retrieval
16. Add loading states during save operations

**Deliverables**:
- Fully functional Monthly Input page
- Data entry and persistence working
- Calculations displaying correctly
- Validation and error handling
- Autosave functionality

---

### Phase 3: Dashboard Page
**Goal**: Visual dashboard matching design reference

**Tasks**:
1. Create Dashboard page component
2. Implement profile selector ("Paul" | "Codru" | "Împreună") in header
   - Segmented control style (pill-shaped buttons)
3. Build 4 metric cards row (Venit total, Total facturi, Cheltuieli totale, Cashflow net)
   - Match design specs (icon, label, value, hover states)
4. Create Balance section with large amount display
5. Implement bar chart (Recharts) with last 12 months expensesTotal
   - Match chart design specs (colors, grid, tooltips)
6. Add chart tooltips and grid
7. Build History section (last 6 months summary)
   - Status badges (Saved/Draft)
8. Create right sidebar:
   - Dark credit card widget (match design specs)
   - Recent Activities list (top 4 spending categories)
   - Upcoming Payments list (placeholder UI)
9. Wire up all calculations and data display
10. Implement settings modal (toggle for investments in net cashflow)
11. Add loading states (skeletons, spinners)
12. Add empty states for charts and lists
13. Polish UI to match design reference (spacing, shadows, colors, typography)
14. Ensure responsive design (tablet and mobile breakpoints)

**Deliverables**:
- Complete Dashboard page matching design
- All calculations and data display working
- Settings functionality
- Responsive layout
- Loading and empty states

---

### Phase 4: Polish & Refinement
**Goal**: UX improvements, edge cases, final touches, accessibility

**Tasks**:
1. Add comprehensive loading states (skeletons, spinners)
2. Improve error handling (user-friendly messages, recovery)
3. Add confirmation dialogs (duplicate month, reset month)
4. Polish animations and transitions (matching design specs)
5. Ensure full responsive design (test all breakpoints)
6. Test edge cases:
   - Empty data (first use)
   - First month entry
   - No previous month to duplicate
   - Very large numbers
   - Corrupted data recovery
7. Verify all calculations across all scenarios
8. Add accessibility features:
   - ARIA labels for all interactive elements
   - Keyboard navigation
   - Focus management
   - Screen reader announcements
   - WCAG AA compliance
9. Performance optimization:
   - Memoize expensive calculations
   - Optimize re-renders with Zustand selectors
   - Add virtualization if history grows large
10. Final UI polish (spacing, typography, colors, shadows)
11. Code cleanup and documentation
12. Add data export/import functionality (optional)
13. Browser compatibility testing

**Deliverables**:
- Polished, production-ready application
- All edge cases handled
- Accessibility compliant
- Performance optimized
- Clean, maintainable code

---

## 📁 File Structure

```
m-finance-dash/
├── app/
│   ├── layout.tsx                 # Root layout with Sidebar + Header
│   ├── page.tsx                    # Dashboard page
│   ├── monthly-input/
│   │   └── page.tsx                # Monthly Input page
│   └── globals.css                 # Global styles
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Left navigation sidebar
│   │   └── Header.tsx              # Top header with profile selector
│   ├── dashboard/
│   │   ├── MetricCard.tsx          # Metric card component
│   │   ├── BalanceSection.tsx      # Balance display + chart
│   │   ├── HistoryList.tsx         # History transactions list
│   │   ├── CreditCardWidget.tsx    # Right sidebar card widget
│   │   ├── RecentActivities.tsx    # Recent activities list
│   │   └── UpcomingPayments.tsx    # Upcoming payments list
│   ├── monthly-input/
│   │   ├── MonthSelector.tsx       # Month picker
│   │   ├── InputTable.tsx          # Main input table
│   │   ├── TotalsFooter.tsx        # Sticky totals footer
│   │   └── ActionButtons.tsx       # Save, Duplicate, Reset buttons
│   ├── shared/
│   │   ├── PersonSelector.tsx      # Profile selector component
│   │   ├── SettingsModal.tsx       # Settings panel/modal
│   │   ├── CurrencyInput.tsx       # Formatted currency input
│   │   ├── ErrorBoundary.tsx       # Error boundary component
│   │   └── LoadingSpinner.tsx      # Loading spinner component
│   └── ui/                         # shadcn/ui components
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── tooltip.tsx
│       └── calendar.tsx
├── lib/
│   ├── design-tokens.ts            # Design system tokens
│   ├── store/
│   │   └── finance-store.ts         # Zustand store with persistence
│   ├── calculations/
│   │   └── calculations.ts          # Pure calculation functions
│   ├── storage/
│   │   ├── storage.ts               # IndexedDB wrapper (localforage)
│   │   └── migrations.ts            # Data migration utilities
│   ├── validation/
│   │   └── schemas.ts               # Zod schemas for validation
│   ├── utils/
│   │   ├── currency.ts              # RON formatting utilities
│   │   ├── date.ts                  # Date formatting (Romanian months)
│   │   └── errors.ts                # Error handling utilities
│   └── types.ts                     # TypeScript type definitions
├── public/                          # Static assets
├── tests/                           # Test files (optional)
│   ├── unit/
│   └── integration/
├── .eslintrc.json                   # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── package.json
├── tsconfig.json                    # TypeScript config (strict mode)
├── tailwind.config.js               # Tailwind with design tokens
└── next.config.js
```

---

## 🎯 Implementation Checklist

### Phase 1: Foundation & Setup
- [ ] Initialize Next.js project with TypeScript strict mode
- [ ] Install all dependencies (including Zod, date-fns, use-debounce)
- [ ] Set up ESLint + Prettier
- [ ] Configure TypeScript path aliases
- [ ] Configure Tailwind CSS with design tokens
- [ ] Create design tokens file (`lib/design-tokens.ts`)
- [ ] Set up shadcn/ui components
- [ ] Create type definitions with Zod schemas
- [ ] Set up Zustand store structure with persistence
- [ ] Implement IndexedDB persistence layer with error handling
- [ ] Create calculation utilities (pure functions)
- [ ] Set up Romanian date/currency formatters
- [ ] Create error boundary component
- [ ] Implement data migration utilities
- [ ] Add browser compatibility checks
- [ ] Create basic layout structure (Sidebar + Header)
- [ ] Style layout to match design proportions

### Phase 2: Monthly Input Page
- [ ] Create page component
- [ ] Implement month selector (Calendar component)
- [ ] Build input table with sections
- [ ] Add two-column layout (Paul, Codru)
- [ ] Create CurrencyInput component
- [ ] Implement currency input formatting
- [ ] Add autosave functionality (debounced, 1000ms)
- [ ] Create action buttons (Save, Duplicate, Reset)
- [ ] Add confirmation dialogs
- [ ] Build sticky totals footer
- [ ] Add "Last saved at HH:MM" display
- [ ] Add "Saved" vs "Draft" status badge
- [ ] Implement validation (empty = 0, no negatives)
- [ ] Add error states
- [ ] Wire up store and persistence
- [ ] Add loading states

### Phase 3: Dashboard Page
- [ ] Create page component
- [ ] Implement profile selector (segmented control)
- [ ] Build 4 metric cards (match design specs)
- [ ] Create Balance section
- [ ] Implement bar chart (Recharts, match design specs)
- [ ] Add chart tooltips and grid
- [ ] Build History section with status badges
- [ ] Create credit card widget (match design specs)
- [ ] Build Recent Activities list
- [ ] Create Upcoming Payments list
- [ ] Wire up all calculations
- [ ] Implement settings modal
- [ ] Add loading states (skeletons, spinners)
- [ ] Add empty states
- [ ] Polish UI to match design
- [ ] Ensure responsive design

### Phase 4: Polish & Refinement
- [ ] Add comprehensive loading states
- [ ] Improve error handling
- [ ] Add confirmation dialogs
- [ ] Polish animations and transitions
- [ ] Ensure full responsive design
- [ ] Test edge cases (empty data, first month, etc.)
- [ ] Verify all calculations
- [ ] Add accessibility features (ARIA, keyboard nav, focus management)
- [ ] Performance optimization (memoization, selectors)
- [ ] Final UI polish
- [ ] Code cleanup and documentation
- [ ] Browser compatibility testing

---

## 📝 Important Notes

### Currency Format
- Romanian Leu (RON) - use format like "1.234,56 RON" (dot for thousands, comma for decimals)
- Handle edge cases: very large numbers, zero values, negative values (if allowed)
- Use `Intl.NumberFormat` with 'ro-RO' locale

### Date Format
- Display "Ian 2026" in UI, store "2026-01" internally
- Romanian Month Names: Ian, Feb, Mar, Apr, Mai, Iun, Iul, Aug, Sep, Oct, Nov, Dec
- Use date-fns with Romanian locale
- Always use user's local timezone consistently

### Data Behavior
- **Combined View**: Always read-only, computed on-the-fly from Paul + Codru
- **Autosave**: Debounced 1000ms, updates `updatedAt` but doesn't set `isSaved` flag
- **Explicit Save**: Sets `isSaved: true` flag, used to show "Saved" vs "Draft" status
- **Empty Input**: Defaults to 0
- **Negative Values**: Disallowed by default

### Browser Support
- Modern browsers with IndexedDB support
- Graceful fallback to localStorage if IndexedDB unavailable
- Test on: Chrome, Firefox, Safari, Edge (latest versions)

---

## 🚦 Ready to Start?

This comprehensive plan consolidates:
- ✅ All functional requirements
- ✅ Complete design system specifications
- ✅ Technical architecture and best practices
- ✅ Error handling and edge cases
- ✅ Performance optimizations
- ✅ Accessibility requirements
- ✅ Detailed implementation phases

**Next Step**: Begin Phase 1 (Foundation & Setup) to establish the project structure and design system.

---

## 📚 References

- **Design target (aim for this)**: `design/design-target-dashboard.png` + `design/DESIGN_TARGET.md`
- **Technical Review**: See `TECHNICAL_REVIEW.md`
- **Design Review**: See `DESIGN_REVIEW.md`
- **Initial Requirements**: See `initial-prompt.txt`
