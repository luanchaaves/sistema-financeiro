export type MonthName =
  | 'Janeiro'
  | 'Fevereiro'
  | 'Março'
  | 'Abril'
  | 'Maio'
  | 'Junho'
  | 'Julho'
  | 'Agosto'
  | 'Setembro'
  | 'Outubro'
  | 'Novembro'
  | 'Dezembro';

export const MONTHS: MonthName[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface BankAccount {
  id: string;
  name: string;
  type?: string;
  initialBalance: number;
  color?: string;
  icon?: string;
  isArchived?: boolean;
  currentBalance?: number;
}
export type Bank = BankAccount;

export interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'FIXED' | 'DEBT' | 'INVESTMENT';
  color?: string;
  icon?: string;
  isCustom?: boolean;
}
export type Category = CategoryItem;

export interface IncomeItem {
  id: string;
  date: string;
  month: string;
  year: number;
  type: string;
  categoryId?: string | null;
  categoryName: string;
  description: string;
  amount: number;
  status: 'Recebido' | 'Não recebido' | 'Parcial' | 'Cancelado';
  paymentMethod: string;
  bankId?: string | null;
  bankName: string;
  notes?: string | null;
  isRecurring?: boolean;
}
export type Income = IncomeItem;

export interface ExpenseItem {
  id: string;
  date: string;
  month: string;
  year: number;
  type: 'Despesa' | 'Conta Fixa' | 'Dívida' | 'Poupança/Investimento';
  categoryId?: string | null;
  categoryName: string;
  description: string;
  amount: number;
  status: 'Pago' | 'A pagar' | 'Parcial' | 'Cancelado';
  paymentMethod: string;
  bankId?: string | null;
  bankName: string;
  notes?: string | null;
  isRecurring?: boolean;
}
export type Expense = ExpenseItem;

export interface FixedExpenseItem {
  id: string;
  name: string;
  categoryId?: string | null;
  categoryName: string;
  amount: number;
  dueDay: number;
  bankId?: string | null;
  bankName: string;
  paymentMethod: string;
  frequency: string;
  startDate?: string;
  endDate?: string | null;
  isActive: boolean;
  notes?: string | null;
}
export type FixedExpense = FixedExpenseItem;

export interface CreditCardItem {
  id: string;
  name: string;
  bankId?: string | null;
  bankName: string;
  limitTotal: number;
  limitAvailable: number;
  closingDay: number;
  dueDay: number;
  color: string;
  brand: string;
  isActive?: boolean;
}
export type CreditCard = CreditCardItem;

export interface CreditCardPurchaseItem {
  id: string;
  date: string;
  cardId: string;
  card?: { name: string; brand?: string };
  cardName?: string;
  categoryId?: string | null;
  categoryName: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  installmentAmount: number;
  invoiceMonth: string;
  invoiceYear: number;
  status: string;
  notes?: string | null;
  installments?: CreditCardInstallmentItem[];
}
export type CreditCardPurchase = CreditCardPurchaseItem;

export interface CreditCardInstallmentItem {
  id: string;
  purchaseId: string;
  purchaseDescription?: string;
  cardName?: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  invoiceMonth: string;
  invoiceYear: number;
  dueDate: string;
  status: string;
  notes?: string | null;
}
export type CreditCardInstallment = CreditCardInstallmentItem;

export interface CreditCardInvoiceItem {
  id?: string;
  cardId: string;
  cardName?: string;
  month: string;
  year: number;
  totalAmount: number;
  status: 'Fatura Aberta' | 'Fatura Fechada' | 'Fatura Paga' | 'Fatura Vencida';
  closingDate?: string;
  dueDate?: string;
  paidDate?: string | null;
  paidAmount?: number | null;
  purchasesCount?: number;
}
export type CreditCardInvoice = CreditCardInvoiceItem;

export interface DebtItem {
  id: string;
  name: string;
  creditor: string;
  originalAmount: number;
  currentAmount?: number;
  paidAmount: number;
  remainingAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  installmentAmount: number;
  interestRate?: number;
  startDate?: string;
  dueDate?: string | null;
  status: string;
  notes?: string | null;
  progressPercentage?: number;
}
export type Debt = DebtItem;

export interface InvestmentItem {
  id: string;
  name: string;
  type: string;
  institution: string;
  appliedAmount: number;
  currentAmount: number;
  yieldRate?: number;
  yieldAmount?: number;
  startDate?: string;
  notes?: string | null;
  isEmergencyFund: boolean;
}
export type Investment = InvestmentItem;

export interface FinancialGoalItem {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  color?: string;
  icon?: string;
  notes?: string | null;
  progressPercentage?: number;
}
export type FinancialGoal = FinancialGoalItem;

export interface BudgetItem {
  id: string;
  categoryId?: string | null;
  categoryName: string;
  dimension?: string;
  year: number;
  month?: string | null;
  plannedAmount: number;
  actualAmount: number;
  variance?: number;
  percentageUsed?: number;
  statusBadge?: 'ok' | 'warning' | 'danger';
}
export type Budget = BudgetItem;

export interface MonthlyMatrixRow {
  month: string;
  incomes: number;
  expenses: number;
  fixedExpenses: number;
  debts: number;
  investments: number;
  totalExpenses: number;
  balance: number;
  accumulatedBalance?: number;
}

export interface AssetItem {
  id: string;
  name: string;
  type: string; // VEICULO, IMOVEL, ELETRONICO, EQUIPAMENTO, OUTRO
  category: string; // Veículo, Imóvel, Eletrônico, Equipamento, Outro
  estimatedValue: number;
  purchaseValue?: number | null;
  purchaseDate?: string | null;
  brand?: string | null;
  modelYear?: number | null;
  color?: string;
  icon?: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export type Asset = AssetItem;

export interface NetWorthBreakdown {
  bankBalances: number;
  investments: number;
  emergencyFund: number;
  physicalAssets?: number;
  totalAssets: number;
  debts: number;
  openCreditCardInvoices: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface DashboardSummary {
  metrics: {
    incomeReceived: number;
    incomePending: number;
    incomeTotal: number;
    expensesPaid: number;
    expensesPending: number;
    expensesTotal: number;
    fixedPaid: number;
    fixedPending: number;
    fixedTotal: number;
    debtPaid: number;
    debtPending: number;
    debtTotal: number;
    investmentsTotal: number;
    availableBalance: number;
    projectedBalance: number;
    creditCardInvoicesOpen: number;
    savingsRate: number;
    commitmentRate: number;
  };
  diagnostic: {
    status: 'positive' | 'warning' | 'negative';
    label: string;
    description: string;
    recommendation: string;
    color: string;
  };
  monthlyMatrix: MonthlyMatrixRow[];
  annualComparison: {
    dimension: string;
    planned: number;
    actual: number;
    difference: number;
    executionRate?: number;
    percentage?: number;
    tip?: string;
    strategicTip?: string;
  }[];
  categoryDistribution: {
    category: string;
    type?: string;
    totalPaid?: number;
    totalPending?: number;
    amount: number;
    percentage: number;
    color: string;
  }[];
  bankBalances: {
    bankId: string;
    bankName: string;
    initialBalance: number;
    incomes: number;
    expenses: number;
    currentBalance: number;
    color: string;
  }[];
  creditCards: {
    id: string;
    name: string;
    limitTotal: number;
    limitAvailable: number;
    dueDay: number;
    color: string;
  }[];
  goals: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color: string;
  }[];
  netWorth: NetWorthBreakdown;

  // Top-level flat compatibility properties
  incomeReceived?: number;
  incomePending?: number;
  totalIncome?: number;
  expensesPaid?: number;
  expensesPending?: number;
  totalExpenses?: number;
  fixedPaid?: number;
  fixedPending?: number;
  debtPaid?: number;
  debtPending?: number;
  investmentsTotal?: number;
  savingsTotal?: number;
  physicalAssetsTotal?: number;
  availableBalance?: number;
  projectedBalance?: number;
  totalCreditCardOpen?: number;
  totalCreditCardPaid?: number;
  savingsRate?: number;
  incomeCommitmentRate?: number;
  bankPositions?: any[];
  totalBankBalance?: number;
  cardSummaries?: any[];
  totalCardMonth?: number;
  monthlyConsolidated?: any[];
}
