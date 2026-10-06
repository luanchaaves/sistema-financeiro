import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMonthIndex } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fixedExpenseId,
      month,
      year,
      action = 'PAY', // 'PAY' | 'UNPAY'
      amount,
      bankName,
      bankId,
      paymentMethod,
      date,
    } = body;

    if (!fixedExpenseId || !month || !year) {
      return NextResponse.json(
        { error: 'fixedExpenseId, month e year são obrigatórios' },
        { status: 400 }
      );
    }

    const fixed = await prisma.fixedExpense.findUnique({
      where: { id: fixedExpenseId },
    });

    if (!fixed) {
      return NextResponse.json({ error: 'Conta fixa não encontrada' }, { status: 404 });
    }

    const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

    // Check if an expense already exists for this fixed expense in this month
    const existing = await prisma.expense.findFirst({
      where: {
        deletedAt: null,
        month,
        year: yearNum,
        type: 'Conta Fixa',
        OR: [
          { recurringId: fixed.id },
          { description: fixed.name },
          { categoryName: fixed.categoryName },
        ],
      },
    });

    if (action === 'UNPAY') {
      if (existing) {
        // Soft delete the expense record so it returns to being automatically projected as pending
        await prisma.expense.update({
          where: { id: existing.id },
          data: { deletedAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            entity: 'FixedExpense',
            entityId: fixed.id,
            action: 'UPDATE',
            details: `Pagamento da conta fixa desfeito: ${fixed.name} (${month}/${yearNum})`,
          },
        });
      }

      return NextResponse.json({ success: true, message: 'Pagamento desfeito com sucesso' });
    }

    // action === 'PAY'
    const finalAmount = amount !== undefined && amount !== null && amount !== '' ? parseFloat(amount) : fixed.amount;
    const finalBankName = bankName || fixed.bankName || 'Nubank';
    const finalBankId = bankId || fixed.bankId || null;
    const finalPaymentMethod = paymentMethod || fixed.paymentMethod || 'Pix';
    const monthIdx = getMonthIndex(month);
    const finalDate = date ? new Date(date) : new Date(yearNum, monthIdx, Math.min(fixed.dueDay || 1, 28), 12, 0, 0);

    let expense;
    if (existing) {
      expense = await prisma.expense.update({
        where: { id: existing.id },
        data: {
          status: 'Pago',
          amount: finalAmount,
          bankName: finalBankName,
          bankId: finalBankId,
          paymentMethod: finalPaymentMethod,
          date: finalDate,
          isRecurring: true,
          recurringId: fixed.id,
        },
      });
    } else {
      expense = await prisma.expense.create({
        data: {
          description: fixed.name,
          amount: finalAmount,
          type: 'Conta Fixa',
          categoryId: fixed.categoryId,
          categoryName: fixed.categoryName,
          bankId: finalBankId,
          bankName: finalBankName,
          paymentMethod: finalPaymentMethod,
          status: 'Pago',
          month,
          year: yearNum,
          date: finalDate,
          isRecurring: true,
          recurringId: fixed.id,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        entity: 'Expense',
        entityId: expense.id,
        action: 'PAY',
        details: `Conta fixa paga: ${fixed.name} - R$ ${finalAmount} (${month}/${yearNum})`,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Error paying fixed expense:', error);
    return NextResponse.json({ error: 'Erro ao processar pagamento da conta fixa' }, { status: 500 });
  }
}
