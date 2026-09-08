# 💎 Sistema Financeiro Inteligente

> **Sistema Web Completo e Moderno de Gestão Financeira Pessoal, Orçamentos, Planejamento e Inteligência Patrimonial.**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.18-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2d3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003b57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker)](https://www.docker.com/)

---

## 📸 Visão Geral

O **Sistema Financeiro** foi desenvolvido para transformar o controle financeiro pessoal em uma experiência visual, ágil e altamente estratégica. Diferente de planilhas complexas ou aplicativos engessados, o sistema integra **todas as dimensões da sua vida financeira** em um único lugar:

* 📊 **Painel Executivo em Tempo Real**: Métricas de liquidez, saldo em caixa, saldo projetado pós-contas e diagnóstico inteligente.
* 💳 **Gestão Profissional de Cartões**: Lançamento de compras à vista e parceladas com divisão precisa de centavos, acompanhamento de faturas consolidadas e edição de limites.
* 💎 **Módulo de Patrimônio & Bens (Net Worth)**: Cadastro de veículos, imóveis, eletrônicos e equipamentos, cálculo de valorização/depreciação e indicador de Solvência.
* 📈 **Fluxo de Caixa & Matriz Anual**: Visão matricial de 12 meses para receitas, despesas fixas, variáveis, cartões e investimentos.
* 🎯 **Metas Financeiras & Reserva de Emergência**: Acompanhamento visual de objetivos com barras de progresso e prazos.
* 📑 **Exportação de Dados**: Geração instantânea de planilhas em Excel (`.xlsx`) e relatórios.

---

## 🚀 Funcionalidades Principais

| Módulo | Descrição |
| :--- | :--- |
| **Painel Geral** | Resumo unificado, cartões executivos de KPI, diagnóstico de saúde financeira e alertas de faturas abertas. |
| **Rendas & Receitas** | Registro de salários, consultorias PJ, rendimentos e dividendos, status de recebimento e filtros por instituição. |
| **Despesas do Dia a Dia** | Controle minucioso de gastos variáveis, categorização visual, métodos de pagamento e gráficos dinâmicos. |
| **Contas Fixas** | Gestão de despesas recorrentes (aluguel, condomínio, internet, energia, assinaturas) com controle de vencimento. |
| **Cartões de Crédito** | Suporte a múltiplos cartões, faturas abertas/fechadas, agrupamento por compra e edição de parcelas. |
| **Dívidas & Financiamentos** | Acompanhamento de contratos, amortização, taxa de juros e saldo devedor restante. |
| **Investimentos & Carteira** | Portfólio de Renda Fixa, FIIs, Ações, Cripto e Reserva de Emergência com rentabilidade e aportes. |
| **Patrimônio & Bens** | Avaliação do Patrimônio Líquido real ($\text{Ativos} - \text{Passivos}$), controle de veículos, imóveis e tecnologia. |
| **Planejamento Orçamentário** | Definição de limites por categoria e acompanhamento em tempo real do orçado vs realizado. |
| **Fluxo de Caixa Anual** | Matriz dinâmica de Janeiro a Dezembro com totalizadores automáticos por categoria. |

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
* **Componentes & Ícones**: [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/) (Data Visualizations)
* **Backend**: Next.js Route Handlers (API RESTful)
* **Banco de Dados & ORM**: [Prisma ORM](https://www.prisma.io/) com [SQLite](https://www.sqlite.org/) (persistência simples e sem necessidade de servidores externos)
* **Validação & Formulários**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
* **Exportação**: [XLSX (SheetJS)](https://sheetjs.com/), [jsPDF](https://github.com/parallax/jsPDF)
* **Testes**: [Vitest](https://vitest.dev/)
* **Infraestrutura**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

---

## ⚡ Como Executar o Projeto

### Opção 1: Via Docker (Recomendado para Produção / Servidores)

Clone o repositório e execute com Docker Compose:

```bash
git clone https://github.com/luanchaaves/sistema-financeiro.git
cd sistema-financeiro
docker compose up -d --build
```

Acesse no seu navegador: **`http://localhost:3000`** *(ou `http://IP_DO_SERVIDOR:3000`)*.

---

### Opção 2: Localmente para Desenvolvimento (Node.js)

**Pré-requisitos**: Node.js 18+ instalado.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/luanchaaves/sistema-financeiro.git
   cd sistema-financeiro
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```

4. **Sincronize o banco de dados e popule os dados de demonstração:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

6. Abra no navegador: **`http://localhost:3000`**.

---

## 🧪 Rodando os Testes Automatizados

O sistema inclui uma suíte de testes unitários para os algoritmos de cálculo financeiro, divisão de faturas e fórmulas de patrimônio:

```bash
npm test
```

---

## 🗄️ Interface Visual do Banco de Dados (Prisma Studio)

Para visualizar e gerenciar diretamente as tabelas do banco de dados no seu navegador:

```bash
npx prisma studio
```
Acesse em: `http://localhost:5555`

---

## 📁 Estrutura do Projeto

```text
sistema-financeiro/
├── prisma/
│   ├── schema.prisma       # Modelagem de dados completa (Asset, Bank, Income, Expense, Card, etc.)
│   └── seed.ts             # Script de inicialização com dados de demonstração
├── src/
│   ├── app/                # Rotas do Next.js 14 App Router
│   │   ├── api/            # API RESTful (Assets, Banks, Budgets, Cards, Incomes, etc.)
│   │   ├── cartoes/        # Gestão de cartões e faturas
│   │   ├── contas-fixas/   # Despesas recorrentes
│   │   ├── despesas/       # Despesas variáveis
│   │   ├── dividas/        # Financiamentos e dívidas
│   │   ├── fluxo-caixa/    # Matriz anual de fluxo de caixa
│   │   ├── investimentos/  # Carteira e reserva de emergência
│   │   ├── metas/          # Metas financeiras
│   │   ├── orcamento/      # Planejamento orçamentário
│   │   ├── patrimonio/     # Módulo de Patrimônio & Bens
│   │   ├── rendas/         # Receitas e rendimentos
│   │   └── page.tsx        # Dashboard Principal
│   ├── components/         # Componentes modulares, gráficos, modais e layouts
│   ├── context/            # FinancialContext para gerenciamento de estado global
│   ├── lib/                # Motor de cálculo financeiro, exportadores e utilitários
│   └── types/              # Definições TypeScript
├── docker-compose.yml      # Configuração de containers Docker
├── Dockerfile              # Imagem de produção otimizada
└── README.md               # Documentação do projeto
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais informações.

---

<p align="center">
  Desenvolvido com foco em alta performance, usabilidade e clareza financeira. 🚀
</p>
