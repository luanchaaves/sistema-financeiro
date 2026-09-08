import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMonthNameFromDate, parseDateInput, splitInstallments } from '@/lib/utils';
import { MonthName } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const purchase = await prisma.creditCardPurchase.findUnique({
      where: { id: params.id },
      include: {
        card: true,
        category: true,
        installments: { where: { deletedAt: null }, orderBy: { installmentNumber: 'asc' } },
      },
    });

    if (!purchase || purchase.deletedAt) {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar compra' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      date,
      cardId,
      categoryId,
      categoryName,
      description,
      totalAmount,
      totalInstallments,
      invoiceMonth,
      invoiceYear,
      notes,
      regenerateInstallments,
    } = body;

    const existing = await prisma.creditCardPurchase.findUnique({
      where: { id: params.id },
      include: { installments: true, card: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 });
    }

    const parsedDate = date ? parseDateInput(date) : existing.date;
    const countInstallments = totalInstallments ? parseInt(totalInstallments, 10) : existing.totalInstallments;
    const total = totalAmount !== undefined ? parseFloat(totalAmount) : existing.totalAmount;
    const startMonth = (invoiceMonth || existing.invoiceMonth) as MonthName;
    const startYear = invoiceYear ? parseInt(invoiceYear, 10) : existing.invoiceYear;
    const installmentAmt = Math.round((total / countInstallments) * 100) / 100;
    const targetCardId = cardId || existing.cardId;

    const updated = await prisma.creditCardPurchase.update({
      where: { id: params.id },
      data: {
        date: parsedDate,
        cardId: targetCardId,
        categoryId: categoryId || existing.categoryId,
        categoryName: categoryName || existing.categoryName,
        description: description || existing.description,
        totalAmount: total,
        totalInstallments: countInstallments,
        installmentAmount: installmentAmt,
        invoiceMonth: startMonth,
        invoiceYear: startYear,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    // Check if installments need to be regenerated
    const shouldRegenerate =
      regenerateInstallments ||
      countInstallments !== existing.totalInstallments ||
      total !== existing.totalAmount ||
      startMonth !== existing.invoiceMonth ||
      startYear !== existing.invoiceYear ||
      targetCardId !== existing.cardId;

    if (shouldRegenerate) {
      // Fetch target card to get dueDay
      const card = await prisma.creditCard.findUnique({ where: { id: targetCardId } });
      const dueDay = card ? card.dueDay : 10;

      // Remove previous installments
      await prisma.creditCardInstallment.deleteMany({ where: { purchaseId: params.id } });

      // Regenerate
      const generated = splitInstallments(total, countInstallments, startMonth, startYear, dueDay);

      for (const inst of generated) {
        await prisma.creditCardInstallment.create({
          data: {
            purchaseId: params.id,
            installmentNumber: inst.installmentNumber,
            totalInstallments: inst.totalInstallments,
            amount: inst.amount,
            invoiceMonth: inst.invoiceMonth,
            invoiceYear: inst.invoiceYear,
            dueDate: inst.dueDate,
            status: 'Fatura Aberta',
            notes: `Parcela ${inst.installmentNumber}/${inst.totalInstallments}`,
          },
        });
      }

      // Adjust card available limit
      if (card && total !== existing.totalAmount) {
        const diff = total - existing.totalAmount;
        const newAvailable = Math.max(0, card.limitAvailable - diff);
        await prisma.creditCard.update({
          where: { id: targetCardId },
          data: { limitAvailable: newAvailable },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCardPurchase',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Compra atualizada: ${updated.description}`,
      },
    });

    const refreshed = await prisma.creditCardPurchase.findUnique({
      where: { id: params.id },
      include: { card: true, category: true, installments: true },
    });

    return NextResponse.json(refreshed);
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json({ error: 'Erro ao atualizar compra' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.creditCardPurchase.findUnique({
      where: { id: params.id },
      include: { card: true },
    });

    if (!existing) return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 });

    // Soft delete purchase and installments
    await prisma.creditCardPurchase.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.creditCardInstallment.updateMany({
      where: { purchaseId: params.id },
      data: { deletedAt: new Date() },
    });

    // Restore card available limit
    if (existing.card) {
      const restored = existing.card.limitAvailable + existing.totalAmount;
      await prisma.creditCard.update({
        where: { id: existing.cardId },
        data: { limitAvailable: Math.min(existing.card.limitTotal, restored) },
      });
    }

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCardPurchase',
        entityId: params.id,
        action: 'DELETE',
        details: `Compra excluída: ${existing.description}`,
      },
    });

    return NextResponse.json({ message: 'Compra e parcelas excluídas com sucesso' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ error: 'Erro ao excluir compra' }, { status: 500 });
  }
}
