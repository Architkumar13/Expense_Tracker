# AI Expense Tracker

A full-fledged AI personal-finance app: **FastAPI backend** + **React 18 + Vite + TypeScript + Tailwind + shadcn-style UI** + Claude-powered intelligence. Includes receipt-PDF ingestion, mail/SMS/MCP ingestion, budgets, savings goals, recurring-charge detection, and a financial advisor chat with live ticker data.

## What's inside

### Intelligence
1. **Receipt PDFs → expenses.** Drop a PDF — the backend extracts text with `pdfplumber`, then Claude returns strict JSON (`merchant`, `total`, `currency`, `occurred_at`, `category`, `line_items`) which is saved as an expense.
2. **Inbox ingestion.** Three-tier fallback chain pulls transactional emails / SMS / iMessage / WhatsApp:
   - **MCP HTTP bridge** (set `MCP_MAIL_URL` / `MCP_MESSAGES_URL`)
   - **IMAP** (Gmail-style app password)
   - **Demo data** so the UI works out of the box
   Detected `amount` and `merchant` become a single-click "Ingest as expenses".
3. **Recurring/subscription detection.** Clusters same-merchant, same-amount charges by cadence; surfaces a Subscriptions view with next expected charge.
4. **AI financial advisor.** Chat that ships your spending summary + live `yfinance` quotes (auto-extracted from your message) to Claude as context. Disclaimer-clean, education-only.

### App features
- **Dashboard** — stat cards, donut + monthly area chart, budget snapshot, top subscriptions, recent activity.
- **Expenses** — server-side search, category/source/date filters, cursor pagination, inline edit + delete, CSV export honoring filters.
- **Receipts** — drag-and-drop dropzone, per-file upload status, parsed-receipt history.
- **Inbox** — dual-pane mail + messages with one-click ingest.
- **Budgets** — per-category monthly limits with live progress and over-budget warnings.
- **Subscriptions** — detected recurring charges with cadence, last-seen, next expected date, projected monthly run-rate.
- **Goals** — savings goals with target, deadline, and contribute action.
- **Advisor** — Claude-powered chat + watchlist + suggested prompts.
- **Settings** — theme (light/dark/system), integration health, danger zone.

### UX polish
- **Light/dark/system theme** with CSS-variable tokens; persists in `localStorage`.
- **Command palette (⌘K)** — jump to any page, run actions (new expense, ingest mail, switch theme).
- **Keyboard shortcuts** — `N` opens new-expense dialog, `⌘K` opens palette.
- **Mobile-first** — sidebar collapses to a bottom tab bar with a centred floating "+" action; tables become stacked cards.
- **Skeletons** on every async load, **toasts** (sonner) on every mutation, empty states with CTAs everywhere.
- **shadcn-style components** built on Radix primitives — accessible by default.
- **Recharts** donut + smoothed area chart.

## Stack

- **Backend** — FastAPI 0.115, SQLAlchemy 2.x (SQLite), Pydantic v2, `pdfplumber`, `anthropic`, `yfinance`, `httpx`, `imaplib`.
- **Frontend** — Vite 5 + React 18 + TypeScript, Tailwind 3, Radix UI, TanStack Query 5, Zustand, React Router 6, Recharts, sonner, cmdk, lucide-react, react-hook-form + zod, date-fns.
- **AI** — Claude (default model `claude-opus-4-7`).

## Quickstart

### One-command path (production-style)

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # all keys optional — graceful degradation

# 2. Frontend (build the SPA so FastAPI can serve it)
cd ../frontend
npm install
npm run build

# 3. Run the FastAPI server
cd ../backend
python run.py              # → http://localhost:8000
```

### Dev mode (hot-reload everywhere)

```bash
# terminal 1
cd backend && source .venv/bin/activate
python run.py              # FastAPI on :8000

# terminal 2
cd frontend
npm run dev                # Vite on :5173, proxies /api → :8000
```

Open <http://localhost:5173>.

## Project layout

```
backend/
  app/
    main.py              # FastAPI app + SPA static mount
    config.py            # Pydantic settings (.env)
    database.py          # SQLAlchemy engine/session
    models.py            # Expense, Receipt, Budget, Goal, AdvisorChat
    schemas.py           # Pydantic schemas
    routers/
      expenses.py        # CRUD + filtered list + cursor pagination + stats
      export.py          # GET /api/expenses/export.csv (filter-aware)
      receipts.py        # POST /api/receipts/upload (PDF)
      mail.py            # /api/mail, /api/messages, /ingest
      advisor.py         # chat, history, quotes
      budgets.py         # CRUD + /progress (this-month spend vs. limit)
      goals.py           # CRUD + /contribute
      subscriptions.py   # GET /api/subscriptions (detected)
    services/
      pdf_parser.py
      ai.py
      mail.py
      stocks.py
      recurring.py       # cadence-based subscription detection
  requirements.txt
  run.py
frontend/
  package.json  vite.config.ts  tailwind.config.ts  tsconfig.json
  index.html
  src/
    main.tsx  App.tsx  index.css
    lib/{api,format,queryClient,utils}.ts
    hooks/{useExpenses,useStats,useBudgets,useGoals,useSubscriptions,
           useReceipts,useInbox,useAdvisor,useHealth}.ts
    store/{theme,ui}.ts
    types/api.ts
    components/
      ui/                # shadcn-style: button, card, dialog, sheet, input,
                         # label, select, dropdown-menu, tabs, table, badge,
                         # progress, skeleton, separator, scroll-area, command
      layout/            # AppShell, Sidebar, MobileTabBar, Topbar, ThemeToggle
      common/            # CommandPalette, StatCard, EmptyState, CategoryPill, SourceBadge
      charts/            # CategoryDonut, MonthlyArea
      expenses/          # ExpenseFilters, ExpenseTable, ExpenseFormDialog
    pages/               # Dashboard, Expenses, Receipts, Inbox, Budgets,
                         # Subscriptions, Goals, Advisor, Settings
```

## API surface

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET    | `/api/health`                          | feature flags (AI / MCP / IMAP) |
| GET    | `/api/expenses`                        | filtered list (`q`, `category`, `source`, `start`, `end`, `min_amount`, `max_amount`, `cursor`, `limit`) |
| GET    | `/api/expenses/stats`                  | totals + by-category + by-month |
| GET    | `/api/expenses/export.csv`             | streaming CSV honoring filters |
| GET    | `/api/expenses/{id}`                   | fetch a single expense |
| POST   | `/api/expenses`                        | create |
| PATCH  | `/api/expenses/{id}`                   | edit |
| DELETE | `/api/expenses/{id}`                   | delete |
| POST   | `/api/receipts/upload`                 | upload PDF, parsed via Claude |
| GET    | `/api/receipts`                        | parsed-receipt history |
| GET    | `/api/mail` · `/api/messages`          | inbox (MCP → IMAP → demo) |
| POST   | `/api/mail/ingest` · `/api/messages/ingest` | one-click ingest |
| GET    | `/api/budgets`                         | list budgets |
| POST   | `/api/budgets`                         | upsert by category |
| PATCH  | `/api/budgets/{id}` · DELETE           | edit / remove |
| GET    | `/api/budgets/progress`                | per-category spend vs. limit (this month) |
| GET    | `/api/goals`                           | list |
| POST   | `/api/goals`                           | create |
| PATCH  | `/api/goals/{id}` · DELETE             | edit / remove |
| POST   | `/api/goals/{id}/contribute`           | record progress |
| GET    | `/api/subscriptions`                   | detected recurring charges |
| POST   | `/api/advisor/chat`                    | Claude-backed chat |
| GET    | `/api/advisor/history` · DELETE        | chat transcript |
| GET    | `/api/advisor/quote` · `/quotes`       | live quotes via yfinance |

## Configuration (`backend/.env`)

| Var | Purpose |
| --- | ------- |
| `ANTHROPIC_API_KEY` | Enable Claude refinement + advisor. Without it, heuristics + offline advice template kick in. |
| `ANTHROPIC_MODEL`   | Defaults to `claude-opus-4-7`. |
| `IMAP_HOST/PORT/USER/PASSWORD` | Direct IMAP fallback for mail ingestion. |
| `MCP_MAIL_URL`      | HTTP bridge to a Gmail/Outlook MCP server (`POST /list`). |
| `MCP_MESSAGES_URL`  | HTTP bridge to an SMS/iMessage/WhatsApp MCP server. |

### MCP integration

The backend talks to MCP servers via a thin HTTP bridge: it `POST`s to your URL with `{"kind","limit","query"}` and expects `{"items":[{"id","subject","sender","received_at","snippet"}]}`. Most MCP servers can be exposed this way using a small adapter (e.g. running `mcp-server-gmail` behind a FastAPI shim, or proxying via `mcpo`). When MCP is unavailable, IMAP is used; when neither is configured, demo messages keep the UI populated.

## Verification

```bash
# Backend
curl :8000/api/health
curl ':8000/api/expenses?q=netflix&limit=5'
curl ':8000/api/budgets/progress'
curl ':8000/api/subscriptions'
curl -OJ ':8000/api/expenses/export.csv'

# UI smoke test (after `npm run build` or `npm run dev`)
# 1. Toggle theme (light / dark / system) — persists across reload
# 2. Add expense via the floating "+" / palette / N shortcut
# 3. Filter by category + date range, export filtered CSV
# 4. Upload a PDF → expense appears immediately
# 5. Inbox → "Ingest as expenses" → toast confirms count
# 6. Budgets → set a category limit → progress bar updates
# 7. Goals → create + contribute → progress fills
# 8. Subscriptions surfaces clusters once you have ≥3 same-merchant charges
# 9. Advisor: "Where am I overspending?" or "Compare AAPL vs MSFT"
# 10. ⌘K opens command palette
# 11. Resize to phone — bottom tab bar with centred "+"
```

## Disclaimer

The AI advisor is **education only** — not licensed financial advice. Always confirm before acting on AI suggestions.
