import type { Metadata } from 'next';
import './globals.css';
import { FinancialProvider } from '@/context/FinancialContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { QuickActionModal } from '@/components/layout/QuickActionModal';

export const metadata: Metadata = {
  title: 'Finanças PRO | Sistema de Controle Financeiro Pessoal',
  description: 'Gestão financeira completa com dashboards, cartões de crédito, fluxo de caixa e inteligência financeira.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-navy-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-sky-500 selection:text-white">
        <FinancialProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
              <Header />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
          <QuickActionModal />
        </FinancialProvider>
      </body>
    </html>
  );
}
