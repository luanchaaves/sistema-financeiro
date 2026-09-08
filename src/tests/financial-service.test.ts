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
      debts: [{ id: '1', name: 'Financiamento Veicular', creditor: 'Banco', originalAmount: 85000, remainingAmount: 68000, paidAmount: 17000, status: 'Ativa' }],
      investments: [{ id: '1', name: 'Tesouro Selic', type: 'Renda Fixa', institution: 'Nubank', appliedAmount: 2000, currentAmount: 2100, isEmergencyFund: true }],
      budgets: [],
      assets: [
        { id: '1', name: 'Veículo Sedan 2023', type: 'VEICULO', category: 'Veículo', estimatedValue: 85000 },
        { id: '2', name: 'Notebook Pro 16', type: 'ELETRONICO', category: 'Eletrônico', estimatedValue: 15000 },
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
});

