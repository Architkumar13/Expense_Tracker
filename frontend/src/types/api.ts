export type ExpenseSource = "manual" | "receipt" | "mail" | "message";

export interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  category: string;
  merchant: string;
  occurred_at: string;
  source: ExpenseSource | string;
  notes: string;
  receipt_id?: number | null;
  created_at: string;
}

export interface ExpensePage {
  items: Expense[];
  next_cursor: number | null;
  total: number;
}

export interface ExpenseCreate {
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  merchant?: string;
  occurred_at?: string | null;
  source?: string;
  notes?: string;
}

export type ExpenseUpdate = Partial<ExpenseCreate>;

export interface Stats {
  total_spent: number;
  total_income: number;
  balance: number;
  by_category: Record<string, number>;
  by_month: Record<string, number>;
  expense_count: number;
}

export interface Receipt {
  id: number;
  filename: string;
  uploaded_at: string;
  parsed_json: string;
  raw_text: string;
}

export interface MailMessage {
  id: string;
  subject: string;
  sender: string;
  received_at?: string | null;
  snippet: string;
  detected_amount?: number | null;
  detected_merchant?: string | null;
}

export interface IngestResult {
  scanned: number;
  created_expenses: number;
  items: Expense[];
  notes: string;
}

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  currency: string;
  created_at: string;
}

export interface BudgetProgress {
  category: string;
  monthly_limit: number;
  spent: number;
  remaining: number;
  percent: number;
  currency: string;
  over_budget: boolean;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline?: string | null;
  currency: string;
  notes: string;
  created_at: string;
}

export interface Subscription {
  merchant: string;
  amount: number;
  currency: string;
  cadence_days: number;
  last_seen: string;
  next_expected?: string | null;
  count: number;
  category: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  currency: string;
  error?: string | null;
}

export interface AdvisorReply {
  reply: string;
  citations: string[];
}

export interface ChatTurn {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Health {
  status: string;
  ai_enabled: boolean;
  mcp_mail: boolean;
  mcp_messages: boolean;
  imap_configured: boolean;
  default_currency: string;
}

export const CATEGORIES = [
  "groceries",
  "dining",
  "travel",
  "transport",
  "utilities",
  "shopping",
  "healthcare",
  "entertainment",
  "subscription",
  "fees",
  "other",
  "uncategorized",
] as const;
export type Category = (typeof CATEGORIES)[number];
