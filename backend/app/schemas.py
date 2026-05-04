from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ExpenseBase(BaseModel):
    description: str
    amount: float
    currency: str = "USD"
    category: str = "uncategorized"
    merchant: str = ""
    occurred_at: Optional[datetime] = None
    source: str = "manual"
    notes: str = ""


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    occurred_at: Optional[datetime] = None
    notes: Optional[str] = None


class ExpenseOut(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    receipt_id: Optional[int] = None
    created_at: datetime


class ReceiptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    uploaded_at: datetime
    parsed_json: str
    raw_text: str


class ParsedReceipt(BaseModel):
    merchant: str = ""
    total: float = 0.0
    currency: str = "USD"
    occurred_at: Optional[datetime] = None
    category: str = "uncategorized"
    line_items: list[dict] = Field(default_factory=list)
    confidence: float = 0.0


class StatsOut(BaseModel):
    total_spent: float
    total_income: float
    balance: float
    by_category: dict[str, float]
    by_month: dict[str, float]
    expense_count: int


class AdvisorRequest(BaseModel):
    message: str
    use_portfolio_context: bool = True


class AdvisorResponse(BaseModel):
    reply: str
    citations: list[str] = Field(default_factory=list)


class StockQuote(BaseModel):
    symbol: str
    name: str = ""
    price: float = 0.0
    change_pct: float = 0.0
    currency: str = "USD"
    error: Optional[str] = None


class MailMessage(BaseModel):
    id: str
    subject: str
    sender: str
    received_at: Optional[datetime] = None
    snippet: str = ""
    detected_amount: Optional[float] = None
    detected_merchant: Optional[str] = None


class IngestResult(BaseModel):
    scanned: int
    created_expenses: int
    items: list[ExpenseOut] = Field(default_factory=list)
    notes: str = ""


class ChatTurn(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: str
    content: str
    created_at: datetime
