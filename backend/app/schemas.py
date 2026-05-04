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


class ExpensePage(BaseModel):
    items: list[ExpenseOut]
    next_cursor: Optional[int] = None
    total: int = 0


class BudgetIn(BaseModel):
    category: str
    monthly_limit: float
    currency: str = "USD"


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None
    currency: Optional[str] = None


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: str
    monthly_limit: float
    currency: str
    created_at: datetime


class BudgetProgress(BaseModel):
    category: str
    monthly_limit: float
    spent: float
    remaining: float
    percent: float
    currency: str = "USD"
    over_budget: bool = False


class GoalIn(BaseModel):
    name: str
    target_amount: float
    saved_amount: float = 0.0
    deadline: Optional[datetime] = None
    currency: str = "USD"
    notes: str = ""


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    saved_amount: Optional[float] = None
    deadline: Optional[datetime] = None
    notes: Optional[str] = None


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    target_amount: float
    saved_amount: float
    deadline: Optional[datetime] = None
    currency: str
    notes: str
    created_at: datetime


class GoalContribution(BaseModel):
    amount: float


class Subscription(BaseModel):
    merchant: str
    amount: float
    currency: str = "USD"
    cadence_days: int
    last_seen: datetime
    next_expected: Optional[datetime] = None
    count: int
    category: str = "subscription"
