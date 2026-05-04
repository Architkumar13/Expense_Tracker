import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import DashboardPage from "@/pages/Dashboard";
import ExpensesPage from "@/pages/Expenses";
import ReceiptsPage from "@/pages/Receipts";
import InboxPage from "@/pages/Inbox";
import BudgetsPage from "@/pages/Budgets";
import SubscriptionsPage from "@/pages/Subscriptions";
import GoalsPage from "@/pages/Goals";
import AdvisorPage from "@/pages/Advisor";
import SettingsPage from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/advisor" element={<AdvisorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
