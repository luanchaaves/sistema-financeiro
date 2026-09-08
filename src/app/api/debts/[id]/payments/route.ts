import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { amount, date, bankId, paymentMethod, installmentNumber, notes } = body;

    const paymentAmount = parseFloat(amount) || 0;
    const parsedDate = date ? parseDateInput(date) : new Date();

    const debt = await prisma.debt.findUnique({ where: { id: params.id } });
    if (!debt) return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });

    const newPaid = Math.round((debt.paidAmount + paymentAmount) * 100) / 100;
    const newRemaining = Math.max(0, Math.round((debt.originalAmount - newPaid) * 100) / 100);
    const newCurrentInstallment = installmentNumber ? parseInt(installmentNumber, 10) : debt.currentInstallment + 1;

    const [payment, updatedDebt] = await prisma.$transaction([
      prisma.debtPayment.create({
        data: {
          debtId: params.id,
          amount: paymentAmount,
          date: parsedDate,
          bankId: bankId || null,
          paymentMethod: paymentMethod || 'Pix',
          installmentNumber: newCurrentInstallment,
          notes: notes || null,
        },
      }),
      prisma.debt.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          currentAmount: newRemaining,
          currentInstallment: newCurrentInstallment,
          status: newRemaining <= 0 ? 'Paga' : 'Ativa',
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        entity: 'DebtPayment',
        entityId: payment.id,
        action: 'CREATE',
        details: `Pagamento de dívida registrado: R$ ${paymentAmount} para ${debt.name}`,
      },
    });

    return NextResponse.json({ payment, debt: updatedDebt }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar pagamento de dívida' }, { status: 500 });
  }
}
