from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import init_db
from .routers import advisor, budgets, expenses, export, goals, mail, receipts, subscriptions


settings = get_settings()
app = FastAPI(title=settings.app_name, version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


app.include_router(export.router)
app.include_router(expenses.router)
app.include_router(receipts.router)
app.include_router(mail.router)
app.include_router(advisor.router)
app.include_router(budgets.router)
app.include_router(goals.router)
app.include_router(subscriptions.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_enabled": bool(settings.anthropic_api_key),
        "mcp_mail": bool(settings.mcp_mail_url),
        "mcp_messages": bool(settings.mcp_messages_url),
        "imap_configured": bool(settings.imap_host and settings.imap_user),
        "default_currency": settings.default_currency,
    }


# ---- Static SPA serving --------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent.parent
DIST_DIR = ROOT / "frontend" / "dist"
LEGACY_DIR = ROOT / "frontend"


def _spa_directory() -> Path | None:
    if (DIST_DIR / "index.html").is_file():
        return DIST_DIR
    if (LEGACY_DIR / "index.html").is_file():
        return LEGACY_DIR
    return None


_SPA = _spa_directory()
if _SPA is not None:
    if (_SPA / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=str(_SPA / "assets")), name="assets")
    app.mount("/static", StaticFiles(directory=str(_SPA)), name="static")

    INDEX_HTML = _SPA / "index.html"

    @app.get("/")
    def index():
        return FileResponse(str(INDEX_HTML))

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = _SPA / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(INDEX_HTML))
