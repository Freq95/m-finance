# Finance Dashboard

Local-only finance dashboard web application built with Next.js 14+, React, TypeScript, and Tailwind CSS.

## Technology Stack

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

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Project Structure

```
m-finance-dash/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout with Sidebar + Header
│   ├── page.tsx            # Dashboard page
│   ├── monthly-input/      # Monthly Input page
│   └── settings/           # Settings page
├── components/
│   ├── layout/             # Layout components (Sidebar, Header)
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Shared components (ErrorBoundary, etc.)
├── lib/
│   ├── design-tokens.ts    # Design system tokens
│   ├── store/              # Zustand store
│   ├── storage/            # IndexedDB persistence layer
│   ├── calculations/       # Pure calculation functions
│   ├── validation/         # Zod schemas
│   └── utils/              # Utility functions
└── public/                 # Static assets
```

## Development Phases

### Phase 1: Foundation & Setup ✅
- Project structure
- Design system
- Type definitions and validation
- Store structure with persistence
- Basic layout shell

### Phase 2: Monthly Input Page ✅
- Data entry functionality
- Autosave
- Validation

### Phase 3: Dashboard Page ✅
- Visual dashboard with segmented profile selector (Eu | Soția | Împreună)
- 4 metric cards, Balance section, bar chart (Recharts) with grid and tooltips
- History section with status badges (Completed/Draft)
- Right sidebar: credit card widget, Recent Activities (top 4 spending categories), Upcoming Payments (placeholder)
- Settings modal (investments in net cashflow toggle) from dashboard header
- Dashboard skeleton loading; RON formatting; responsive layout

### Phase 4: Polish & Refinement
- UX improvements
- Accessibility
- Performance optimization

## Features

- **Local-only**: All data stored in browser IndexedDB
- **No backend**: Fully client-side application
- **No authentication**: Single-user local storage
- **Romanian locale**: RON currency formatting, Romanian month names
- **Autosave**: Debounced autosave while typing
- **Responsive**: Mobile, tablet, and desktop layouts

## License

Private project
