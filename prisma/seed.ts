import { PrismaClient } from '@prisma/client';

type MonthName =
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

const MONTHS: MonthName[] = [
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

function getMonthIndex(monthName: string): number {
  const idx = MONTHS.findIndex((m) => m.toLowerCase() === monthName.toLowerCase().trim());
  return idx >= 0 ? idx : 0;
}

function getNextMonth(monthName: string, year: number, offset: number = 1): { month: MonthName; year: number } {
  const currentIdx = getMonthIndex(monthName);
  const totalMonths = currentIdx + offset;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonthIdx = ((totalMonths % 12) + 12) % 12;
  return {
    month: MONTHS[newMonthIdx],
    year: newYear,
  };
}

function splitInstallments(
  totalAmount: number,
  totalInstallments: number,
  startMonth: MonthName,
  startYear: number,
  dueDay: number = 10
) {
  const installmentsCount = Math.max(1, Math.floor(totalInstallments));
  const rawBase = Math.floor((totalAmount / installmentsCount) * 100) / 100;
  const remaining = Math.round((totalAmount - rawBase * installmentsCount) * 100) / 100;

  const result = [];

  for (let i = 1; i <= installmentsCount; i++) {
    const { month, year } = getNextMonth(startMonth, startYear, i - 1);
    const monthIdx = getMonthIndex(month);

    let installmentAmt = rawBase;
    if (i === 1 && remaining !== 0) {
      installmentAmt = Math.round((installmentAmt + remaining) * 100) / 100;
    }

    const safeDay = Math.min(dueDay, 28);
    const dueDate = new Date(year, monthIdx, safeDay, 12, 0, 0);

    result.push({
      installmentNumber: i,
      totalInstallments: installmentsCount,
      amount: installmentAmt,
      invoiceMonth: month,
      invoiceYear: year,
      dueDate,
    });
  }

  return result;
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando banco de dados com dados de demonstração (Demo Showcase)...');

  // 1. Limpeza do banco de dados
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.financialGoal.deleteMany();
  await prisma.investmentTransaction.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.debtPayment.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.creditCardInstallment.deleteMany();
  await prisma.creditCardPurchase.deleteMany();
  await prisma.creditCardInvoice.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.fixedExpense.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.bank.deleteMany();

  console.log('🧹 Banco limpo com sucesso.');

  // 2. Bancos / Instituições
  const nubank = await prisma.bank.create({
    data: {
      name: 'Nubank',
      type: 'CHECKING',
      initialBalance: 3850.0,
      color: '#8a05be',
      icon: 'Building2',
    },
  });

  const itau = await prisma.bank.create({
    data: {
      name: 'Itaú',
      type: 'CHECKING',
      initialBalance: 2200.0,
      color: '#ec7000',
      icon: 'Building2',
    },
  });

  const inter = await prisma.bank.create({
    data: {
      name: 'Banco Inter',
      type: 'INVESTMENT',
      initialBalance: 1500.0,
      color: '#f97316',
      icon: 'Landmark',
    },
  });

  const carteira = await prisma.bank.create({
    data: {
      name: 'Carteira Física',
      type: 'WALLET',
      initialBalance: 350.0,
      color: '#22c55e',
      icon: 'Wallet',
    },
  });

  // 3. Categorias
  const incomeCategories = [
    { name: 'Salário CLT', type: 'INCOME', color: '#10b981', icon: 'Briefcase' },
    { name: 'Consultoria PJ', type: 'INCOME', color: '#3b82f6', icon: 'Building' },
    { name: 'Freelance & Projetos', type: 'INCOME', color: '#8b5cf6', icon: 'Laptop' },
    { name: 'Rendimentos & Dividendos', type: 'INCOME', color: '#22c55e', icon: 'TrendingUp' },
    { name: 'Reembolsos', type: 'INCOME', color: '#06b6d4', icon: 'Receipt' },
    { name: 'Outras Rendas', type: 'INCOME', color: '#64748b', icon: 'HelpCircle' },
  ];

  const expenseCategories = [
    { name: 'Supermercado & Feira', type: 'EXPENSE', color: '#eab308', icon: 'ShoppingCart' },
    { name: 'Alimentação & Restaurantes', type: 'EXPENSE', color: '#f97316', icon: 'Utensils' },
    { name: 'Combustível & Mobilidade', type: 'EXPENSE', color: '#ef4444', icon: 'Fuel' },
    { name: 'Saúde & Farmácia', type: 'EXPENSE', color: '#06b6d4', icon: 'HeartPulse' },
    { name: 'Lazer & Viagens', type: 'EXPENSE', color: '#a855f7', icon: 'Smile' },
    { name: 'Educação & Livros', type: 'EXPENSE', color: '#3b82f6', icon: 'GraduationCap' },
    { name: 'Pet Care', type: 'EXPENSE', color: '#14b8a6', icon: 'Dog' },
    { name: 'Assinaturas & Softwares', type: 'EXPENSE', color: '#ec4899', icon: 'Tv' },
    { name: 'Manutenção & Casa', type: 'EXPENSE', color: '#64748b', icon: 'Wrench' },
    { name: 'Outros Gastos', type: 'EXPENSE', color: '#94a3b8', icon: 'Tag' },
  ];

  const fixedCategories = [
    { name: 'Aluguel & Condomínio', type: 'FIXED', color: '#ef4444', icon: 'Home' },
    { name: 'Internet Fibra', type: 'FIXED', color: '#3b82f6', icon: 'Wifi' },
    { name: 'Energia Elétrica', type: 'FIXED', color: '#eab308', icon: 'Zap' },
    { name: 'Água & Saneamento', type: 'FIXED', color: '#06b6d4', icon: 'Droplets' },
    { name: 'Seguro Auto', type: 'FIXED', color: '#6366f1', icon: 'ShieldCheck' },
    { name: 'Plano de Saúde', type: 'FIXED', color: '#10b981', icon: 'Heart' },
    { name: 'Faculdade / Especialização', type: 'FIXED', color: '#8b5cf6', icon: 'BookOpen' },
  ];

  const debtCategories = [
    { name: 'Financiamento Veicular', type: 'DEBT', color: '#f59e0b', icon: 'Car' },
    { name: 'Crédito Imobiliário', type: 'DEBT', color: '#dc2626', icon: 'Home' },
    { name: 'Fatura de Cartão', type: 'DEBT', color: '#8a05be', icon: 'CreditCard' },
  ];

  const investmentCategories = [
    { name: 'Reserva de Emergência', type: 'INVESTMENT', color: '#10b981', icon: 'ShieldAlert' },
    { name: 'Tesouro Direto / Renda Fixa', type: 'INVESTMENT', color: '#3b82f6', icon: 'Landmark' },
    { name: 'Fundos Imobiliários (FIIs)', type: 'INVESTMENT', color: '#a855f7', icon: 'LineChart' },
    { name: 'Ações & ETFs Globais', type: 'INVESTMENT', color: '#22c55e', icon: 'TrendingUp' },
    { name: 'Criptoativos', type: 'INVESTMENT', color: '#f59e0b', icon: 'Coins' },
  ];

  const catMap: Record<string, string> = {};

  for (const cat of [
    ...incomeCategories,
    ...expenseCategories,
    ...fixedCategories,
    ...debtCategories,
    ...investmentCategories,
  ]) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
      },
    });
    catMap[cat.name] = created.id;
  }

  // 4. Cartões de Crédito
  const cardNubank = await prisma.creditCard.create({
    data: {
      name: 'Nubank Ultravioleta',
      bankId: nubank.id,
      bankName: 'Nubank',
      limitTotal: 15000.0,
      limitAvailable: 11250.0,
      closingDay: 28,
      dueDay: 5,
      color: '#8a05be',
      brand: 'Mastercard',
    },
  });

  const cardItau = await prisma.creditCard.create({
    data: {
      name: 'Itaú Personalité Visa Infinite',
      bankId: itau.id,
      bankName: 'Itaú',
      limitTotal: 25000.0,
      limitAvailable: 23400.0,
      closingDay: 20,
      dueDay: 27,
      color: '#ec7000',
      brand: 'Visa',
    },
  });

  // 5. Rendas de Demonstração (2026 - Agosto e Setembro)
  const sampleIncomes = [
    {
      date: new Date('2026-08-01T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Salário CLT',
      categoryName: 'Salário CLT',
      description: 'Salário Tech Lead / Desenvolvedor',
      amount: 8500.0,
      status: 'Recebido',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Remuneração mensal fixa',
    },
    {
      date: new Date('2026-08-15T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Consultoria PJ',
      categoryName: 'Consultoria PJ',
      description: 'Consultoria em Arquitetura de Software',
      amount: 3200.0,
      status: 'Recebido',
      paymentMethod: 'Pix',
      bankId: inter.id,
      bankName: 'Banco Inter',
      notes: 'Projeto clientes corporativos',
    },
    {
      date: new Date('2026-08-20T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Rendimentos & Dividendos',
      categoryName: 'Rendimentos & Dividendos',
      description: 'Proventos FIIs (HGLG11 + KNCR11)',
      amount: 285.5,
      status: 'Recebido',
      paymentMethod: 'Depósito',
      bankId: inter.id,
      bankName: 'Banco Inter',
      notes: 'Dividendos isentos de IR',
    },
    {
      date: new Date('2026-09-01T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Salário CLT',
      categoryName: 'Salário CLT',
      description: 'Salário Tech Lead / Desenvolvedor',
      amount: 8500.0,
      status: 'Recebido',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Salário mensal',
    },
    {
      date: new Date('2026-09-05T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Freelance & Projetos',
      categoryName: 'Freelance & Projetos',
      description: 'Desenvolvimento Web Landing Page',
      amount: 1800.0,
      status: 'Recebido',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Projeto Fullstack',
    },
    {
      date: new Date('2026-09-15T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Rendimentos & Dividendos',
      categoryName: 'Rendimentos & Dividendos',
      description: 'Rendimentos Renda Fixa e FIIs',
      amount: 320.0,
      status: 'Não recebido',
      paymentMethod: 'Depósito',
      bankId: inter.id,
      bankName: 'Banco Inter',
      notes: 'Previsão de crédito dia 15',
    },
  ];

  for (const inc of sampleIncomes) {
    await prisma.income.create({
      data: {
        ...inc,
        categoryId: catMap[inc.categoryName] || null,
      },
    });
  }

  // 6. Despesas Variáveis e Fixas Realizadas
  const sampleExpenses = [
    {
      date: new Date('2026-08-05T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Aluguel & Condomínio',
      description: 'Aluguel Apartamento',
      amount: 2200.0,
      status: 'Pago',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Locação residencial',
    },
    {
      date: new Date('2026-08-05T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Energia Elétrica',
      description: 'Conta de Luz',
      amount: 245.0,
      status: 'Pago',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Enel / Equatorial',
    },
    {
      date: new Date('2026-08-10T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Internet Fibra',
      description: 'Internet Fibra 600 Mega',
      amount: 119.9,
      status: 'Pago',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Banda Larga',
    },
    {
      date: new Date('2026-08-15T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Poupança/Investimento',
      categoryName: 'Reserva de Emergência',
      description: 'Aporte Mensal Reserva Selic',
      amount: 1500.0,
      status: 'Pago',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Planejamento 20% da renda',
    },
    {
      date: new Date('2026-08-18T12:00:00Z'),
      month: 'Agosto',
      year: 2026,
      type: 'Despesa',
      categoryName: 'Supermercado & Feira',
      description: 'Compras do Mês Pão de Açúcar',
      amount: 1150.0,
      status: 'Pago',
      paymentMethod: 'Cartão',
      bankId: itau.id,
      bankName: 'Itaú',
      notes: 'Alimentação e limpeza',
    },
    {
      date: new Date('2026-09-01T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Aluguel & Condomínio',
      description: 'Aluguel Apartamento',
      amount: 2200.0,
      status: 'Pago',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Aluguel Setembro',
    },
    {
      date: new Date('2026-09-02T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Energia Elétrica',
      description: 'Conta de Luz',
      amount: 260.0,
      status: 'Pago',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Energia',
    },
    {
      date: new Date('2026-09-03T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Internet Fibra',
      description: 'Internet Fibra',
      amount: 119.9,
      status: 'Pago',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Fibra',
    },
    {
      date: new Date('2026-09-05T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Despesa',
      categoryName: 'Supermercado & Feira',
      description: 'Supermercado Mensal',
      amount: 980.0,
      status: 'Pago',
      paymentMethod: 'Cartão',
      bankId: itau.id,
      bankName: 'Itaú',
      notes: 'Mercado',
    },
    {
      date: new Date('2026-09-10T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Dívida',
      categoryName: 'Financiamento Veicular',
      description: 'Parcela Veículo Honda Civic',
      amount: 1250.0,
      status: 'A pagar',
      paymentMethod: 'Pix',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Parcela 12/36',
    },
    {
      date: new Date('2026-09-15T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Seguro Auto',
      description: 'Seguro Auto Porto Seguro',
      amount: 280.0,
      status: 'A pagar',
      paymentMethod: 'Cartão',
      bankId: itau.id,
      bankName: 'Itaú',
      notes: 'Cobertura total',
    },
    {
      date: new Date('2026-09-20T12:00:00Z'),
      month: 'Setembro',
      year: 2026,
      type: 'Conta Fixa',
      categoryName: 'Faculdade / Especialização',
      description: 'Pós-Graduação Arquitetura Cloud',
      amount: 850.0,
      status: 'A pagar',
      paymentMethod: 'Boleto',
      bankId: nubank.id,
      bankName: 'Nubank',
      notes: 'Especialização',
    },
  ];

  for (const exp of sampleExpenses) {
    await prisma.expense.create({
      data: {
        ...exp,
        categoryId: catMap[exp.categoryName] || null,
      },
    });
  }

  // 7. Contas Fixas Recorrentes
  const recurringRules = [
    {
      name: 'Aluguel & Condomínio',
      categoryName: 'Aluguel & Condomínio',
      amount: 2200.0,
      dueDay: 5,
      frequency: 'Mensal',
      notes: 'Locação residencial',
    },
    {
      name: 'Internet Fibra 600M',
      categoryName: 'Internet Fibra',
      amount: 119.9,
      dueDay: 10,
      frequency: 'Mensal',
      notes: 'Provedor Fibra',
    },
    {
      name: 'Conta de Energia',
      categoryName: 'Energia Elétrica',
      amount: 250.0,
      dueDay: 12,
      frequency: 'Mensal',
      notes: 'Estimativa média',
    },
    {
      name: 'Água e Saneamento',
      categoryName: 'Água & Saneamento',
      amount: 85.0,
      dueDay: 15,
      frequency: 'Mensal',
      notes: 'Concessionária de Água',
    },
    {
      name: 'Seguro Auto',
      categoryName: 'Seguro Auto',
      amount: 280.0,
      dueDay: 20,
      frequency: 'Mensal',
      notes: 'Porto Seguro Cobertura Completa',
    },
    {
      name: 'Pós-Graduação Cloud',
      categoryName: 'Faculdade / Especialização',
      amount: 850.0,
      dueDay: 25,
      frequency: 'Mensal',
      notes: 'Especialização Engenharia de Software',
    },
  ];

  for (const r of recurringRules) {
    await prisma.fixedExpense.create({
      data: {
        name: r.name,
        categoryName: r.categoryName,
        categoryId: catMap[r.categoryName] || null,
        amount: r.amount,
        dueDay: r.dueDay,
        frequency: r.frequency,
        bankId: nubank.id,
        bankName: 'Nubank',
        paymentMethod: 'Pix',
        notes: r.notes,
      },
    });
  }

  // 8. Compras Parceladas no Cartão
  const samplePurchases = [
    {
      date: new Date('2026-07-10T12:00:00Z'),
      cardId: cardNubank.id,
      categoryName: 'Manutenção & Casa',
      description: 'Cadeira Ergonômica Herman Miller',
      totalAmount: 4800.0,
      totalInstallments: 10,
      currentInstallment: 3,
      installmentAmount: 480.0,
      invoiceMonth: 'Agosto',
      invoiceYear: 2026,
      notes: 'Setup Home Office',
    },
    {
      date: new Date('2026-08-05T12:00:00Z'),
      cardId: cardNubank.id,
      categoryName: 'Assinaturas & Softwares',
      description: 'ChatGPT Plus Anual',
      totalAmount: 1200.0,
      totalInstallments: 6,
      currentInstallment: 2,
      installmentAmount: 200.0,
      invoiceMonth: 'Agosto',
      invoiceYear: 2026,
      notes: 'Ferramentas de IA',
    },
    {
      date: new Date('2026-08-20T12:00:00Z'),
      cardId: cardNubank.id,
      categoryName: 'Assinaturas & Softwares',
      description: 'Spotify Premium Family',
      totalAmount: 34.9,
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmount: 34.9,
      invoiceMonth: 'Agosto',
      invoiceYear: 2026,
      notes: 'Streaming de Música',
    },
    {
      date: new Date('2026-09-02T12:00:00Z'),
      cardId: cardNubank.id,
      categoryName: 'Alimentação & Restaurantes',
      description: 'Jantar Restaurante Japonês',
      totalAmount: 215.0,
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmount: 215.0,
      invoiceMonth: 'Setembro',
      invoiceYear: 2026,
      notes: 'Lazer & Gastronomia',
    },
    {
      date: new Date('2026-09-04T12:00:00Z'),
      cardId: cardNubank.id,
      categoryName: 'Manutenção & Casa',
      description: 'Monitor Dell UltraWide 34"',
      totalAmount: 3500.0,
      totalInstallments: 10,
      currentInstallment: 1,
      installmentAmount: 350.0,
      invoiceMonth: 'Setembro',
      invoiceYear: 2026,
      notes: 'Monitor Produtividade',
    },
  ];

  for (const pur of samplePurchases) {
    const createdPurchase = await prisma.creditCardPurchase.create({
      data: {
        date: pur.date,
        cardId: pur.cardId,
        categoryId: catMap[pur.categoryName] || null,
        categoryName: pur.categoryName,
        description: pur.description,
        totalAmount: pur.totalAmount,
        totalInstallments: pur.totalInstallments,
        currentInstallment: pur.currentInstallment,
        installmentAmount: pur.installmentAmount,
        invoiceMonth: pur.invoiceMonth,
        invoiceYear: pur.invoiceYear,
        notes: pur.notes,
      },
    });

    const generated = splitInstallments(
      pur.totalAmount,
      pur.totalInstallments,
      pur.invoiceMonth as MonthName,
      pur.invoiceYear,
      5
    );

    for (const inst of generated) {
      const isPaid = inst.invoiceMonth === 'Agosto' && inst.invoiceYear === 2026;
      await prisma.creditCardInstallment.create({
        data: {
          purchaseId: createdPurchase.id,
          installmentNumber: inst.installmentNumber,
          totalInstallments: inst.totalInstallments,
          amount: inst.amount,
          invoiceMonth: inst.invoiceMonth,
          invoiceYear: inst.invoiceYear,
          dueDate: inst.dueDate,
          status: isPaid ? 'Fatura Paga' : 'Fatura Aberta',
          notes: `Parcela ${inst.installmentNumber}/${inst.totalInstallments}`,
        },
      });
    }
  }

  // 9. Dívidas e Financiamentos
  await prisma.debt.create({
    data: {
      name: 'Financiamento Honda Civic Touring',
      creditor: 'Banco Santander',
      originalAmount: 45000.0,
      currentAmount: 30000.0,
      paidAmount: 15000.0,
      remainingAmount: 30000.0,
      totalInstallments: 36,
      currentInstallment: 12,
      installmentAmount: 1250.0,
      interestRate: 1.15,
      startDate: new Date('2025-09-10T12:00:00Z'),
      dueDate: new Date('2028-09-10T12:00:00Z'),
      status: 'Ativa',
      notes: 'Financiamento com taxa prefixada reduzida',
    },
  });

  // 10. Investimentos & Reserva de Emergência
  const invReserva = await prisma.investment.create({
    data: {
      name: 'Tesouro Selic 2029 (Reserva de Emergência)',
      type: 'Reserva de Emergência',
      institution: 'Nubank / NuInvest',
      appliedAmount: 20000.0,
      currentAmount: 21850.0,
      yieldRate: 10.75,
      yieldAmount: 1850.0,
      isEmergencyFund: true,
      notes: 'Liquidez D+0 para emergências (6 meses de custo fixo)',
    },
  });

  await prisma.investmentTransaction.create({
    data: {
      investmentId: invReserva.id,
      type: 'Aporte',
      amount: 1500.0,
      date: new Date('2026-08-15T12:00:00Z'),
      notes: 'Aporte mensal planejado',
    },
  });

  await prisma.investment.create({
    data: {
      name: 'Carteira de Fundos Imobiliários (HGLG11 / KNCR11 / XPML11)',
      type: 'Fundos Imobiliários (FIIs)',
      institution: 'Banco Inter',
      appliedAmount: 18000.0,
      currentAmount: 19450.0,
      yieldRate: 11.2,
      yieldAmount: 1450.0,
      isEmergencyFund: false,
      notes: 'Geração de renda passiva mensal isenta de IR',
    },
  });

  await prisma.investment.create({
    data: {
      name: 'ETFs Globais (WRLD11 & IVVB11)',
      type: 'Ações & ETFs Globais',
      institution: 'Banco Inter',
      appliedAmount: 12000.0,
      currentAmount: 13900.0,
      yieldRate: 15.8,
      yieldAmount: 1900.0,
      isEmergencyFund: false,
      notes: 'Exposição cambial em dólar e mercado global',
    },
  });

  // 11. Metas Financeiras
  await prisma.financialGoal.create({
    data: {
      name: 'Reserva de Emergência (6 Meses)',
      category: 'Reserva',
      targetAmount: 30000.0,
      currentAmount: 21850.0,
      deadline: new Date('2027-06-30T12:00:00Z'),
      color: '#10b981',
      icon: 'ShieldAlert',
      notes: 'Garantir colchão de segurança e tranquilidade financeira',
    },
  });

  await prisma.financialGoal.create({
    data: {
      name: 'Viagem de Férias Europa',
      category: 'Lazer & Viagem',
      targetAmount: 25000.0,
      currentAmount: 16500.0,
      deadline: new Date('2027-10-15T12:00:00Z'),
      color: '#3b82f6',
      icon: 'Plane',
      notes: 'Férias de 20 dias na Itália e Portugal',
    },
  });

  await prisma.financialGoal.create({
    data: {
      name: 'Quitação Antecipada do Veículo',
      category: 'Dívidas',
      targetAmount: 30000.0,
      currentAmount: 15000.0,
      deadline: new Date('2027-12-31T12:00:00Z'),
      color: '#f59e0b',
      icon: 'Car',
      notes: 'Amortizar parcelas finais com desconto de juros futuros',
    },
  });

  // 12. Orçamentos Planejados (Budgets)
  const sampleBudgets = [
    { dimension: 'Despesa', categoryName: 'Supermercado & Feira', plannedAmount: 1200.0, year: 2026, month: 'Setembro' },
    { dimension: 'Despesa', categoryName: 'Alimentação & Restaurantes', plannedAmount: 600.0, year: 2026, month: 'Setembro' },
    { dimension: 'Despesa', categoryName: 'Combustível & Mobilidade', plannedAmount: 450.0, year: 2026, month: 'Setembro' },
    { dimension: 'Despesa', categoryName: 'Lazer & Viagens', plannedAmount: 500.0, year: 2026, month: 'Setembro' },
    { dimension: 'Conta Fixa', categoryName: 'Aluguel & Condomínio', plannedAmount: 2200.0, year: 2026, month: 'Setembro' },
    { dimension: 'Conta Fixa', categoryName: 'Energia Elétrica', plannedAmount: 260.0, year: 2026, month: 'Setembro' },
    { dimension: 'Conta Fixa', categoryName: 'Internet Fibra', plannedAmount: 120.0, year: 2026, month: 'Setembro' },
    { dimension: 'Conta Fixa', categoryName: 'Faculdade / Especialização', plannedAmount: 850.0, year: 2026, month: 'Setembro' },
    { dimension: 'Dívida', categoryName: 'Financiamento Veicular', plannedAmount: 1250.0, year: 2026, month: 'Setembro' },
    { dimension: 'Investimento', categoryName: 'Reserva de Emergência', plannedAmount: 1500.0, year: 2026, month: 'Setembro' },
  ];

  for (const b of sampleBudgets) {
    await prisma.budget.create({
      data: {
        dimension: b.dimension,
        categoryName: b.categoryName,
        categoryId: catMap[b.categoryName] || null,
        plannedAmount: b.plannedAmount,
        year: b.year,
        month: b.month,
      },
    });
  }

  // 13. Patrimônio & Bens Físicos
  const sampleAssets = [
    {
      name: 'Honda Civic Touring 1.5 Turbo',
      type: 'VEICULO',
      category: 'Veículo',
      estimatedValue: 135000.0,
      purchaseValue: 145000.0,
      purchaseDate: new Date('2023-08-15'),
      brand: 'Honda',
      modelYear: 2023,
      color: '#38bdf8',
      icon: 'Car',
      notes: 'Sedan Premium • Bancos de Couro • Teto Solar • Revisões em dia',
    },
    {
      name: 'MacBook Pro M3 Max 16"',
      type: 'ELETRONICO',
      category: 'Eletrônico',
      estimatedValue: 19500.0,
      purchaseValue: 23000.0,
      purchaseDate: new Date('2024-04-10'),
      brand: 'Apple',
      modelYear: 2024,
      color: '#a855f7',
      icon: 'Laptop',
      notes: '36GB RAM • 1TB SSD • Space Black • Estação de Trabalho Principal',
    },
    {
      name: 'Setup Workstation & Home Office',
      type: 'EQUIPAMENTO',
      category: 'Equipamento',
      estimatedValue: 12500.0,
      purchaseValue: 15000.0,
      purchaseDate: new Date('2024-01-20'),
      brand: 'Dell / Herman Miller',
      modelYear: 2024,
      color: '#10b981',
      icon: 'Monitor',
      notes: 'Monitor UltraWide 34", Cadeira Ergonômica, Mesa Elétrica com Regulagem de Altura',
    },
    {
      name: 'iPhone 15 Pro Max 256GB',
      type: 'ELETRONICO',
      category: 'Eletrônico',
      estimatedValue: 7400.0,
      purchaseValue: 9200.0,
      purchaseDate: new Date('2023-11-20'),
      brand: 'Apple',
      modelYear: 2023,
      color: '#f59e0b',
      icon: 'Smartphone',
      notes: 'Titanium Natural • Smartphone Pessoal',
    },
  ];

  for (const a of sampleAssets) {
    await prisma.asset.create({ data: a });
  }

  // 14. Notificações do Sistema
  await prisma.notification.create({
    data: {
      title: 'Fatura Aberta do Cartão',
      message: 'A fatura do cartão Nubank Ultravioleta para Setembro está em R$ 799,90.',
      type: 'info',
      isRead: false,
      link: '/cartoes',
    },
  });

  await prisma.notification.create({
    data: {
      title: 'Meta de Investimento Atingida',
      message: 'Sua Reserva de Emergência já superou 72,8% do objetivo total planejado!',
      type: 'success',
      isRead: false,
      link: '/investimentos',
    },
  });

  await prisma.notification.create({
    data: {
      title: 'Contas Fixas a Vencer',
      message: 'Você possui parcelas e contas programadas para vencer nos próximos 10 dias.',
      type: 'warning',
      isRead: false,
      link: '/contas-fixas',
    },
  });

  console.log('✅ Base de dados de demonstração populada com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
