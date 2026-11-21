# Minhas Finanças

Aplicativo pessoal de orçamento e investimentos, em português, inspirado em planilhas de orçamento mensal. Interface responsiva em React, Vite e Recharts.

## Executar

Requer Node.js 20.19+ e npm.

```sh
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite. Para gerar a versão estática: `npm run build`. Para conferir a versão compilada: `npm run preview`. Testes dos cálculos e validação de backup: `npm test`.

## Recursos

- Visão mensal de receitas, despesas, saldo acumulado e carteira.
- Cadastro, edição e exclusão de transações com data, categoria e descrição; filtros de texto, tipo e categoria.
- Orçamento mensal por categoria com comparação entre planejado e realizado. Os limites são salvos ao sair do campo.
- Gráficos de fluxo semestral, distribuição das despesas, economia mensal e composição da carteira.
- Carteira de CDB, Tesouro Direto, LCI/LCA, criptomoedas, ações, fundos imobiliários, fundos, ETFs e outros ativos.
- Ativos de renda fixa usam o valor atual informado. Criptomoedas, ações, FIIs e ETFs usam quantidade × preço unitário em reais.
- Saldo inicial editável, demonstração opcional com valores fictícios, importação e exportação de backup JSON validado.

## Dados e cálculos

Os dados são armazenados em `localStorage`, sob a chave `minhas-financas:v1`, apenas neste navegador e nesta origem. Não há login, backend ou sincronização entre dispositivos. **Exporte backups regularmente** e antes de mudar de endereço, navegador ou dispositivo. Limpar os dados do navegador remove os registros. Backups contêm seus dados financeiros: guarde-os em local privado, fora do repositório.

O saldo disponível é o saldo inicial mais todas as receitas menos todas as despesas registradas até o último dia do mês escolhido. Lançamentos futuros dentro desse mês também são incluídos. A economia mensal é a diferença entre receitas e despesas do mês; a taxa de economia divide essa diferença pelas receitas. O orçamento compara todos os gastos do mês com os limites definidos.

A carteira é independente do fluxo de caixa para evitar movimentações implícitas. Registre aportes em Transações (categoria Investimentos) se quiser refletir a saída de dinheiro do saldo. O cadastro de um ativo não cria uma transação. O resultado da carteira é valor atual bruto menos capital aplicado, sem impostos e taxas. Preços e rendimentos são **manuais**; não há conexão com bancos, corretoras, exchanges ou Google Sheets. Nenhum dado real das planilhas é incluído no código ou na demonstração.

## Publicação estática

A pasta `dist/` gerada por `npm run build` pode ser hospedada em um servidor estático, com o diretório raiz apontando para ela. Use HTTPS. Não publique backups. Uma futura sincronização requer autenticação e armazenamento por usuário antes de colocar dados pessoais em um servidor.

## GitHub Pages

Site: https://gustavosergio.github.io/minhas-financas/

A publicação é automática a cada push em `main`, pelo workflow `pages.yml`, que executa testes, compila e publica `dist/`. A variável `GITHUB_PAGES=true` ajusta o caminho dos arquivos para `/minhas-financas/`; o desenvolvimento local continua usando `/`.

Os registros locais não migram automaticamente de localhost para o endereço público. Para transferi-los, exporte o backup no endereço antigo e importe-o nas configurações do site publicado. O código do site é público; os registros financeiros permanecem no navegador de cada usuário.
