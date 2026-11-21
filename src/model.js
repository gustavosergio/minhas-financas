export const expenseCategories = [
  "Alimentação",
  "Moradia",
  "Transportes",
  "Saúde",
  "Educação",
  "Lazer",
  "Vestuário",
  "Presentes",
  "Jogos",
  "Serviços",
  "Cartão de crédito",
  "Apostas",
  "Investimentos",
  "Outros",
];
export const incomeCategories = [
  "Salário",
  "Mesada",
  "Bônus",
  "Presentes",
  "Reembolso",
  "Investimentos",
  "Outros",
];
export const assetTypes = [
  "CDB",
  "Tesouro Direto",
  "LCI / LCA",
  "Criptomoeda",
  "Ação",
  "Fundo imobiliário",
  "Fundo de investimento",
  "ETF",
  "Outro",
];
export const palette = [
  "#19745b",
  "#81b5a0",
  "#e5b66d",
  "#8f91c5",
  "#79a9c6",
  "#cf8a8a",
  "#aec17c",
  "#718b9a",
];
export const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );
export const number = (value) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 }).format(
    value || 0,
  );
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const emptyData = () => ({
  version: 1,
  transactions: [],
  investments: [],
  budgets: {},
  openingBalance: 0,
});
export function totals(transactions) {
  return transactions.reduce(
    (a, t) => {
      a[t.type] += t.amount;
      return a;
    },
    { income: 0, expense: 0 },
  );
}
export function monthTransactions(data, month) {
  return data.transactions.filter((t) => t.date.startsWith(month));
}
export function balanceThrough(data, month) {
  const sum = totals(
    data.transactions.filter((t) => t.date.slice(0, 7) <= month),
  );
  return data.openingBalance + sum.income - sum.expense;
}
export function groupExpenses(transactions) {
  const groups = Object.create(null);
  transactions
    .filter((t) => t.type === "expense")
    .forEach(
      (t) => (groups[t.category] = (groups[t.category] || 0) + t.amount),
    );
  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
export function assetValue(asset) {
  return asset.type === "Criptomoeda" ||
    ["Ação", "Fundo imobiliário", "ETF"].includes(asset.type)
    ? asset.quantity * asset.price
    : asset.currentValue;
}
export function validateData(data) {
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.investments) ||
    !data.budgets ||
    typeof data.budgets !== "object" ||
    Array.isArray(data.budgets) ||
    !Number.isFinite(data.openingBalance)
  )
    throw Error("Arquivo de backup inválido.");
  const validDate = (d) =>
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(Date.parse(d)) &&
    new Date(d + "T12:00:00Z").toISOString().slice(0, 10) === d;
  const positive = (n) => Number.isFinite(n) && n > 0;
  const nonnegative = (n) => Number.isFinite(n) && n >= 0;
  const ids = new Set();
  for (const t of data.transactions) {
    if (
      !t ||
      typeof t.id !== "string" ||
      ids.has(t.id) ||
      !["income", "expense"].includes(t.type) ||
      !positive(t.amount) ||
      !validDate(t.date) ||
      typeof t.description !== "string" ||
      typeof t.category !== "string" ||
      !t.category.trim()
    )
      throw Error("Transação inválida no backup.");
    ids.add(t.id);
  }
  ids.clear();
  for (const a of data.investments) {
    if (
      !a ||
      typeof a.id !== "string" ||
      ids.has(a.id) ||
      !assetTypes.includes(a.type) ||
      typeof a.name !== "string" ||
      !a.name.trim() ||
      !nonnegative(a.invested) ||
      !nonnegative(a.quantity) ||
      !nonnegative(a.price) ||
      !nonnegative(a.currentValue) ||
      !Number.isFinite(assetValue(a))
    )
      throw Error("Investimento inválido no backup.");
    ids.add(a.id);
  }
  for (const [m, values] of Object.entries(data.budgets)) {
    if (
      !/^\d{4}-\d{2}$/.test(m) ||
      !values ||
      typeof values !== "object" ||
      Array.isArray(values) ||
      Object.values(values).some((v) => !nonnegative(v))
    )
      throw Error("Orçamento inválido no backup.");
  }
  return data;
}
export function demoData(month) {
  const data = emptyData();
  const at = (d) => `${month}-${String(d).padStart(2, "0")}`;
  data.demo = true;
  data.openingBalance = 1250;
  const entries = [
    ["income", 5200, "Salário", "Salário mensal", 5],
    ["income", 650, "Outros", "Projeto freelance", 10],
    ["income", 180, "Reembolso", "Reembolso de despesas", 12],
    ["expense", 1350, "Moradia", "Aluguel do apartamento", 5],
    ["expense", 286.9, "Alimentação", "Compras no mercado", 7],
    ["expense", 79.9, "Serviços", "Internet e assinaturas", 8],
    ["expense", 48, "Transportes", "Transporte por aplicativo", 9],
    ["expense", 89.9, "Lazer", "Cinema e jantar", 12],
    ["expense", 210, "Saúde", "Consulta e farmácia", 13],
    ["expense", 164.5, "Alimentação", "Compras da semana", 15],
    ["expense", 120, "Transportes", "Combustível", 16],
    ["expense", 95, "Educação", "Curso online", 18],
    ["expense", 112, "Alimentação", "Almoço de domingo", 19],
  ];
  data.transactions = entries.map(
    ([type, amount, category, description, date]) => ({
      id: crypto.randomUUID(),
      type,
      amount,
      category,
      description,
      date: at(date),
    }),
  );
  data.budgets[month] = {
    Alimentação: 800,
    Moradia: 1400,
    Transportes: 250,
    Lazer: 200,
    Saúde: 250,
    Educação: 150,
    Serviços: 150,
  };
  data.investments = [
    {
      id: crypto.randomUUID(),
      name: "Reserva de emergência",
      type: "CDB",
      institution: "Banco de exemplo",
      invested: 8000,
      currentValue: 8320,
      quantity: 0,
      price: 0,
      rate: "100% do CDI",
      maturity: "",
      note: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Bitcoin",
      type: "Criptomoeda",
      institution: "Carteira de exemplo",
      invested: 2200,
      quantity: 0.005,
      price: 480000,
      currentValue: 0,
      rate: "",
      maturity: "",
      note: "",
    },
  ];
  return data;
}
