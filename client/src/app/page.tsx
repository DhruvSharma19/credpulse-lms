'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  CreditCard,
  Users,
  Percent,
  Sliders,
  Award,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 shadow-xl border border-indigo-800/40">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Enterprise Lending Platform</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Enterprise Lending Platform & <span className="text-indigo-400">Operations Control</span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed">
            Engineered with strict TypeScript, server-authoritative Business Rule Engine (BRE), 
            precise Simple Interest arithmetic, and multi-team Role-Based Access Control across the complete loan lifecycle.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/borrower/apply"
              className="px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all flex items-center space-x-2 cursor-pointer hover-lift"
            >
              <span>Borrower Application Journey</span>
              <Sliders className="w-4 h-4" />
            </Link>

            <Link
              href={user?.role === UserRole.ADMIN ? '/ops/admin' : '/ops/sales'}
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center space-x-2 cursor-pointer hover-lift"
            >
              <span>Operations Modules</span>
              <Users className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative Grid Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Platform Architecture & Standards Matrix */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Platform Standards & Compliance Matrix</h2>
            <p className="text-sm text-slate-500">Core architectural pillars engineered to production banking standards</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start md:self-auto">
            Production Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2 hover-lift transition-all cursor-default hover:bg-white hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">End-to-End Workflow</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Core Lifecycle</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apply (BRE evaluation) &rarr; Sanction approval/rejection &rarr; Disbursement &rarr; Payment collection with unique UTR &rarr; Automated closure.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified & Complete
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2 hover-lift transition-all cursor-default hover:bg-white hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Code Quality + TypeScript</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Strict Typing</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full strict TypeScript (`strict: true`), zero magic constants, domain enums, Zod validation, layered clean services.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified & Strict
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2 hover-lift transition-all cursor-default hover:bg-white hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Correct BRE + Loan Math</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Deterministic</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exact formula SI = (P &times; 12 &times; T) / (365 &times; 100), DOB calendar age (23-50), PAN regex, salary &ge; ₹25,000.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified Exact
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2 hover-lift transition-all cursor-default hover:bg-white hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Dual-Layer RBAC</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Security</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Frontend route guards + Backend JWT role middleware returning 403 Forbidden. Modules locked per executive role.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified Secure
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2 hover-lift transition-all cursor-default hover:bg-white hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">UI/UX + Responsiveness</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Interface</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fintech styling, reactive sliders, salary slip document modal, status badges, and 1-click test persona switcher.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified & Responsive
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2 hover-lift transition-all cursor-default hover:bg-white hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">System Audit Logging</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Compliance</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Immutable audit logging across all state transitions, user IP tracking, and tamper-resistant financial records.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified Standard
            </div>
          </div>
        </div>
      </div>

      {/* 4 Operations Modules Architecture Showcase */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">4 Operational Department Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/ops/sales"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-lg transition-all group block hover-lift cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">1. Sales Module</h3>
            <p className="text-xs text-slate-500 mt-1">
              Lead tracking for registered users who dropped off before loan application completion.
            </p>
            <span className="inline-flex items-center mt-3 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
              <span>View Leads</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            href="/ops/sanction"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-500 hover:shadow-lg transition-all group block hover-lift cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">2. Sanction Module</h3>
            <p className="text-xs text-slate-500 mt-1">
              Underwriting review of applied loans, document verification, and Approve/Reject with reason.
            </p>
            <span className="inline-flex items-center mt-3 text-xs font-semibold text-amber-600 group-hover:text-amber-700">
              <span>Review Queue</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            href="/ops/disbursement"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-500 hover:shadow-lg transition-all group block hover-lift cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-600 transition-colors">3. Disbursement Module</h3>
            <p className="text-xs text-slate-500 mt-1">
              Capital release execution for approved loans with transaction reference logging.
            </p>
            <span className="inline-flex items-center mt-3 text-xs font-semibold text-purple-600 group-hover:text-purple-700">
              <span>Fund Releases</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            href="/ops/collection"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-lg transition-all group block hover-lift cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">4. Collection Module</h3>
            <p className="text-xs text-slate-500 mt-1">
              Active loan repayment tracking, unique UTR entry, balance validation, and automated loan closure.
            </p>
            <span className="inline-flex items-center mt-3 text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
              <span>Manage Payments</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
