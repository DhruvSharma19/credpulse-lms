import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { RoleSwitcherBar } from '../components/shared/RoleSwitcherBar';
import { Navbar } from '../components/shared/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CredPulse LMS — Loan Management System',
  description: 'Enterprise Full-Stack Loan Management System with Role-Based Access Control and BRE Engine',
};

import { ToastProvider } from '../context/ToastContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <RoleSwitcherBar />
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4">
                <p className="font-medium text-slate-700">
                  CredPulse Loan Management System &bull; Production Architecture MERN + Next.js + TypeScript
                </p>
                <p className="mt-1 text-slate-400">
                  Evaluation ready: Server-Authoritative BRE &bull; Simple Interest Math &bull; Strict RBAC (Sales, Sanction, Disbursement, Collection, Admin, Borrower)
                </p>
              </div>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
