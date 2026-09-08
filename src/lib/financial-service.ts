import { DashboardSummary, MONTHS } from '@/types';

export interface RawIncome {
  id: string;
  date: Date | string;
  month: string;
  year: number;
  type: string;
  categoryId?: string | null;
  categoryName: string;
  description: string;
  amount: number;
  status: string; // 'Recebido' | 'Não recebido' | 'Parcial' | 'Cancelado'
  paymentMethod: string;
  bankId?: string | null;
  bankName: string;
}

export interface RawExpense {
  id: string;
  date: Date | string;
  month: string;
  year: number;
  type: string; // 'Despesa' | 'Conta Fixa' | 'Dívida' | 'Poupança/Investimento'
  categoryId?: string | null;
  categoryName: string;
  description: string;
  amount: number;
  status: string; // 'Pago' | 'A pagar' | 'Parcial' | 'Cancelado'
  paymentMethod: string;
  bankId?: string | null;
  bankName: string;
}

export interface RawCardInstallment {
  id: string;
  purchaseId: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  invoiceMonth: string;
  invoiceYear: number;
  dueDate: Date | string;
  status: string; // 'Fatura Aberta' | 'Fatura Fechada' | 'Fatura Paga' | 'Fatura Vencida'
  purchase?: {
    cardId: string;
    description: string;
    categoryName: string;
    card?: {
      name: string;
      brand?: string;
      color?: string;
      limitTotal?: number;
      limitAvailable?: number;
      dueDay?: number;
    };
  };
}

export interface RawBank {
  id: string;
  name: string;
  initialBalance: number;
  color?: string;
}

export interface RawDebt {
  id: string;
  name: string;
  creditor: string;
  originalAmount: number;
  remainingAmount: number;
  paidAmount: number;
  status: string;
}

export interface RawInvestment {
  id: string;
  name: string;
  type: string;
  institution: string;
  appliedAmount: number;
  currentAmount: number;
  isEmergencyFund: boolean;
}

export interface RawBudget {
  id: string;
  categoryId?: string | null;
  categoryName: string;
  dimension: string;
  year: number;
  month?: string | null;
  plannedAmount: number;
}

export interface RawAsset {
  id: string;
  name: string;
  type: string;
  category: string;
  estimatedValue: number;
  purchaseValue?: number | null;
  brand?: string | null;
  color?: string;
  icon?: string;
  deletedAt?: Date | string | null;
}

export class FinancialService {
  /**
   * Calculates real available balance right now
   * Available Balance = Initial Bank Balances + Received Incomes - Paid Expenses - Paid Fixed - Paid Debts - Investments Total
   */
  static calculateAvailableBalance(
    initialBankBalances: number,
    incomesReceived: number,
    expensesPaid: number,
    fixedPaid: number,
    debtsPaid: number,
    investmentsTotal: number
  ): number {
    const raw =
      initialBankBalances +
      incomesReceived -
      (expensesPaid + fixedPaid + debtsPaid + investmentsTotal);
    return Math.round(raw * 100) / 100;
  }

  /**
   * Calculates projected balance at the end of the selected period
   * Projected Balance = Available Balance + Pending Incomes - Pending Expenses - Pending Fixed - Pending Debts - Open Card Invoices
   */
  static calculateProjectedBalance(
    availableBalance: number,
    incomesPending: number,
    expensesPending: number,
    fixedPending: number,
    debtsPending: number,
    openCardInvoices: number
  ): number {
    const raw =
      availableBalance +
      incomesPending -
      (expensesPending + fixedPending + debtsPending + openCardInvoices);
    return Math.round(raw * 100) / 100;
  }

  /**
   * Calculates savings rate percentage
   * Savings Rate = ((Total Incomes - Total Outflows) / Total Incomes) * 100
   */
  static calculateSavingsRate(totalIncomes: number, totalOutflows: number): number {
    if (!totalIncomes || totalIncomes <= 0) return 0;
    const rate = ((totalIncomes - totalOutflows) / totalIncomes) * 100;
    return Math.round(rate * 10) / 10;
  }

  /**
   * Calculates income commitment rate
   * Commitment Rate = ((Fixed + Debts + Card Invoices) / Total Incomes) * 100
   */
  static calculateCommitmentRate(committedExpenses: number, totalIncomes: number): number {
    if (!totalIncomes || totalIncomes <= 0) return 0;
    const rate = (committedExpenses / totalIncomes) * 100;
    return Math.round(rate * 10) / 10;
  }

  /**
   * Evaluates financial health diagnostic based on rules:
   * - 🟢 POSITIVE: Savings Rate >= 20% AND Commitment Rate < 50%
   * - 🟡 WARNING: Savings Rate between 5% and 20% OR Commitment Rate 50%-75%
   * - 🔴 NEGATIVE / CRITICAL: Commitment Rate > 75% OR Projected Balance < 0 OR Deficit
   */
  static calculateDiagnostic(
    availableBalance: number,
    projectedBalance: number,
    savingsRate: number,
    commitmentRate: number
  ): {
    status: 'positive' | 'warning' | 'negative';
    label: string;
    description: string;
    recommendation: string;
    color: string;
  } {
    if (availableBalance < 0 || projectedBalance < 0) {
      return {
        status: 'negative',
        label: 'Caixa Negativo',
        description: 'Seus gastos projetados superam as receitas previstas. Revise contas e cartões.',
        recommendation: 'Seus gastos projetados superam as receitas previstas. Revise contas e cartões.',
        color: '#ef4444', // Red
      };
    }

    if (commitmentRate > 75) {
      return {
        status: 'warning',
        label: 'Alto Comprometimento da Renda',
        description: `Suas obrigações fixas, dívidas e faturas consom ${commitmentRate.toFixed(1)}% da sua renda.`,
        recommendation: `Suas obrigações fixas, dívidas e faturas consom ${commitmentRate.toFixed(1)}% da sua renda.`,
        color: '#f59e0b', // Amber
      };
    }

    if (savingsRate < 5) {
      return {
        status: 'warning',
        label: 'Atenção aos Gastos',
        description: 'Sua taxa de economia está baixa. Tente cortar despesas supérfluas.',
        recommendation: 'Sua taxa de economia está baixa. Tente cortar despesas supérfluas.',
        color: '#eab308', // Yellow
      };
    }

    if (savingsRate >= 20) {
      return {
        status: 'positive',
        label: 'Boa Taxa de Economia',
        description: `Excelente! Você está poupando ${savingsRate.toFixed(1)}% da sua renda mensal.`,
        recommendation: `Excelente! Você está poupando ${savingsRate.toFixed(1)}% da sua renda mensal.`,
        color: '#10b981', // Emerald
      };
    }

    return {
      status: 'positive',
      label: 'Caixa Positivo',
      description: 'Sua situação financeira está equilibrada com saldo favorável.',
      recommendation: 'Sua situação financeira está equilibrada com saldo favorável.',
      color: '#22c55e', // Green
    };
  }

  /**
   * Generates strategic financial advice based on budget execution
   */
  static getStrategicTip(dimension: string, planned: number, actual: number): string {
    switch (dimension) {
      case 'Renda Total':
        return actual >= planned && planned > 0
          ? 'Excelente! Meta de faturamento alcançada ou superada.'
          : 'Foque em consolidar e expandir rendas ativas e serviços extras.';
      case 'Poupança / Investimentos':
        return actual >= planned && planned > 0
          ? 'Ótimo ritmo de aportes! Mantenha a consistência.'
          : 'Mantenha consistência mensal e priorize formar 6 meses de Reserva.';
      case 'Despesas Variáveis':
        return actual > planned && planned > 0
          ? 'Atenção: despesas variáveis ultrapassaram o teto estipulado.'
          : 'Acompanhe passeios e compras de impulso para não estourar o limite.';
      case 'Contas Fixas / Moradia':
        return 'Revise contratos periódicos, planos de internet e assinaturas.';
      case 'Dívidas / Cartões':
        return 'Priorize a quitação de cartões e amortização de parcelas com juros.';
      default:
        return 'Mantenha seus lançamentos atualizados para melhor precisão.';
    }
  }

  /**
   * Aggregates full dashboard calculations based on current filters (year, month)
   */
  static computeDashboard(params: {
    incomes: RawIncome[];
    expenses: RawExpense[];
    installments: RawCardInstallment[];
    banks: RawBank[];
    debts: RawDebt[];
    investments: RawInvestment[];
    budgets: RawBudget[];
    assets?: RawAsset[];
    selectedYear?: number;
    selectedMonth?: string; // 'TODOS' or specific month name
  }): DashboardSummary {
    const {
      incomes,
      expenses,
      installments,
      banks,
      debts,
      investments,
      budgets,
      assets = [],
      selectedYear,
      selectedMonth,
    } = params;

    // Filter datasets by year and month
    const filterRecord = (item: { year?: number; month?: string; invoiceYear?: number; invoiceMonth?: string }) => {
      const itemYear = item.year ?? item.invoiceYear;
      const itemMonth = item.month ?? item.invoiceMonth;

      if (selectedYear && itemYear && itemYear !== selectedYear) return false;
      if (selectedMonth && selectedMonth !== 'TODOS' && itemMonth && itemMonth.toLowerCase() !== selectedMonth.toLowerCase()) {
        return false;
      }
      return true;
    };

    const filteredIncomes = incomes.filter(filterRecord);
    const filteredExpenses = expenses.filter(filterRecord);
    const filteredInstallments = installments.filter(filterRecord);

    // Incomes
    let incomeReceived = 0;
    let incomePending = 0;
    filteredIncomes.forEach((inc) => {
      if (inc.status === 'Recebido') incomeReceived += inc.amount;
      else if (inc.status === 'Não recebido' || inc.status === 'Parcial') incomePending += inc.amount;
    });
    const totalIncome = incomeReceived + incomePending;

    // Expenses breakdown
    let expensesPaid = 0;
    let expensesPending = 0;
    let fixedPaid = 0;
    let fixedPending = 0;
    let debtPaid = 0;
    let debtPending = 0;
    let savingsTotal = 0;

    filteredExpenses.forEach((exp) => {
      const isPaid = exp.status === 'Pago';
      const isPending = exp.status === 'A pagar' || exp.status === 'Parcial';

      if (exp.type === 'Conta Fixa') {
        if (isPaid) fixedPaid += exp.amount;
        else if (isPending) fixedPending += exp.amount;
      } else if (exp.type === 'Dívida') {
        if (isPaid) debtPaid += exp.amount;
        else if (isPending) debtPending += exp.amount;
      } else if (exp.type === 'Poupança/Investimento') {
        if (isPaid) savingsTotal += exp.amount;
      } else {
        // Regular Despesa
        if (isPaid) expensesPaid += exp.amount;
        else if (isPending) expensesPending += exp.amount;
      }
    });

    const totalExpenses = expensesPaid + expensesPending + fixedPaid + fixedPending + debtPaid + debtPending;

    // Credit Cards
    let totalCreditCardOpen = 0;
    let totalCreditCardPaid = 0;
    const cardMonthMap = new Map<string, { cardName: string; amount: number; status: string; color: string }>();

    filteredInstallments.forEach((inst) => {
      const isPaid = inst.status === 'Fatura Paga';
      if (isPaid) {
        totalCreditCardPaid += inst.amount;
      } else {
        totalCreditCardOpen += inst.amount;
      }

      const cardId = inst.purchase?.cardId || 'default';
      const cardName = inst.purchase?.card?.name || 'Cartão';
      const color = inst.purchase?.card?.color || '#a855f7';

      const existing = cardMonthMap.get(cardId) || {
        cardName,
        amount: 0,
        status: inst.status,
        color,
      };
      existing.amount += inst.amount;
      cardMonthMap.set(cardId, existing);
    });

    const cardSummaries = Array.from(cardMonthMap.entries()).map(([cardId, val]) => ({
      cardId,
      cardName: val.cardName,
      invoiceMonthAmount: val.amount,
      status: val.status,
      color: val.color,
    }));
    const totalCardMonth = totalCreditCardOpen + totalCreditCardPaid;

    // Bank Positions
    let totalInitialBank = 0;
    const bankPositions = banks.map((b) => {
      totalInitialBank += b.initialBalance;

      // Calculate total incomes deposited into this bank
      const bankIncomes = filteredIncomes
        .filter((inc) => (inc.bankId === b.id || inc.bankName === b.name) && inc.status === 'Recebido')
        .reduce((sum, inc) => sum + inc.amount, 0);

      // Calculate total expenses paid from this bank
      const bankExpenses = filteredExpenses
        .filter((exp) => (exp.bankId === b.id || exp.bankName === b.name) && exp.status === 'Pago')
        .reduce((sum, exp) => sum + exp.amount, 0);

      const currentBalance = Math.round((b.initialBalance + bankIncomes - bankExpenses) * 100) / 100;

      return {
        bankId: b.id,
        bankName: b.name,
        initialBalance: b.initialBalance,
        incomes: bankIncomes,
        expenses: bankExpenses,
        currentBalance,
        color: b.color || '#38bdf8',
      };
    });

    const totalBankBalance = bankPositions.reduce((acc, curr) => acc + curr.currentBalance, 0);

    // Investments Total
    const investmentsTotal = investments.reduce((acc, curr) => acc + curr.currentAmount, 0);

    // Available and Projected Balance
    const availableBalance = this.calculateAvailableBalance(
      totalInitialBank,
      incomeReceived,
      expensesPaid,
      fixedPaid,
      debtPaid,
      savingsTotal
    );

    const projectedBalance = this.calculateProjectedBalance(
      availableBalance,
      incomePending,
      expensesPending,
      fixedPending,
      debtPending,
      totalCreditCardOpen
    );

    // Savings & Commitment Rates
    const totalSpentReal = expensesPaid + fixedPaid + debtPaid;
    const savingsRate = this.calculateSavingsRate(incomeReceived, totalSpentReal);
    const committedExpenses = fixedPaid + fixedPending + debtPaid + debtPending + totalCreditCardOpen;
    const incomeCommitmentRate = this.calculateCommitmentRate(committedExpenses, totalIncome);

    // Diagnostic
    const diagnostic = this.calculateDiagnostic(
      availableBalance,
      projectedBalance,
      savingsRate,
      incomeCommitmentRate
    );

    // Monthly Consolidated Matrix (Jan..Dez) for the target year
    const targetYear = selectedYear || new Date().getFullYear();
    const monthlyConsolidated = MONTHS.map((m) => {
      const mIncomes = incomes.filter((i) => i.year === targetYear && i.month === m);
      const mExpenses = expenses.filter((e) => e.year === targetYear && e.month === m);
      const mInstallments = installments.filter((ins) => ins.invoiceYear === targetYear && ins.invoiceMonth === m);

      const incReal = mIncomes.filter((i) => i.status === 'Recebido').reduce((s, i) => s + i.amount, 0);
      const incPending = mIncomes.filter((i) => i.status !== 'Recebido').reduce((s, i) => s + i.amount, 0);
      const incPlanned = incReal + incPending;

      let expReal = 0;
      let fixReal = 0;
      let dbtReal = 0;
      let savReal = 0;
      let expPending = 0;

      mExpenses.forEach((e) => {
        if (e.status === 'Pago') {
          if (e.type === 'Conta Fixa') fixReal += e.amount;
          else if (e.type === 'Dívida') dbtReal += e.amount;
          else if (e.type === 'Poupança/Investimento') savReal += e.amount;
          else expReal += e.amount;
        } else {
          expPending += e.amount;
        }
      });

      const cardDebt = mInstallments.reduce((s, ins) => s + ins.amount, 0);
      const totalDebtReal = dbtReal + cardDebt;
      const totalOutReal = expReal + fixReal + totalDebtReal + savReal;
      const balReal = incReal - totalOutReal;

      const expPlanned = totalOutReal + expPending;
      const balProjected = incPlanned - expPlanned;
      const savRate = incReal > 0 ? ((incReal - (expReal + fixReal + totalDebtReal)) / incReal) * 100 : 0;

      let status = 'Sem Lançamentos';
      if (incReal > 0 || totalOutReal > 0) {
        status = balReal >= 0 ? 'Superávit' : 'Déficit';
      }

      return {
        month: m.slice(0, 3), // Jan, Fev, Mar...
        incomeReal: Math.round(incReal * 100) / 100,
        savingsReal: Math.round(savReal * 100) / 100,
        expensesReal: Math.round(expReal * 100) / 100,
        fixedReal: Math.round(fixReal * 100) / 100,
        debtReal: Math.round(totalDebtReal * 100) / 100,
        balanceReal: Math.round(balReal * 100) / 100,
        incomePlanned: Math.round(incPlanned * 100) / 100,
        expensesPlanned: Math.round(expPlanned * 100) / 100,
        balanceProjected: Math.round(balProjected * 100) / 100,
        savingsRate: Math.round(savRate * 10) / 10,
        status,
      };
    });

    // Annual Planned vs Actual Comparison
    const dimensions = [
      { name: 'Renda Total', actual: totalIncome, plannedKey: 'Renda' },
      { name: 'Poupança / Investimentos', actual: savingsTotal, plannedKey: 'Investimento' },
      { name: 'Despesas Variáveis', actual: expensesPaid + expensesPending, plannedKey: 'Despesa' },
      { name: 'Contas Fixas / Moradia', actual: fixedPaid + fixedPending, plannedKey: 'Conta Fixa' },
      { name: 'Dívidas / Cartões', actual: debtPaid + debtPending + totalCardMonth, plannedKey: 'Dívida' },
    ];

    const annualComparison = dimensions.map((d) => {
      const plannedSum = budgets
        .filter((b) => b.year === targetYear && (b.dimension === d.plannedKey || b.categoryName === d.name))
        .reduce((sum, b) => sum + b.plannedAmount, 0);

      const diff = plannedSum > 0 ? plannedSum - d.actual : -d.actual;
      const execRate = plannedSum > 0 ? (d.actual / plannedSum) * 100 : 0;

      return {
        dimension: d.name,
        planned: plannedSum,
        actual: Math.round(d.actual * 100) / 100,
        difference: Math.round(diff * 100) / 100,
        executionRate: Math.round(execRate * 10) / 10,
        percentage: Math.round(execRate * 10) / 10,
        tip: this.getStrategicTip(d.name, plannedSum, d.actual),
        strategicTip: this.getStrategicTip(d.name, plannedSum, d.actual),
      };
    });

    // Categorized Distribution for Chart & Summary Table
    const catMap = new Map<string, { type: string; paid: number; pending: number }>();

    filteredExpenses.forEach((exp) => {
      const key = exp.categoryName || 'Outros';
      const existing = catMap.get(key) || { type: exp.type, paid: 0, pending: 0 };
      if (exp.status === 'Pago') existing.paid += exp.amount;
      else existing.pending += exp.amount;
      catMap.set(key, existing);
    });

    // Add credit card purchases to categorized distribution
    filteredInstallments.forEach((ins) => {
      const cat = ins.purchase?.categoryName || 'Cartão Nubank';
      const existing = catMap.get(cat) || { type: 'Dívida', paid: 0, pending: 0 };
      if (ins.status === 'Fatura Paga') existing.paid += ins.amount;
      else existing.pending += ins.amount;
      catMap.set(cat, existing);
    });

    const totalSpendCategory = Array.from(catMap.values()).reduce((sum, v) => sum + v.paid, 0);
    const categoryColors = [
      '#38bdf8', '#a855f7', '#f43f5e', '#10b981', '#f59e0b',
      '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6', '#eab308'
    ];

    let colorIdx = 0;
    const categoryDistribution = Array.from(catMap.entries())
      .map(([catName, data]) => {
        const pct = totalSpendCategory > 0 ? (data.paid / totalSpendCategory) * 100 : 0;
        const col = categoryColors[colorIdx % categoryColors.length];
        colorIdx++;
        return {
          category: catName,
          type: data.type,
          totalPaid: Math.round(data.paid * 100) / 100,
          totalPending: Math.round(data.pending * 100) / 100,
          amount: Math.round(data.paid * 100) / 100,
          percentage: Math.round(pct * 10) / 10,
          percentageOfTotal: Math.round(pct * 10) / 10,
          color: col,
        };
      })
      .sort((a, b) => b.totalPaid - a.totalPaid);

    // Net Worth (Ativos - Passivos)
    const physicalAssetsTotal = (assets || [])
      .filter((a) => !a.deletedAt)
      .reduce((sum, a) => sum + (a.estimatedValue || 0), 0);

    const totalAssets = totalBankBalance + investmentsTotal + physicalAssetsTotal;
    const totalLiabilities = debts.reduce((sum, d) => sum + d.remainingAmount, 0) + totalCreditCardOpen;
    const netWorthTotal = Math.round((totalAssets - totalLiabilities) * 100) / 100;

    const monthlyMatrix = monthlyConsolidated.map((m) => ({
      month: m.month,
      incomes: m.incomeReal,
      expenses: m.expensesReal,
      fixedExpenses: m.fixedReal,
      debts: m.debtReal,
      investments: m.savingsReal,
      totalExpenses: m.expensesReal + m.fixedReal + m.debtReal + m.savingsReal,
      balance: m.balanceReal,
    }));

    const metrics = {
      incomeReceived: Math.round(incomeReceived * 100) / 100,
      incomePending: Math.round(incomePending * 100) / 100,
      incomeTotal: Math.round(totalIncome * 100) / 100,
      expensesPaid: Math.round(expensesPaid * 100) / 100,
      expensesPending: Math.round(expensesPending * 100) / 100,
      expensesTotal: Math.round(totalExpenses * 100) / 100,
      fixedPaid: Math.round(fixedPaid * 100) / 100,
      fixedPending: Math.round(fixedPending * 100) / 100,
      fixedTotal: Math.round((fixedPaid + fixedPending) * 100) / 100,
      debtPaid: Math.round(debtPaid * 100) / 100,
      debtPending: Math.round(debtPending * 100) / 100,
      debtTotal: Math.round((debtPaid + debtPending) * 100) / 100,
      investmentsTotal: Math.round(investmentsTotal * 100) / 100,
      availableBalance,
      projectedBalance,
      creditCardInvoicesOpen: Math.round(totalCreditCardOpen * 100) / 100,
      savingsRate,
      commitmentRate: incomeCommitmentRate,
    };

    const cardList = cardSummaries.map((c) => ({
      id: c.cardId,
      name: c.cardName,
      limitTotal: 5000,
      limitAvailable: Math.max(0, 5000 - c.invoiceMonthAmount),
      dueDay: 10,
      color: c.color,
    }));

    return {
      metrics,
      diagnostic,
      monthlyMatrix,
      annualComparison,
      categoryDistribution,
      bankBalances: bankPositions,
      creditCards: cardList,
      goals: [],
      netWorth: {
        bankBalances: Math.round(totalBankBalance * 100) / 100,
        investments: Math.round(investmentsTotal * 100) / 100,
        emergencyFund: Math.round(savingsTotal * 100) / 100,
        physicalAssets: Math.round(physicalAssetsTotal * 100) / 100,
        totalAssets: Math.round(totalAssets * 100) / 100,
        debts: Math.round(debts.reduce((sum, d) => sum + d.remainingAmount, 0) * 100) / 100,
        openCreditCardInvoices: Math.round(totalCreditCardOpen * 100) / 100,
        totalLiabilities: Math.round(totalLiabilities * 100) / 100,
        netWorth: netWorthTotal,
      },
      physicalAssetsTotal: Math.round(physicalAssetsTotal * 100) / 100,

      // Flat compatibility properties
      incomeReceived: Math.round(incomeReceived * 100) / 100,
      incomePending: Math.round(incomePending * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      expensesPaid: Math.round(expensesPaid * 100) / 100,
      expensesPending: Math.round(expensesPending * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      fixedPaid: Math.round(fixedPaid * 100) / 100,
      fixedPending: Math.round(fixedPending * 100) / 100,
      debtPaid: Math.round(debtPaid * 100) / 100,
      debtPending: Math.round(debtPending * 100) / 100,
      investmentsTotal: Math.round(investmentsTotal * 100) / 100,
      savingsTotal: Math.round(savingsTotal * 100) / 100,
      availableBalance,
      projectedBalance,
      totalCreditCardOpen: Math.round(totalCreditCardOpen * 100) / 100,
      totalCreditCardPaid: Math.round(totalCreditCardPaid * 100) / 100,
      savingsRate,
      incomeCommitmentRate,
      bankPositions,
      totalBankBalance: Math.round(totalBankBalance * 100) / 100,
      cardSummaries,
      totalCardMonth: Math.round(totalCardMonth * 100) / 100,
      monthlyConsolidated,
    };
  }
}
