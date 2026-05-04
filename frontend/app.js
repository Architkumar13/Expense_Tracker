const API = "";

const state = {
  expenses: [],
  stats: null,
  mail: [],
  messages: [],
  chat: [],
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const fmt = (n, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c || "USD" }).format(n || 0);
const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {},
    ...opts,
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  if (res.status === 204) return null;
  return res.json();
}

// ---- Tabs ----
const TAB_TITLES = {
  dashboard: ["Dashboard", "A snapshot of where your money is going."],
  expenses: ["Expenses", "Browse, edit, and add transactions."],
  upload: ["Upload Receipt", "Drop a PDF — Claude will read it for you."],
  inbox: ["Mail & Messages", "Pull bank alerts and receipts straight from your inbox."],
  advisor: ["AI Advisor", "Plan budgets and look up tickers & funds."],
};

function showTab(name) {
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  $$(".tab").forEach((t) => t.classList.toggle("visible", t.id === `tab-${name}`));
  const [title, sub] = TAB_TITLES[name] || ["", ""];
  $("#page-title").textContent = title;
  $("#page-sub").textContent = sub;
  if (name === "inbox" && state.mail.length === 0) refreshInbox();
  if (name === "advisor" && state.chat.length === 0) loadHistory();
}

$$(".nav-item").forEach((btn) => btn.addEventListener("click", () => showTab(btn.dataset.tab)));

// ---- Dashboard / expenses ----
function categoryColor(_) { return "linear-gradient(90deg, var(--accent), var(--accent-2))"; }

function renderStats() {
  const s = state.stats || { total_spent: 0, total_income: 0, balance: 0, expense_count: 0, by_category: {}, by_month: {} };
  $("#stat-spent").textContent = fmt(s.total_spent);
  $("#stat-income").textContent = fmt(s.total_income);
  $("#stat-balance").textContent = fmt(s.balance);
  $("#stat-count").textContent = s.expense_count;

  const cats = Object.entries(s.by_category).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;
  $("#cat-bars").innerHTML = cats.length
    ? cats.map(([k, v]) => `
      <div class="bar-row">
        <div>${k}</div>
        <div class="bar"><span style="width:${Math.max(4, (v / max) * 100)}%"></span></div>
        <div class="num" style="text-align:right">${fmt(v)}</div>
      </div>`).join("")
    : '<div class="muted">No spending recorded yet.</div>';

  const months = Object.entries(s.by_month);
  const mmax = months.reduce((a, [, v]) => Math.max(a, v), 1);
  $("#month-chart").innerHTML = months.length
    ? months.map(([m, v]) => `
      <div class="v" title="${m}: ${fmt(v)}">
        <div class="b" style="height:${Math.max(4, (v / mmax) * 140)}px"></div>
        <div class="l">${m.slice(5)}</div>
      </div>`).join("")
    : '<div class="muted">No monthly data yet.</div>';
}

function renderExpenses() {
  const rows = state.expenses;
  const recent = rows.slice(0, 8);
  const tr = (e) => `
    <tr>
      <td>${fmtDate(e.occurred_at)}</td>
      <td>${e.description}</td>
      <td>${e.merchant || ""}</td>
      <td>${e.category}</td>
      <td><span class="tag ${e.source}">${e.source}</span></td>
      <td class="num">${fmt(e.amount, e.currency)}</td>
    </tr>`;
  $("#recent-tbody").innerHTML = recent.length ? recent.map(tr).join("") : `<tr><td colspan="6" class="muted">No expenses yet.</td></tr>`;
  $("#expenses-tbody").innerHTML = rows.length
    ? rows.map((e) => `
      <tr>
        <td>${fmtDate(e.occurred_at)}</td>
        <td>${e.description}</td>
        <td>${e.merchant || ""}</td>
        <td>${e.category}</td>
        <td><span class="tag ${e.source}">${e.source}</span></td>
        <td class="num">${fmt(e.amount, e.currency)}</td>
        <td><button class="btn danger" data-del="${e.id}">Delete</button></td>
      </tr>`).join("")
    : `<tr><td colspan="7" class="muted">No expenses yet — add one or upload a receipt.</td></tr>`;

  $$("[data-del]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Delete this expense?")) return;
    await api(`/api/expenses/${b.dataset.del}`, { method: "DELETE" });
    await refreshAll();
  }));
}

async function refreshAll() {
  state.expenses = await api("/api/expenses");
  state.stats = await api("/api/expenses/stats");
  renderStats();
  renderExpenses();
}

// ---- Add expense modal ----
const dlg = $("#expense-dialog");
$("#add-expense-btn").addEventListener("click", () => dlg.showModal());
$("#expense-form").addEventListener("close", () => {});
$("#expense-form").addEventListener("submit", (e) => {
  e.preventDefault();
});
dlg.addEventListener("close", async () => {
  if (dlg.returnValue !== "confirm") return;
  const fd = new FormData($("#expense-form"));
  const payload = Object.fromEntries(fd.entries());
  payload.amount = parseFloat(payload.amount);
  if (payload.occurred_at) payload.occurred_at = new Date(payload.occurred_at).toISOString();
  if (!payload.occurred_at) delete payload.occurred_at;
  await api("/api/expenses", { method: "POST", body: JSON.stringify(payload) });
  $("#expense-form").reset();
  await refreshAll();
});

// ---- Upload ----
const dz = $("#dropzone");
const fi = $("#file-input");
dz.addEventListener("click", () => fi.click());
["dragover", "dragenter"].forEach((ev) =>
  dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); })
);
["dragleave", "drop"].forEach((ev) =>
  dz.addEventListener(ev, () => dz.classList.remove("over"))
);
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
});
fi.addEventListener("change", () => fi.files && handleFiles(fi.files));

async function handleFiles(files) {
  const log = $("#upload-log");
  for (const file of Array.from(files)) {
    const row = document.createElement("div");
    row.className = "upload-row";
    row.textContent = `Uploading ${file.name}…`;
    log.prepend(row);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const created = await api("/api/receipts/upload", { method: "POST", body: fd });
      row.classList.add("ok");
      row.innerHTML = `<span>${file.name}</span><span><strong>${created.merchant || "Receipt"}</strong> · ${fmt(created.amount, created.currency)} · ${created.category}</span>`;
    } catch (err) {
      row.classList.add("err");
      row.textContent = `${file.name} — ${err.message}`;
    }
  }
  await refreshAll();
}

// ---- Inbox ----
function renderInbox(targetId, items) {
  const el = $("#" + targetId);
  if (!items.length) { el.innerHTML = '<div class="muted">No messages found.</div>'; return; }
  el.innerHTML = items.map((m) => `
    <div class="msg">
      <div class="msg-head">
        <div>
          <div class="msg-subject">${m.subject || "(no subject)"}</div>
          <div class="msg-meta">${m.sender || ""} · ${m.received_at ? fmtDate(m.received_at) : ""}</div>
        </div>
        ${m.detected_amount ? `<div class="msg-amount">${fmt(m.detected_amount)}</div>` : ""}
      </div>
      <div class="msg-snippet">${(m.snippet || "").slice(0, 220)}</div>
    </div>
  `).join("");
}

async function refreshInbox() {
  state.mail = await api("/api/mail");
  state.messages = await api("/api/messages");
  renderInbox("mail-list", state.mail);
  renderInbox("messages-list", state.messages);
}

document.addEventListener("click", async (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "refresh-mail") { state.mail = await api("/api/mail"); renderInbox("mail-list", state.mail); }
  if (action === "refresh-messages") { state.messages = await api("/api/messages"); renderInbox("messages-list", state.messages); }
  if (action === "ingest-mail") {
    const r = await api("/api/mail/ingest", { method: "POST" });
    alert(`Scanned ${r.scanned}, created ${r.created_expenses} expense(s).`);
    await refreshAll();
  }
  if (action === "ingest-messages") {
    const r = await api("/api/messages/ingest", { method: "POST" });
    alert(`Scanned ${r.scanned}, created ${r.created_expenses} expense(s).`);
    await refreshAll();
  }
});

// ---- Advisor ----
function renderChat() {
  const log = $("#chat-log");
  if (!state.chat.length) {
    log.innerHTML = '<div class="muted small">Ask anything: "Where am I overspending?", "Should I look at VTSAX?", or "Compare AAPL vs MSFT".</div>';
    return;
  }
  log.innerHTML = state.chat.map((m) => `<div class="bubble ${m.role}">${escapeHtml(m.content)}</div>`).join("");
  log.scrollTop = log.scrollHeight;
}
function escapeHtml(s) { return s.replace(/[&<>]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

async function loadHistory() {
  state.chat = await api("/api/advisor/history");
  renderChat();
}

$("#chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#chat-text");
  const text = input.value.trim();
  if (!text) return;
  state.chat.push({ role: "user", content: text });
  renderChat();
  input.value = "";
  input.disabled = true;
  try {
    const r = await api("/api/advisor/chat", { method: "POST", body: JSON.stringify({ message: text }) });
    state.chat.push({ role: "assistant", content: r.reply });
  } catch (err) {
    state.chat.push({ role: "assistant", content: `Error: ${err.message}` });
  }
  renderChat();
  input.disabled = false;
  input.focus();
});

$("#clear-chat").addEventListener("click", async () => {
  if (!confirm("Clear chat history?")) return;
  await api("/api/advisor/history", { method: "DELETE" });
  state.chat = [];
  renderChat();
});

// ---- Watchlist ----
$("#watch-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const sym = $("#watch-input").value.trim();
  if (!sym) return;
  const list = $("#watch-list");
  list.innerHTML = '<div class="muted small">Loading quotes…</div>';
  try {
    const quotes = await api(`/api/advisor/quotes?symbols=${encodeURIComponent(sym)}`);
    list.innerHTML = quotes.map((q) => {
      if (q.error) return `<div class="watch-row"><div class="sym">${q.symbol}</div><div class="muted small">${q.error}</div></div>`;
      const dir = q.change_pct >= 0 ? "up" : "down";
      const sign = q.change_pct >= 0 ? "▲" : "▼";
      return `<div class="watch-row">
        <div><div class="sym">${q.symbol}</div><div class="muted small">${q.name || ""}</div></div>
        <div>
          <div>${fmt(q.price, q.currency)}</div>
          <div class="delta ${dir} small">${sign} ${q.change_pct.toFixed(2)}%</div>
        </div>
      </div>`;
    }).join("");
  } catch (err) {
    list.innerHTML = `<div class="muted small">${err.message}</div>`;
  }
});

// ---- Health pill ----
async function pingHealth() {
  try {
    const h = await api("/api/health");
    const flags = [
      h.ai_enabled ? "AI ✓" : "AI offline",
      h.mcp_mail ? "MCP-mail" : null,
      h.mcp_messages ? "MCP-msg" : null,
      h.imap_configured ? "IMAP" : null,
    ].filter(Boolean);
    $("#status-pill").textContent = flags.join(" · ");
  } catch {
    $("#status-pill").textContent = "API unreachable";
  }
}

$("#refresh").addEventListener("click", async () => {
  await Promise.all([refreshAll(), refreshInbox(), pingHealth()]);
});

(async function init() {
  await pingHealth();
  await refreshAll();
})();
