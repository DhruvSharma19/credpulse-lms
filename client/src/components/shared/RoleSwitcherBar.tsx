'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shield,
  ShieldAlert,
  TrendingUp,
  FileCheck,
  Banknote,
  CreditCard,
  User,
  Check
} from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { user, quickLoginAs, isLoading } = useAuth();
  const router = useRouter();

  const handleRoleSwitch = async (role: UserRole) => {
    try {
      await quickLoginAs(role);
      switch (role) {
        case UserRole.ADMIN:
          router.push('/ops/admin');
          break;
        case UserRole.SALES:
          router.push('/ops/sales');
          break;
        case UserRole.SANCTION:
          router.push('/ops/sanction');
          break;
        case UserRole.DISBURSEMENT:
          router.push('/ops/disbursement');
          break;
        case UserRole.COLLECTION:
          router.push('/ops/collection');
          break;
        case UserRole.BORROWER:
          router.push('/borrower/dashboard');
          break;
      }
    } catch {
      // Role switch error handled by authentication context
    }
  };

  const roles = [
    {
      role: UserRole.ADMIN,
      label: 'Admin',
      icon: ShieldAlert,
      activeClass: 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/40',
      idleClass: 'text-rose-300 hover:text-white hover:bg-rose-950/40 border-rose-900/50',
    },
    {
      role: UserRole.SALES,
      label: 'Sales',
      icon: TrendingUp,
      activeClass: 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/40',
      idleClass: 'text-indigo-300 hover:text-white hover:bg-indigo-950/40 border-indigo-900/50',
    },
    {
      role: UserRole.SANCTION,
      label: 'Sanction',
      icon: FileCheck,
      activeClass: 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/40',
      idleClass: 'text-amber-300 hover:text-white hover:bg-amber-950/40 border-amber-900/50',
    },
    {
      role: UserRole.DISBURSEMENT,
      label: 'Disbursement',
      icon: Banknote,
      activeClass: 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/40',
      idleClass: 'text-purple-300 hover:text-white hover:bg-purple-950/40 border-purple-900/50',
    },
    {
      role: UserRole.COLLECTION,
      label: 'Collection',
      icon: CreditCard,
      activeClass: 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40',
      idleClass: 'text-emerald-300 hover:text-white hover:bg-emerald-950/40 border-emerald-900/50',
    },
    {
      role: UserRole.BORROWER,
      label: 'Borrower',
      icon: User,
      activeClass: 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/40',
      idleClass: 'text-sky-300 hover:text-white hover:bg-sky-950/40 border-sky-900/50',
    },
  ];

  return (
    <aside aria-label="Evaluator Controls" className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Persona Controller</span>
          </div>
          <span className="hidden lg:inline text-slate-400 text-[11px] font-medium">
            1-Click Role Switcher:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-0.5 sm:flex-wrap">
          {roles.map((r) => {
            const isActive = user?.role === r.role;
            const Icon = r.icon;
            return (
              <button
                key={r.role}
                onClick={() => handleRoleSwitch(r.role)}
                disabled={isLoading}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 flex items-center space-x-1.5 cursor-pointer border hover-lift ${
                  isActive
                    ? r.activeClass
                    : `bg-slate-900/80 ${r.idleClass}`
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{r.label}</span>
                {isActive && (
                  <Check className="w-3 h-3 text-white ml-0.5 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {user && (
          <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-800 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[120px] font-medium text-slate-300">{user.name}</span>
            <span className="font-mono text-slate-500 text-[10px] uppercase tracking-wider">({user.role})</span>
          </div>
        )}
      </div>
    </aside>
  );
};
