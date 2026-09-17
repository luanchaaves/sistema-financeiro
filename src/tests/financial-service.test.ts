import { describe, it, expect } from 'vitest';
import { FinancialService } from '../lib/financial-service';
import { splitInstallments, formatCurrency, formatPercent } from '../lib/utils';

describe('FinancialService Core Engine', () => {
  it('calculates available balance correctly (Receitas - Despesas Pagas - Contas Pagas - Dívidas Pagas - Investimentos)', () => {
    const initialBank = 0;
    const incomeReceived = 6243.00;
    const expensesPaid = 903.00;
    const fixedPaid = 1768.90;
    const debtsPaid = 2289.14;
    const investments = 0.00;

    const available = FinancialService.calculateAvailableBalance(
      initialBank,
      incomeReceived,
      expensesPaid,
      fixedPaid,
      debtsPaid,
      investments
    );

    // 6243 - 903 - 1768.90 - 2289.14 = 1281.96
    expect(available).toBe(1281.96);
  });

  it('calculates projected balance correctly', () => {
    const currentBalance = 1281.96;
    const incomePending = 600.00;
    const expensesPending = 0.00;
    const fixedPending = 1805.00;
    const debtsPending = 1650.00;
    const cardInvoicesOpen = 0.00;

    const projected = FinancialService.calculateProjectedBalance(
      currentBalance,
      incomePending,
      expensesPending,
      fixedPending,
      debtsPending,
      cardInvoicesOpen
    );

    // 1281.96 + 600 - 1805 - 1650 = -1573.04
    expect(projected).toBe(-1573.04);
  });

  it('calculates savings rate correctly', () => {
    expect(FinancialService.calculateSavingsRate(10000, 8000)).toBe(20.0);
    expect(FinancialService.calculateSavingsRate(5000, 5000)).toBe(0.0);
    expect(FinancialService.calculateSavingsRate(0, 1000)).toBe(0.0);
  });

  it('calculates commitment rate correctly', () => {
    // 6439.14 committed / 8100 income => ~79.5%
    const rate = FinancialService.calculateCommitmentRate(6439.14, 8100);
    expect(rate).toBe(79.5);
  });

  it('determines appropriate financial diagnostic', () => {
    // Negative balance => Red Caixa Negativo
    const diagNeg = FinancialService.calculateDiagnostic(1000, -200, 10, 50);
    expect(diagNeg.status).toBe('negative');
    expect(diagNeg.label).toBe('Caixa Negativo');

    // High commitment > 75% => Warning
    const diagCommit = FinancialService.calculateDiagnostic(1500, 200, 10, 82);
    expect(diagCommit.status).toBe('warning');
    expect(diagCommit.label).toBe('Alto Comprometimento da Renda');

    // High savings rate >= 20% => Positive
    const diagGoodSavings = FinancialService.calculateDiagnostic(3000, 2500, 25, 40);
    expect(diagGoodSavings.status).toBe('positive');
    expect(diagGoodSavings.label).toBe('Boa Taxa de Economia');
  });

  it('splits credit card installments accurately with exact penny preservation', () => {
    const installments = splitInstallments(2450.00, 10, 'Setembro', 2026, 10);
    expect(installments).toHaveLength(10);
    expect(installments[0].amount).toBe(245.00);
    expect(installments[0].invoiceMonth).toBe('Setembro');
    expect(installments[0].invoiceYear).toBe(2026);
    expect(installments[1].invoiceMonth).toBe('Outubro');
    expect(installments[9].invoiceMonth).toBe('Junho');
    expect(installments[9].invoiceYear).toBe(2027);

    // Check sum is exactly 2450.00
    const totalSum = installments.reduce((acc, curr) => acc + curr.amount, 0);
    expect(Math.round(totalSum * 100) / 100).toBe(2450.00);
  });

  it('handles irregular penny division in installments (e.g. 100 in 3x)', () => {
    const installments = splitInstallments(100.00, 3, 'Janeiro', 2026, 15);
    expect(installments).toHaveLength(3);
    const sum = installments.reduce((acc, curr) => acc + curr.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(100.00);
  });

  it('formats currency and percentages in pt-BR standards', () => {
    expect(formatCurrency(1281.96)).toContain('1.281,96');
    expect(formatPercent(79.5)).toBe('79,5%');
  });

  it('calculates Net Worth correctly including physical assets (Vehicles, Real Estate, Tech)', () => {
    const summary = FinancialService.computeDashboard({
      incomes: [],
      expenses: [],
      installments: [],
      banks: [{ id: '1', name: 'Nubank', initialBalance: 3000 }],
      debts: [{ id: '1', name: 'Financiamento Ninja ZX-10R', creditor: 'Banco', originalAmount: 85000, remainingAmount: 68000, paidAmount: 17000, status: 'Ativa' }],
      investments: [{ id: '1', name: 'Tesouro Selic', type: 'Renda Fixa', institution: 'Nubank', appliedAmount: 2000, currentAmount: 2100, isEmergencyFund: true }],
      budgets: [],
      assets: [
        { id: '1', name: 'Kawasaki Ninja ZX-10R', type: 'VEICULO', category: 'Veículo', estimatedValue: 85000 },
        { id: '2', name: 'MacBook Pro M3', type: 'ELETRONICO', category: 'Eletrônico', estimatedValue: 15000 },
      ],
      selectedYear: 2026,
    });

    // Total Assets = Bank (3000) + Investments (2100) + Physical Assets (85000 + 15000 = 100000) = 105100
    // Total Liabilities = Debts (68000) + Open Invoices (0) = 68000
    // Net Worth = 105100 - 68000 = +37100
    expect(summary.netWorth.physicalAssets).toBe(100000);
    expect(summary.netWorth.totalAssets).toBe(105100);
    expect(summary.netWorth.totalLiabilities).toBe(68000);
    expect(summary.netWorth.netWorth).toBe(37100);
  });

  it('automatically projects active recurring fixed expenses into dashboard metrics and projected balance', () => {
    const summary = FinancialService.computeDashboard({
      incomes: [
        { id: '1', description: 'Salário', amount: 8336, status: 'Recebido', categoryName: 'Salário', year: 2026, month: 'Outubro' }
      ],
      expenses: [
        { id: '1', description: 'Supermercado', amount: 510, status: 'A pagar', type: 'Despesa', categoryName: 'Alimentação', year: 2026, month: 'Outubro' }
      ],
      fixedExpenses: [
        { id: '1', name: 'Faculdade FIAP', amount: 1315, dueDay: 1, categoryName: 'Faculdade', isActive: true },
        { id: '2', name: 'Internet Fibra', amount: 100, dueDay: 10, categoryName: 'Internet', isActive: true },
        { id: '3', name: 'Parcela Ninja', amount: 1650, dueDay: 10, categoryName: 'Parcelas', isActive: true },
        { id: '4', name: 'Seguro Moto', amount: 217, dueDay: 20, categoryName: 'Seguro', isActive: true },
        { id: '5', name: 'Aluguel', amount: 1588, dueDay: 25, categoryName: 'Moradia', isActive: true }
      ],
      installments: [
        { id: '1', purchaseId: 'p1', amount: 2373.68, invoiceYear: 2026, invoiceMonth: 'Outubro', dueDate: '2026-10-10', status: 'Fatura Aberta', installmentNumber: 1, totalInstallments: 1 }
      ],
      banks: [{ id: '1', name: 'Nubank', initialBalance: 0 }],
      debts: [],
      investments: [],
      budgets: [],
      assets: [],
      selectedYear: 2026,
      selectedMonth: 'Outubro',
    });

    // Expenses (Variáveis) = 510.00
    expect(summary.metrics.expensesTotal).toBe(510.00);
    expect(summary.metrics.expensesPaid).toBe(0.00);
    expect(summary.metrics.expensesPending).toBe(510.00);

    // 1315 + 100 + 1650 + 217 + 1588 = 4870.00
    expect(summary.metrics.fixedTotal).toBe(4870.00);
    expect(summary.metrics.fixedPaid).toBe(0.00);
    expect(summary.metrics.fixedPending).toBe(4870.00);

    // Available balance = Initial (0) + Income (8336) = 8336
    expect(summary.metrics.availableBalance).toBe(8336.00);

    // Projected balance = 8336 - 510 (expense) - 4870 (fixed) - 2373.68 (card) = 582.32
    expect(summary.metrics.projectedBalance).toBe(582.32);

    // Check that categories were created for unprojected rules
    const aluguelCat = summary.categoryDistribution.find(c => c.category === 'Moradia');
    expect(aluguelCat).toBeDefined();
    expect(aluguelCat?.totalPending).toBe(1588);
  });
});

