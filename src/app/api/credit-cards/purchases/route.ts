import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMonthNameFromDate, parseDateInput, splitInstallments } from '@/lib/utils';
import { MonthName } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const invoiceMonth = searchParams.get('month');
    const invoiceYear = searchParams.get('year');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {
      deletedAt: null,
    };

    if (cardId && cardId !== 'TODOS') where.cardId = cardId;
    if (invoiceMonth && invoiceMonth !== 'TODOS') where.invoiceMonth = invoiceMonth;
    if (invoiceYear && invoiceYear !== 'TODOS') where.invoiceYear = parseInt(invoiceYear, 10);
    if (category && category !== 'TODOS') where.categoryName = category;
    if (status && status !== 'TODOS') where.status = status;

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { categoryName: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const purchases = await prisma.creditCardPurchase.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        card: true,
        category: true,
        installments: {
          where: { deletedAt: null },
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Erro ao buscar compras de cartão' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    } = body;

    const parsedDate = date ? parseDateInput(date) : new Date();
    const countInstallments = Math.max(1, parseInt(totalInstallments, 10) || 1);
    const total = parseFloat(totalAmount) || 0;
    const startMonth = (invoiceMonth || getMonthNameFromDate(parsedDate)) as MonthName;
    const startYear = invoiceYear ? parseInt(invoiceYear, 10) : parsedDate.getFullYear();

    // Fetch card details for dueDay
    const card = await prisma.creditCard.findUnique({ where: { id: cardId } });
    const dueDay = card ? card.dueDay : 10;

    const installmentAmt = Math.round((total / countInstallments) * 100) / 100;

    const purchase = await prisma.creditCardPurchase.create({
      data: {
        date: parsedDate,
        cardId,
        categoryId: categoryId || null,
        categoryName: categoryName || 'Outros',
        description: description || 'Compra no cartão',
        totalAmount: total,
        totalInstallments: countInstallments,
        currentInstallment: 1,
        installmentAmount: installmentAmt,
        invoiceMonth: startMonth,
        invoiceYear: startYear,
        notes: notes || null,
        status: 'Fatura Aberta',
      },
    });

    // Generate installments
    const generated = splitInstallments(total, countInstallments, startMonth, startYear, dueDay);

    for (const inst of generated) {
      await prisma.creditCardInstallment.create({
        data: {
          purchaseId: purchase.id,
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

    // Update card available limit
    if (card) {
      const newAvailable = Math.max(0, card.limitAvailable - total);
      await prisma.creditCard.update({
        where: { id: cardId },
        data: { limitAvailable: Math.round(newAvailable * 100) / 100 },
      });
    }

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCardPurchase',
        entityId: purchase.id,
        action: 'CREATE',
        details: `Compra cadastrada: ${purchase.description} (${countInstallments}x de R$ ${installmentAmt})`,
      },
    });

    const fullPurchase = await prisma.creditCardPurchase.findUnique({
      where: { id: purchase.id },
      include: { card: true, category: true, installments: true },
    });

    return NextResponse.json(fullPurchase, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar compra' }, { status: 500 });
  }
}
