# Design Target — Dashboard UI

**This is the design we are aiming for.** All layout, visual style, and UI patterns should align with this reference.

**Reference image**: `design/design-target-dashboard.png`

---

## Overview

A clean, modern **financial dashboard** with:

- **Light grey background**, dark text, white cards
- **Three-column layout**: left nav, main content, right sidebar
- **Rounded corners**, subtle shadows, consistent line-art icons

---

## Layout

### Left navigation sidebar (narrow, dark grey)

- Vertical icon list: Home, Transfer, Wallet, Documents (with notification badge), Statistics, Settings, Reports
- Active item indicated by a vertical accent bar
- Optional window-style dots (red / yellow / green) at top

### Top header bar (spans main + right)

- **Left**: "Dashboard" (large, bold) + subtitle e.g. "Payments updates"
- **Center**: Search bar with magnifying glass, placeholder "Search"
- **Right**: Calendar icon, Notifications (bell with badge), Profile avatar with dropdown, status dot

### Main content (central, wide)

1. **Transfer / quick-action cards** (four in a row)
   - Each: icon, short label (e.g. "Transfer via Card number", "Transfer Other Banks"), default amount, three-dot menu
   - White, rounded cards

2. **Balance section**
   - "Balance" heading, large bold amount (e.g. "$1500")
   - "PAST 30 DAYS" or similar period label
   - **Bar chart**: months on X-axis (Jan–Nov), values on Y-axis (e.g. 10K–100K), tooltips on hover (e.g. "Expense $2500")

3. **History section**
   - "History" heading + subtitle e.g. "Transaction of last 6 months"
   - List of transactions: avatar, description, time, amount, status ("Completed")
   - Row hover/highlight (light grey)

### Right sidebar (narrower)

1. **Credit card**
   - Dark card with gradient, card number, "CARD HOLDER" + name, Mastercard-style logo

2. **Recent activities**
   - "Recent Activities" + date
   - List: icon, description, amount (e.g. "Water Bill Successfully" $120, "Income Salary Received" $4500)

3. **Upcoming payments**
   - "Upcoming Payments" + date
   - List: icon, description, amount, "Pending" (e.g. "Home Rent Pending" $1500)

---

## Aesthetic

- **Colors**: Light grey BG, white cards, dark grey sidebar and text, subtle accent (e.g. notification red, status green)
- **Typography**: Sans-serif, clear hierarchy (large titles, smaller labels)
- **Spacing**: Ample whitespace, uncluttered
- **Interactivity**: Search, nav, badges, hover states, tooltips

---

## How we use this

- **Dashboard page**: Match this layout and structure (metrics/transfer-style cards, balance + chart, history, right sidebar with card + activities + payments).
- **Global layout**: Same three-column structure, left nav, top header. Other pages (e.g. Monthly Input, Settings) live within this shell; their inner layout can differ but should feel consistent.
- **Design tokens**: Align colors, typography, shadows, and radii with this reference.

When in doubt, prefer decisions that bring the app closer to `design-target-dashboard.png`.
