# AI Expense Tracker

A full-stack AI-powered expense tracker built on **Python + FastAPI** with a
modern single-page UI. It pairs a clean ledger with three AI superpowers:

1. **Receipt PDFs → expenses.** Drop a PDF; the server extracts text with
   `pdfplumber`, then asks Claude to return strict JSON (merchant, total,
   currency, date, category) before saving an expense.
2. **Mail & messages ingestion.** Pulls transactional emails (Gmail/IMAP or
   any MCP server you point at) and SMS/iMessage/WhatsApp via MCP bridges,
   detects amounts/merchants, and turns them into expenses.
3. **AI financial advisor.** A chat that has your spending summary in context
   plus live equity/mutual-fund quotes via `yfinance`. Symbols mentioned in a
   message (e.g. `AAPL`, `VTSAX`) are auto-quoted and forwarded to Claude.

The app degrades gracefully — without an `ANTHROPIC_API_KEY` it runs offline,
without IMAP/MCP it shows demo inbox data — so you can explore the UI
immediately and wire credentials in later.

## Stack

- **Backend:** FastAPI, SQLAlchemy 2.x, SQLite, `pdfplumber`, `anthropic`,
  `yfinance`, IMAP, MCP HTTP bridge.
- **Frontend:** Vanilla HTML/CSS/JS SPA served from FastAPI (no build step).
- **AI:** Claude (default model `claude-opus-4-7`).

## Quickstart

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in what you have (all optional)
python run.py
```

Then open <http://localhost:8000>.

## Project layout

```
backend/
  app/
    main.py              # FastAPI app + static frontend mount
    config.py            # Pydantic settings (.env)
    database.py          # SQLAlchemy engine/session/init
    models.py            # Expense, Receipt, AdvisorChat
    schemas.py           # Pydantic request/response schemas
    routers/
      expenses.py        # CRUD + /stats
      receipts.py        # POST /api/receipts/upload (PDF)
      mail.py            # /api/mail, /api/messages, /ingest
      advisor.py         # /chat, /history, /quote(s)
    services/
      pdf_parser.py      # PDF -> text -> heuristic ParsedReceipt
      ai.py              # Claude refine_receipt + advise (offline fallback)
      mail.py            # MCP bridge -> IMAP -> demo data fallback chain
      stocks.py          # yfinance quotes
  requirements.txt
  run.py
frontend/
  index.html  styles.css  app.js
```

## API surface

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET    | `/api/health`              | feature flags (AI / MCP / IMAP) |
| GET    | `/api/expenses`            | list expenses |
| POST   | `/api/expenses`            | create expense |
| PATCH  | `/api/expenses/{id}`       | edit expense |
| DELETE | `/api/expenses/{id}`       | delete |
| GET    | `/api/expenses/stats`      | totals / by category / by month |
| POST   | `/api/receipts/upload`     | upload PDF, parsed via Claude |
| GET    | `/api/receipts`            | list parsed receipts |
| GET    | `/api/mail`                | list mail (MCP → IMAP → demo) |
| GET    | `/api/messages`            | list messages (MCP → demo) |
| POST   | `/api/mail/ingest`         | scan mail and create expenses |
| POST   | `/api/messages/ingest`     | scan messages and create expenses |
| POST   | `/api/advisor/chat`        | chat with the AI advisor |
| GET    | `/api/advisor/history`     | conversation history |
| DELETE | `/api/advisor/history`     | clear history |
| GET    | `/api/advisor/quote`       | single ticker quote |
| GET    | `/api/advisor/quotes`      | comma-separated quotes |

## Configuration (`backend/.env`)

| Var | Purpose |
| --- | ------- |
| `ANTHROPIC_API_KEY` | Enable Claude refinement + advisor. Without it the app uses heuristics + an offline advice template. |
| `ANTHROPIC_MODEL`   | Defaults to `claude-opus-4-7`. |
| `IMAP_HOST/PORT/USER/PASSWORD` | Direct IMAP fallback for mail ingestion. |
| `MCP_MAIL_URL`      | HTTP bridge to a Gmail/Outlook MCP server (`POST /list`). |
| `MCP_MESSAGES_URL`  | HTTP bridge to an SMS/iMessage/WhatsApp MCP server. |

### MCP integration

This app speaks to MCP servers via a thin HTTP bridge: it `POST`s to the
configured URL with `{"kind","limit","query"}` and expects
`{"items":[{"id","subject","sender","received_at","snippet"}]}`. Most MCP
servers can be exposed this way using a small adapter (e.g. running
`mcp-server-gmail` behind a FastAPI shim, or proxying via `mcpo`). When MCP is
unavailable, IMAP is used; when neither is configured, demo messages keep the
UI populated.

## Disclaimer

The AI advisor is for **education only** — not licensed financial advice.
Always confirm before acting on AI suggestions.
