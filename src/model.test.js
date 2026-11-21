import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyData,
  totals,
  balanceThrough,
  monthTransactions,
  groupExpenses,
  assetValue,
  validateData,
  demoData,
} from "./model.js";
const entries = [
  {
    id: "1",
    date: "2026-10-10",
    type: "income",
    amount: 1000,
    category: "Salário",
    description: "Salário",
  },
  {
    id: "2",
    date: "2026-11-01",
    type: "expense",
    amount: 100,
    category: "Alimentação",
    description: "Mercado",
  },
  {
    id: "3",
    date: "2026-11-02",
    type: "expense",
    amount: 50,
    category: "Alimentação",
    description: "Padaria",
  },
  {
    id: "4",
    date: "2026-12-01",
    type: "income",
    amount: 500,
    category: "Bônus",
    description: "Extra",
  },
];
test("saldo acumula meses anteriores e ignora meses posteriores", () => {
  const d = { ...emptyData(), openingBalance: 200, transactions: entries };
  assert.equal(balanceThrough(d, "2026-11"), 1050);
  assert.equal(monthTransactions(d, "2026-11").length, 2);
  assert.deepEqual(totals(monthTransactions(d, "2026-11")), {
    income: 0,
    expense: 150,
  });
});
test("gráfico agrega despesas por categoria sem contar receitas", () =>
  assert.deepEqual(groupExpenses(entries), [
    { name: "Alimentação", value: 150 },
  ]));
test("carteira distingue renda fixa de ativos com cotação", () => {
  assert.equal(assetValue({ type: "CDB", currentValue: 1100 }), 1100);
  assert.equal(
    assetValue({ type: "Criptomoeda", quantity: 0.005, price: 480000 }),
    2400,
  );
  assert.equal(assetValue({ type: "Ação", quantity: 10, price: 25 }), 250);
});
test("backup preserva todos os dados e rejeita valores e datas inválidas", () => {
  const d = demoData("2026-11");
  assert.deepEqual(validateData(JSON.parse(JSON.stringify(d))), d);
  assert.throws(() =>
    validateData({ ...d, transactions: [{ ...entries[0], amount: -100 }] }),
  );
  assert.throws(() =>
    validateData({
      ...d,
      transactions: [{ ...entries[0], date: "2026-02-30" }],
    }),
  );
  assert.throws(() =>
    validateData({ ...d, transactions: [entries[0], entries[0]] }),
  );
  assert.throws(() =>
    validateData({ ...d, budgets: { "2026-11": { Moradia: -100 } } }),
  );
  assert.throws(() =>
    validateData({
      ...d,
      investments: [{ ...d.investments[1], quantity: Infinity }],
    }),
  );
});
test("meses vazios e carteira vazia produzem totais zerados", () => {
  assert.equal(balanceThrough(emptyData(), "2027-01"), 0);
  assert.deepEqual(totals([]), { income: 0, expense: 0 });
  assert.deepEqual(groupExpenses([]), []);
});
