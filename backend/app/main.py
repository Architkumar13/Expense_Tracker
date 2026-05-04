from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import init_db
from .routers import advisor, expenses, mail, receipts


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


app.include_router(expenses.router)
app.include_router(receipts.router)
app.include_router(mail.router)
app.include_router(advisor.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_enabled": bool(settings.anthropic_api_key),
        "mcp_mail": bool(settings.mcp_mail_url),
        "mcp_messages": bool(settings.mcp_messages_url),
        "imap_configured": bool(settings.imap_host and settings.imap_user),
    }


FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
if FRONTEND_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def index():
        return FileResponse(str(FRONTEND_DIR / "index.html"))
