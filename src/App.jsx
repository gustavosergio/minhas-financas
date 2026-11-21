import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  ChartNoAxesCombined,
  SlidersHorizontal,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Target,
  Download,
  Upload,
  X,
  Trash2,
  Pencil,
  Check,
  Menu,
  Landmark,
  Bitcoin,
  Ellipsis,
  CheckCircle2,
  Info,
  Leaf,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  expenseCategories,
  incomeCategories,
  assetTypes,
  palette,
  money,
  number,
  today,
  emptyData,
  totals,
  monthTransactions,
  balanceThrough,
  groupExpenses,
  assetValue,
  validateData,
  demoData,
} from "./model";
const STORAGE = "minhas-financas:v1";
function load() {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw
      ? { data: validateData(JSON.parse(raw)) }
      : { data: emptyData() };
  } catch {
    return { data: emptyData(), error: true };
  }
}
const initial = load();
const navs = [
  ["dashboard", "Visão geral", LayoutDashboard],
  ["transactions", "Transações", ArrowLeftRight],
  ["budget", "Orçamento", Target],
  ["investments", "Investimentos", ChartNoAxesCombined],
  ["reports", "Relatórios", ChartNoAxesCombined],
];
const formatDate = (d) =>
  new Date(d + "T12:00:00")
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
const monthLabel = (m) =>
  new Date(m + "-02T12:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
const unitAsset = (t) =>
  ["Criptomoeda", "Ação", "Fundo imobiliário", "ETF"].includes(t);
export default function App() {
  const [data, setData] = useState(initial.data),
    [page, setPage] = useState("dashboard"),
    [month, setMonth] = useState(today().slice(0, 7)),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [category, setCategory] = useState("all"),
    [menu, setMenu] = useState(false),
    [storageError, setStorageError] = useState(
      initial.error
        ? "Não foi possível ler os dados salvos. Importe um backup para recuperá-los."
        : "",
    ),
    [isDemo, setIsDemo] = useState(Boolean(initial.data.demo));
  const fileRef = useRef();
  const dialogRef = useRef();
  useEffect(() => {
    if (initial.error && data === initial.data) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
      setStorageError("");
    } catch {
      setStorageError(
        "Não foi possível salvar no navegador. Exporte um backup antes de fechar.",
      );
    }
  }, [data]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const els = [
          ...dialogRef.current.querySelectorAll(
            "button,input,select,textarea,[href]",
          ),
        ].filter((el) => !el.disabled);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.querySelector("input,button")?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [modal]);
  const transactions = useMemo(
    () => monthTransactions(data, month),
    [data, month],
  );
  const sum = totals(transactions),
    balance = balanceThrough(data, month),
    groups = groupExpenses(transactions),
    invested = data.investments.reduce((a, i) => a + assetValue(i), 0),
    cost = data.investments.reduce((a, i) => a + i.invested, 0),
    planned = data.budgets[month] || {},
    budgetTotal = Object.values(planned).reduce((a, b) => a + b, 0);
  const moveMonth = (n) => {
    let d = new Date(month + "-02T12:00:00");
    d.setMonth(d.getMonth() + n);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const notify = (msg) => setToast(msg);
  const navigate = (p) => {
    setPage(p);
    setMenu(false);
    setQuery("");
    setType("all");
    setCategory("all");
  };
  const saveTransaction = (t) => {
    setData((d) => ({
      ...d,
      transactions: t.id
        ? d.transactions.map((x) => (x.id === t.id ? t : x))
        : [...d.transactions, { ...t, id: crypto.randomUUID() }],
    }));
    setModal(null);
    notify("Transação salva com sucesso.");
  };
  const saveAsset = (a) => {
    setData((d) => ({
      ...d,
      investments: a.id
        ? d.investments.map((x) => (x.id === a.id ? a : x))
        : [...d.investments, { ...a, id: crypto.randomUUID() }],
    }));
    setModal(null);
    notify("Investimento salvo com sucesso.");
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minhas-financas-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Backup exportado.");
  };
  const importData = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5e6) throw Error("O limite do backup é 5 MB.");
      const parsed = validateData(JSON.parse(await file.text()));
      setModal({ kind: "import", data: parsed });
    } catch (error) {
      notify(
        error instanceof SyntaxError
          ? "O arquivo não é um JSON válido."
          : error.message,
      );
    }
  };
  const filtered = transactions
    .filter(
      (t) =>
        (type === "all" || t.type === type) &&
        (category === "all" || t.category === category) &&
        `${t.description} ${t.category} ${t.amount}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const history = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(month + "-02T12:00:00");
    date.setMonth(date.getMonth() - 5 + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const s = totals(monthTransactions(data, key));
    return {
      name: date
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", ""),
      Receitas: s.income,
      Despesas: s.expense,
      Saldo: s.income - s.expense,
    };
  });
  const hasData = data.transactions.length || data.investments.length;
  return (
    <div className="app">
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-mark">
            <ChartNoAxesCombined size={24} />
          </span>
          <span>
            Minhas<span className="brand-light">Finanças</span>
          </span>
        </a>
        <div className="nav-label">SEU ESPAÇO FINANCEIRO</div>
        <nav>
          {navs.map(([key, label, Icon]) => (
            <button
              key={key}
              className={page === key ? "nav-item active" : "nav-item"}
              onClick={() => navigate(key)}
            >
              <Icon size={20} />
              {label}
              {page === key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Leaf size={20} />
          </span>
          <strong>
            Pequenos passos.
            <br />
            Grandes conquistas.
          </strong>
          <p>Cuidar do seu dinheiro é cuidar do seu futuro.</p>
        </div>
        <div className="sidebar-bottom">
          <button
            className={page === "settings" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("settings")}
          >
            <SlidersHorizontal size={19} />
            Configurações e dados
          </button>
          <div className="profile">
            <span className="avatar">GF</span>
            <div>
              <strong>Meu espaço pessoal</strong>
              <small>Dados neste navegador</small>
            </div>
            <span className="local-dot" />
          </div>
        </div>
      </aside>
      {menu && <div className="mobile-shade" onClick={() => setMenu(false)} />}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Abrir menu"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={22} />
            </button>
            <span>Meu espaço</span>
            <span className="slash">/</span>
            <strong>
              {navs.find((n) => n[0] === page)?.[1] || "Configurações"}
            </strong>
          </div>
          <div className="top-right">
            <span className="local-badge">
              <span /> Armazenamento local
            </span>
            <span className="avatar small">GF</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">MAIS CLAREZA, MELHORES ESCOLHAS</div>
              <h1>
                {
                  {
                    dashboard: "Seu dinheiro, em perspectiva.",
                    transactions: "Cada movimento conta.",
                    budget: "Dê um destino ao seu dinheiro.",
                    investments: "Seu futuro em construção.",
                    reports: "Entenda seus hábitos.",
                    settings: "Seu espaço, do seu jeito.",
                  }[page]
                }
              </h1>
              <p>
                {
                  {
                    dashboard:
                      "Acompanhe suas finanças e faça planos com tranquilidade.",
                    transactions:
                      "Organize suas receitas e despesas em um só lugar.",
                    budget:
                      "Planeje por categoria e acompanhe o que já foi utilizado.",
                    investments:
                      "Reúna seus ativos e acompanhe a evolução da sua carteira.",
                    reports:
                      "Transforme seus lançamentos em uma visão mais clara.",
                    settings:
                      "Gerencie seu saldo inicial, backups e dados financeiros.",
                  }[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              {page !== "settings" && (
                <div className="month-picker">
                  <button
                    aria-label="Mês anterior"
                    onClick={() => moveMonth(-1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <label>
                    <span>{monthLabel(month)}</span>
                    <input
                      aria-label="Selecionar mês"
                      type="month"
                      value={month}
                      onChange={(e) =>
                        e.target.value && setMonth(e.target.value)
                      }
                    />
                  </label>
                  <button aria-label="Próximo mês" onClick={() => moveMonth(1)}>
                    <ChevronRight size={17} />
                  </button>
                </div>
              )}
              <button
                className="button primary"
                onClick={() =>
                  setModal({
                    kind: page === "investments" ? "asset" : "transaction",
                  })
                }
              >
                <Plus size={18} />
                {page === "investments"
                  ? "Novo investimento"
                  : "Nova transação"}
              </button>
            </div>
          </div>
          {storageError && (
            <div className="alert error" role="alert">
              {storageError}
            </div>
          )}
          {isDemo && (
            <div className="alert">
              <Info size={18} />
              Você está vendo dados de demonstração.
              <button onClick={() => setModal({ kind: "reset" })}>
                Limpar demonstração
              </button>
            </div>
          )}
          {!hasData && page === "dashboard" && (
            <div className="welcome-banner">
              <div>
                <strong>Uma nova fase para suas finanças.</strong>
                <p>
                  Comece com seu primeiro lançamento ou explore o painel com
                  dados fictícios.
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  setData(demoData(month));
                  setIsDemo(true);
                  notify("Demonstração carregada. Os valores são fictícios.");
                }}
              >
                Explorar demonstração
              </button>
            </div>
          )}
          {["dashboard", "reports"].includes(page) && (
            <>
              <section className="stats-grid">
                <Stat
                  title="Saldo disponível"
                  value={money(balance)}
                  subtitle="Saldo inicial + movimentações até o mês"
                  icon={Wallet}
                  tone="green"
                  featured
                />
                <Stat
                  title="Receitas do mês"
                  value={money(sum.income)}
                  subtitle={`${transactions.filter((t) => t.type === "income").length} entradas registradas`}
                  icon={ArrowDownLeft}
                  tone="mint"
                />
                <Stat
                  title="Despesas do mês"
                  value={money(sum.expense)}
                  subtitle={`${transactions.filter((t) => t.type === "expense").length} saídas registradas`}
                  icon={ArrowUpRight}
                  tone="orange"
                />
                <Stat
                  title="Total investido"
                  value={money(invested)}
                  subtitle="Valor atual da sua carteira · separado do saldo"
                  icon={ChartNoAxesCombined}
                  tone="purple"
                />
              </section>
              <div className="charts-grid">
                <section className="panel evolution">
                  <PanelTitle
                    title={
                      page === "reports"
                        ? "Receitas e despesas"
                        : "Seu fluxo financeiro"
                    }
                    sub="Uma visão dos últimos 6 meses"
                    aside={<span className="chip">Semestre</span>}
                  />
                  <div className="chart-legend">
                    <span>
                      <i style={{ background: palette[0] }} />
                      Receitas
                    </span>
                    <span>
                      <i style={{ background: "#dfb171" }} />
                      Despesas
                    </span>
                  </div>
                  <div className="area-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      {page === "reports" ? (
                        <BarChart data={history}>
                          <CartesianGrid
                            strokeDasharray="3 5"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) =>
                              v >= 1000 ? `${v / 1000} mil` : v
                            }
                            width={50}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip formatter={(v) => money(v)} />
                          <Bar
                            dataKey="Receitas"
                            fill={palette[0]}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="Despesas"
                            fill="#dfb171"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      ) : (
                        <AreaChart
                          data={history}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="income"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#38886d"
                                stopOpacity={0.22}
                              />
                              <stop
                                offset="100%"
                                stopColor="#38886d"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="expense"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#d6ab6a"
                                stopOpacity={0.16}
                              />
                              <stop
                                offset="100%"
                                stopColor="#d6ab6a"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 5"
                            vertical={false}
                            stroke="#e9eeeb"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tickMargin={14}
                          />
                          <YAxis
                            tickFormatter={(v) =>
                              v >= 1000 ? `${v / 1000} mil` : v
                            }
                            width={52}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(v) => money(v)}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #e4eae6",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="Receitas"
                            stroke="#22765b"
                            strokeWidth={2.5}
                            fill="url(#income)"
                          />
                          <Area
                            type="monotone"
                            dataKey="Despesas"
                            stroke="#d3a15d"
                            strokeWidth={2.5}
                            fill="url(#expense)"
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="panel categories">
                  <PanelTitle
                    title="Para onde vai seu dinheiro"
                    sub="Despesas por categoria"
                  />
                  <Donut
                    groups={groups}
                    total={sum.expense}
                    label="em despesas"
                  />
                </section>
              </div>
            </>
          )}
          {page === "dashboard" && (
            <div className="lower-grid">
              <section className="panel">
                <PanelTitle
                  title="Últimas transações"
                  sub="Os movimentos mais recentes do mês"
                  aside={
                    <button
                      className="text-button"
                      onClick={() => navigate("transactions")}
                    >
                      Ver todas
                    </button>
                  }
                />
                <TransactionList
                  items={filtered.slice(0, 5)}
                  onEdit={(t) => setModal({ kind: "transaction", item: t })}
                  compact
                />
                {!filtered.length && (
                  <Empty
                    icon={ArrowLeftRight}
                    title="Tudo começa com um lançamento"
                    text="Registre uma receita ou despesa para acompanhar seu mês."
                    action={() => setModal({ kind: "transaction" })}
                    actionText="Adicionar transação"
                  />
                )}
              </section>
              <section className="panel budget-summary">
                <PanelTitle
                  title="Seu orçamento"
                  sub="Planejamento do mês"
                  aside={
                    <button
                      className="text-button"
                      onClick={() => navigate("budget")}
                    >
                      Gerenciar
                    </button>
                  }
                />
                {budgetTotal > 0 ? (
                  <>
                    <div className="budget-total">
                      <strong>{money(sum.expense)}</strong>
                      <span>de {money(budgetTotal)} planejados</span>
                    </div>
                    <Progress value={(sum.expense / budgetTotal) * 100} />
                    <div className="budget-caption">
                      <span>
                        {Math.round((sum.expense / budgetTotal) * 100)}%
                        utilizado
                      </span>
                      <span>
                        {money(Math.max(0, budgetTotal - sum.expense))}{" "}
                        disponível
                      </span>
                    </div>
                    <div className="mini-budgets">
                      {Object.entries(planned)
                        .filter(([, v]) => v > 0)
                        .slice(0, 3)
                        .map(([c, v]) => (
                          <div key={c}>
                            <div>
                              <span>{c}</span>
                              <small>
                                {money(
                                  groups.find((g) => g.name === c)?.value || 0,
                                )}{" "}
                                / {money(v)}
                              </small>
                            </div>
                            <Progress
                              value={
                                ((groups.find((g) => g.name === c)?.value ||
                                  0) /
                                  v) *
                                100
                              }
                            />
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <Empty
                    icon={Target}
                    title="Planeje seu próximo passo"
                    text="Defina limites por categoria e acompanhe seus gastos."
                    action={() => navigate("budget")}
                    actionText="Criar orçamento"
                  />
                )}
                <div className="soft-note">
                  <Leaf size={18} />
                  <span>
                    Um pouco de planejamento hoje faz diferença amanhã.
                  </span>
                </div>
              </section>
            </div>
          )}
          {page === "transactions" && (
            <section className="panel">
              <div className="transaction-toolbar">
                <div>
                  <h2>Suas transações</h2>
                  <p className="muted">
                    {filtered.length} lançamentos · {monthLabel(month)}
                  </p>
                </div>
                <div className="filters">
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Buscar transações"
                      placeholder="Buscar descrição ou categoria"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filtrar tipo"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="expense">Despesas</option>
                    <option value="income">Receitas</option>
                  </select>
                  <select
                    aria-label="Filtrar categoria"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">Todas as categorias</option>
                    {[
                      ...new Set([
                        ...expenseCategories,
                        ...incomeCategories,
                        ...transactions.map((t) => t.category),
                      ]),
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <TransactionList
                items={filtered}
                onEdit={(t) => setModal({ kind: "transaction", item: t })}
                onDelete={(t) =>
                  setModal({ kind: "deleteTransaction", item: t })
                }
              />
              {!filtered.length && (
                <Empty
                  icon={Search}
                  title="Nenhuma transação por aqui"
                  text="Adicione um lançamento ou ajuste os filtros para encontrar o que procura."
                />
              )}
              <div className="table-footer">
                <span>
                  Receitas:{" "}
                  <b className="positive">{money(totals(filtered).income)}</b>
                </span>
                <span>
                  Despesas: <b>{money(totals(filtered).expense)}</b>
                </span>
                <span>
                  Resultado:{" "}
                  <b>
                    {money(totals(filtered).income - totals(filtered).expense)}
                  </b>
                </span>
              </div>
            </section>
          )}
          {page === "budget" && (
            <>
              <section className="stats-grid three">
                <Stat
                  title="Orçamento planejado"
                  value={money(budgetTotal)}
                  subtitle="Soma dos limites por categoria"
                  icon={Target}
                  tone="mint"
                />
                <Stat
                  title="Despesas realizadas"
                  value={money(sum.expense)}
                  subtitle="Todos os gastos do mês selecionado"
                  icon={ArrowUpRight}
                  tone="orange"
                />
                <Stat
                  title={
                    sum.expense > budgetTotal
                      ? "Acima do orçamento"
                      : "Disponível no orçamento"
                  }
                  value={money(Math.abs(budgetTotal - sum.expense))}
                  subtitle="Planejado menos realizado"
                  icon={Wallet}
                  tone="purple"
                />
              </section>
              <section className="panel">
                <PanelTitle
                  title="Planejado × realizado"
                  sub="Defina um limite mensal para cada categoria. Os valores são salvos ao sair do campo."
                />
                <div className="budget-table">
                  <div className="budget-row budget-head">
                    <span>Categoria</span>
                    <span>Planejado</span>
                    <span>Realizado</span>
                    <span>Disponível</span>
                    <span>Utilização</span>
                  </div>
                  {[
                    ...new Set([
                      ...expenseCategories,
                      ...groups.map((g) => g.name),
                      ...Object.keys(planned),
                    ]),
                  ].map((c, i) => {
                    const spent = groups.find((g) => g.name === c)?.value || 0;
                    const limit = planned[c] || 0;
                    return (
                      <div className="budget-row" key={month + c}>
                        <span>
                          <i
                            className="category-dot"
                            style={{ background: palette[i % palette.length] }}
                          />
                          {c}
                        </span>
                        <label className="money-input">
                          <span>R$</span>
                          <input
                            aria-label={`Orçamento de ${c}`}
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={limit || ""}
                            placeholder="0,00"
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (!Number.isFinite(val) || val < 0) {
                                e.target.value = limit;
                                return;
                              }
                              setData((d) => ({
                                ...d,
                                budgets: {
                                  ...d.budgets,
                                  [month]: { ...d.budgets[month], [c]: val },
                                },
                              }));
                            }}
                          />
                        </label>
                        <strong>{money(spent)}</strong>
                        <span
                          className={spent > limit ? "negative" : "positive"}
                        >
                          {money(limit - spent)}
                        </span>
                        <div>
                          <Progress
                            value={
                              limit ? (spent / limit) * 100 : spent ? 100 : 0
                            }
                            over={spent > limit}
                          />
                          <small className="muted">
                            {limit
                              ? Math.round((spent / limit) * 100) + "%"
                              : spent
                                ? "Sem limite definido"
                                : "Sem gastos"}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
          {page === "investments" && (
            <>
              <div className="alert">
                <Info size={18} />
                <span>
                  Valores informados por você, em reais. Atualize os preços
                  manualmente. Registrar um ativo não movimenta seu saldo;
                  registre o aporte em Transações quando necessário.
                </span>
              </div>
              <section className="stats-grid three">
                <Stat
                  title="Patrimônio investido"
                  value={money(invested)}
                  subtitle={`${data.investments.length} ativos na carteira`}
                  icon={Landmark}
                  tone="mint"
                />
                <Stat
                  title="Capital aplicado"
                  value={money(cost)}
                  subtitle="Total informado nos seus ativos"
                  icon={Wallet}
                  tone="purple"
                />
                <Stat
                  title="Resultado da carteira"
                  value={money(invested - cost)}
                  subtitle={`${cost ? (((invested - cost) / cost) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "0"}% sobre o capital aplicado · valor bruto`}
                  icon={invested >= cost ? TrendingUp : TrendingDown}
                  tone="orange"
                />
              </section>
              <div className="investment-layout">
                <section className="panel">
                  <PanelTitle
                    title="Meus investimentos"
                    sub="Renda fixa, renda variável e ativos digitais"
                  />
                  {!data.investments.length ? (
                    <Empty
                      icon={Landmark}
                      title="Sua carteira começa aqui"
                      text="Adicione um CDB, uma criptomoeda ou outro investimento."
                      action={() => setModal({ kind: "asset" })}
                      actionText="Adicionar investimento"
                    />
                  ) : (
                    <div className="asset-list">
                      {data.investments.map((a) => (
                        <div className="asset-card" key={a.id}>
                          <span
                            className={
                              "transaction-icon " +
                              (a.type === "Criptomoeda" ? "orange" : "mint")
                            }
                          >
                            {a.type === "Criptomoeda" ? (
                              <Bitcoin size={23} />
                            ) : (
                              <Landmark size={22} />
                            )}
                          </span>
                          <div className="asset-main">
                            <strong>{a.name}</strong>
                            <small>
                              {a.type} ·{" "}
                              {a.institution || "Instituição não informada"}
                            </small>
                            <small>
                              {unitAsset(a.type)
                                ? `${number(a.quantity)} unidades · ${money(a.price)} / un.`
                                : a.rate || "Rentabilidade não informada"}
                              {a.maturity
                                ? ` · Vence em ${new Date(a.maturity + "T12:00:00").toLocaleDateString("pt-BR")}`
                                : ""}
                            </small>
                            {a.note && <small>{a.note}</small>}
                          </div>
                          <div className="asset-value">
                            <strong>{money(assetValue(a))}</strong>
                            <small
                              className={
                                assetValue(a) >= a.invested
                                  ? "positive"
                                  : "negative"
                              }
                            >
                              {money(assetValue(a) - a.invested)} (
                              {a.invested
                                ? (
                                    ((assetValue(a) - a.invested) /
                                      a.invested) *
                                    100
                                  ).toFixed(2)
                                : "0"}
                              %)
                            </small>
                          </div>
                          <button
                            className="icon-button"
                            aria-label={`Editar ${a.name}`}
                            onClick={() => setModal({ kind: "asset", item: a })}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label={`Excluir ${a.name}`}
                            onClick={() =>
                              setModal({ kind: "deleteAsset", item: a })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <section className="panel">
                  <PanelTitle
                    title="Composição da carteira"
                    sub="Distribuição por classe de ativo"
                  />
                  <Donut
                    groups={Object.entries(
                      data.investments.reduce((a, i) => {
                        a[i.type] = (a[i.type] || 0) + assetValue(i);
                        return a;
                      }, {}),
                    )
                      .map(([name, value]) => ({ name, value }))
                      .filter((g) => g.value > 0)}
                    total={invested}
                    label="na carteira"
                  />
                </section>
              </div>
            </>
          )}
          {page === "reports" && (
            <div className="lower-grid">
              <section className="panel">
                <PanelTitle
                  title="Economia mensal"
                  sub="Receitas menos despesas nos últimos seis meses"
                />
                <div className="report-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history}>
                      <CartesianGrid vertical={false} strokeDasharray="3 5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis
                        width={60}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${v / 1000} mil` : v
                        }
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(v) => money(v)} />
                      <Bar dataKey="Saldo" radius={[5, 5, 0, 0]}>
                        {history.map((h, i) => (
                          <Cell
                            key={i}
                            fill={h.Saldo >= 0 ? palette[0] : "#c47770"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="panel">
                <PanelTitle title="Resumo do mês" sub={monthLabel(month)} />
                <dl className="summary-list">
                  <div>
                    <dt>Receitas</dt>
                    <dd className="positive">{money(sum.income)}</dd>
                  </div>
                  <div>
                    <dt>Despesas</dt>
                    <dd>{money(sum.expense)}</dd>
                  </div>
                  <div>
                    <dt>Economia do mês</dt>
                    <dd
                      className={
                        sum.income - sum.expense >= 0 ? "positive" : "negative"
                      }
                    >
                      {money(sum.income - sum.expense)}
                    </dd>
                  </div>
                  <div>
                    <dt>Taxa de economia</dt>
                    <dd>
                      {sum.income
                        ? (
                            ((sum.income - sum.expense) / sum.income) *
                            100
                          ).toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          }) + "%"
                        : "Sem receitas"}
                    </dd>
                  </div>
                  <div>
                    <dt>Maior categoria de gasto</dt>
                    <dd>{groups[0]?.name || "Sem despesas"}</dd>
                  </div>
                </dl>
                <div className="soft-note">
                  <Info size={18} />
                  <span>
                    A carteira de investimentos é acompanhada separadamente do
                    fluxo de caixa.
                  </span>
                </div>
              </section>
            </div>
          )}
          {page === "settings" && (
            <div className="settings-grid">
              <section className="panel">
                <PanelTitle
                  title="Saldo inicial"
                  sub="Seu saldo antes do primeiro lançamento registrado"
                />
                <form
                  className="settings-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = Number(new FormData(e.target).get("balance"));
                    if (Number.isFinite(v)) {
                      setData((d) => ({ ...d, openingBalance: v }));
                      notify("Saldo inicial atualizado.");
                    }
                  }}
                >
                  <label>
                    Valor em reais
                    <input
                      key={data.openingBalance}
                      name="balance"
                      type="number"
                      step="0.01"
                      defaultValue={data.openingBalance}
                      required
                    />
                  </label>
                  <p className="muted">
                    O saldo disponível acumula as receitas e despesas de todos
                    os meses até o mês selecionado, a partir deste valor.
                  </p>
                  <button className="button primary" type="submit">
                    Salvar saldo
                  </button>
                </form>
              </section>
              <section className="panel">
                <PanelTitle
                  title="Seus dados, com você"
                  sub="Faça backups regularmente para preservar seus registros"
                />
                <div className="settings-content">
                  <p>
                    Os dados ficam apenas neste navegador e neste dispositivo.
                    Limpar os dados do navegador pode apagar seus registros. Não
                    há conta, sincronização ou conexão com o Google Sheets nesta
                    versão.
                  </p>
                  <div className="button-row">
                    <button className="button secondary" onClick={exportData}>
                      <Download size={17} />
                      Exportar backup
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => fileRef.current.click()}
                    >
                      <Upload size={17} />
                      Importar backup
                    </button>
                  </div>
                  <p className="muted">
                    Formato JSON · a importação substitui todos os dados atuais.
                  </p>
                </div>
              </section>
              <section className="panel">
                <PanelTitle
                  title="Recomeçar"
                  sub="Apague os registros deste navegador"
                />
                <div className="settings-content">
                  <p>Exporte um backup antes de excluir seus dados.</p>
                  <button
                    className="button danger-button"
                    onClick={() => setModal({ kind: "reset" })}
                  >
                    <Trash2 size={17} />
                    Apagar todos os dados
                  </button>
                </div>
              </section>
            </div>
          )}
          <footer>
            <span>
              <Leaf size={14} />
              Um olhar mais tranquilo para o seu dinheiro.
            </span>
            <span>Minhas Finanças · Feito para o seu dia a dia</span>
          </footer>
        </main>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={importData}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            ref={dialogRef}
          >
            <button
              className="modal-close icon-button"
              aria-label="Fechar"
              onClick={() => setModal(null)}
            >
              <X size={21} />
            </button>
            {modal.kind === "transaction" ? (
              <TransactionForm
                item={modal.item}
                categoryOptions={data.transactions.map((t) => t.category)}
                month={month}
                onSave={saveTransaction}
                onCancel={() => setModal(null)}
              />
            ) : modal.kind === "asset" ? (
              <AssetForm
                item={modal.item}
                onSave={saveAsset}
                onCancel={() => setModal(null)}
              />
            ) : (
              <>
                <div className="modal-heading">
                  <span className="modal-icon">
                    <Info size={24} />
                  </span>
                  <h2 id="modal-title">
                    {modal.kind === "import"
                      ? "Restaurar backup?"
                      : modal.kind === "reset"
                        ? "Apagar todos os dados?"
                        : "Excluir este registro?"}
                  </h2>
                  <p>
                    {modal.kind === "import"
                      ? `O backup contém ${modal.data.transactions.length} transações e ${modal.data.investments.length} investimentos. Ele substituirá todos os dados atuais.`
                      : modal.kind === "reset"
                        ? "Transações, orçamento, saldo inicial e investimentos serão apagados. Esta ação não pode ser desfeita."
                        : `“${modal.item.description || modal.item.name || "Sem descrição"}” será excluído permanentemente.`}
                  </p>
                </div>
                <div className="form-actions">
                  <button
                    className="button secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="button danger-button"
                    onClick={() => {
                      if (modal.kind === "import") {
                        setData(modal.data);
                        setIsDemo(Boolean(modal.data.demo));
                      } else if (modal.kind === "reset") {
                        setData(emptyData());
                        setIsDemo(false);
                      } else {
                        const key =
                          modal.kind === "deleteAsset"
                            ? "investments"
                            : "transactions";
                        setData((d) => ({
                          ...d,
                          [key]: d[key].filter((t) => t.id !== modal.item.id),
                        }));
                      }
                      setModal(null);
                      notify(
                        modal.kind === "import"
                          ? "Backup importado."
                          : "Dados excluídos.",
                      );
                    }}
                  >
                    {modal.kind === "import"
                      ? "Substituir dados"
                      : "Confirmar exclusão"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Stat({ title, value, subtitle, icon: Icon, tone, featured }) {
  return (
    <article className={"stat-card " + (featured ? "featured" : "")}>
      <div className="stat-top">
        <span>{title}</span>
        <span className={"stat-icon " + tone}>
          <Icon size={19} />
        </span>
      </div>
      <strong className="stat-value">{value}</strong>
      <small>{subtitle}</small>
    </article>
  );
}
function PanelTitle({ title, sub, aside }) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {aside}
    </div>
  );
}
function Progress({ value, over }) {
  return (
    <div className={"progress " + (over || value > 100 ? "over" : "")}>
      <div style={{ width: Math.max(0, Math.min(100, value || 0)) + "%" }} />
    </div>
  );
}
function Empty({ icon: Icon, title, text, action, actionText }) {
  return (
    <div className="empty">
      <span>
        <Icon size={26} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action && (
        <button className="button secondary" onClick={action}>
          {actionText}
        </button>
      )}
    </div>
  );
}
function Donut({ groups, total, label }) {
  return (
    <>
      {total > 0 ? (
        <>
          <div className="donut-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={groups}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={89}
                  paddingAngle={3}
                  stroke="none"
                >
                  {groups.map((g, i) => (
                    <Cell key={g.name} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label">
              <strong>{money(total)}</strong>
              <small>{label}</small>
            </div>
          </div>
          <div className="category-legend">
            {groups.map((g, i) => (
              <div key={g.name}>
                <span>
                  <i style={{ background: palette[i % palette.length] }} />
                  {g.name}
                </span>
                <strong>
                  {((g.value / total) * 100).toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Empty
          icon={ChartNoAxesCombined}
          title="Um retrato dos seus dados"
          text="O gráfico aparece assim que houver valores registrados."
        />
      )}
    </>
  );
}
function TransactionList({ items, onEdit, onDelete, compact }) {
  return (
    <div className="table-scroll">
      <table
        className={compact ? "transaction-table compact" : "transaction-table"}
      >
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Data</th>
            <th className="align-right">Valor</th>
            {!compact && (
              <th>
                <span className="sr-only">Ações</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <button className="transaction-name" onClick={() => onEdit(t)}>
                  <span
                    className={
                      "transaction-icon " +
                      (t.type === "income" ? "mint" : "sand")
                    }
                  >
                    {t.type === "income" ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </span>
                  <span>
                    <strong>{t.description || "Sem descrição"}</strong>
                    <small>{t.type === "income" ? "Receita" : "Despesa"}</small>
                  </span>
                </button>
              </td>
              <td>
                <span className="category-tag">{t.category}</span>
              </td>
              <td className="date-cell">{formatDate(t.date)}</td>
              <td
                className={
                  "transaction-amount " +
                  (t.type === "income" ? "positive" : "")
                }
              >
                {t.type === "income" ? "+" : "−"} {money(t.amount)}
              </td>
              {!compact && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${t.description}`}
                      onClick={() => onEdit(t)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Excluir ${t.description}`}
                      onClick={() => onDelete(t)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function TransactionForm({ item, categoryOptions, month, onSave, onCancel }) {
  const [type, setType] = useState(item?.type || "expense");
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const amount = Number(f.get("amount"));
        if (!Number.isFinite(amount) || amount <= 0)
          return setError("Informe um valor maior que zero.");
        const t = {
          id: item?.id,
          type,
          amount,
          date: f.get("date"),
          description: f.get("description").trim(),
          category:
            f.get("category") === "__custom"
              ? f.get("newCategory").trim()
              : f.get("category"),
        };
        try {
          validateData({
            ...emptyData(),
            transactions: [{ ...t, id: t.id || "new" }],
          });
          onSave(t);
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      <div className="modal-heading">
        <span className="modal-icon">
          <ArrowLeftRight size={24} />
        </span>
        <h2 id="modal-title">{item ? "Editar transação" : "Nova transação"}</h2>
        <p>Os detalhes de hoje trazem mais clareza amanhã.</p>
      </div>
      <div className="type-toggle">
        <button
          type="button"
          className={type === "expense" ? "selected expense" : ""}
          onClick={() => {
            setType("expense");
            setCustom(false);
          }}
        >
          <ArrowUpRight size={17} />
          Despesa
        </button>
        <button
          type="button"
          className={type === "income" ? "selected income" : ""}
          onClick={() => {
            setType("income");
            setCustom(false);
          }}
        >
          <ArrowDownLeft size={17} />
          Receita
        </button>
      </div>
      <div className="form-grid">
        <label className="full">
          Valor (R$)
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0,00"
            required
            defaultValue={item?.amount}
          />
        </label>
        <label className="full">
          Descrição
          <input
            name="description"
            maxLength={160}
            placeholder="Ex.: compras no mercado"
            defaultValue={item?.description}
            required
          />
        </label>
        <label>
          Categoria
          <select
            aria-label="Categoria"
            key={type}
            name="category"
            onChange={(e) => setCustom(e.target.value === "__custom")}
            defaultValue={item?.type === type ? item?.category : undefined}
          >
            {[
              ...new Set([
                ...(type === "expense" ? expenseCategories : incomeCategories),
                ...categoryOptions,
                ...(item?.type === type ? [item.category] : []),
              ]),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
            <option value="__custom">+ Nova categoria</option>
          </select>
        </label>
        <label>
          Data
          <input
            name="date"
            type="date"
            defaultValue={
              item?.date ||
              (today().startsWith(month) ? today() : month + "-01")
            }
            required
          />
        </label>
        {custom && (
          <label className="full">
            Nome da nova categoria
            <input
              name="newCategory"
              required
              maxLength={60}
              placeholder="Ex.: Animais de estimação"
            />
          </label>
        )}
      </div>
      {error && (
        <p className="negative" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button primary" type="submit">
          <Check size={17} />
          Salvar transação
        </button>
      </div>
    </form>
  );
}
function AssetForm({ item, onSave, onCancel }) {
  const [type, setType] = useState(item?.type || "CDB"),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const a = {
          id: item?.id,
          name: f.get("name").trim(),
          type,
          institution: f.get("institution").trim(),
          invested: Number(f.get("invested")),
          quantity: Number(f.get("quantity") || 0),
          price: Number(f.get("price") || 0),
          currentValue: Number(f.get("currentValue") || 0),
          rate: f.get("rate") || "",
          maturity: f.get("maturity") || "",
          note: f.get("note").trim(),
        };
        try {
          validateData({
            ...emptyData(),
            investments: [{ ...a, id: a.id || "new" }],
          });
          onSave(a);
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      <div className="modal-heading">
        <span className="modal-icon">
          <Landmark size={24} />
        </span>
        <h2 id="modal-title">
          {item ? "Editar investimento" : "Novo investimento"}
        </h2>
        <p>Todos os valores devem ser informados em reais.</p>
      </div>
      <div className="form-grid">
        <label>
          Classe do ativo
          <select
            aria-label="Classe do ativo"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {assetTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Nome do ativo
          <input
            name="name"
            required
            maxLength={100}
            placeholder="Ex.: CDB liquidez diária"
            defaultValue={item?.name}
          />
        </label>
        <label className="full">
          Banco, corretora ou carteira
          <input
            name="institution"
            maxLength={100}
            placeholder="Onde o investimento está guardado"
            defaultValue={item?.institution}
          />
        </label>
        <label>
          Capital aplicado (R$)
          <input
            name="invested"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={item?.invested}
          />
        </label>
        {unitAsset(type) ? (
          <>
            <label>
              Quantidade
              <input
                name="quantity"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={item?.quantity}
              />
            </label>
            <label className="full">
              Preço atual por unidade (R$)
              <input
                name="price"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={item?.price}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Valor atual bruto (R$)
              <input
                name="currentValue"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={item?.currentValue}
              />
            </label>
            <label>
              Rentabilidade contratada
              <input
                name="rate"
                maxLength={80}
                placeholder="Ex.: 100% do CDI"
                defaultValue={item?.rate}
              />
            </label>
            <label>
              Vencimento (opcional)
              <input
                name="maturity"
                type="date"
                defaultValue={item?.maturity}
              />
            </label>
          </>
        )}
        <label className="full">
          Observações (opcional)
          <textarea
            name="note"
            maxLength={500}
            placeholder="Detalhes que você quer lembrar"
            defaultValue={item?.note}
          />
        </label>
      </div>
      <p className="form-hint">
        Atualização manual. Não calcula impostos, taxas ou rendimentos futuros.
      </p>
      {error && (
        <p className="negative" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button primary" type="submit">
          <Check size={17} />
          Salvar investimento
        </button>
      </div>
    </form>
  );
}

