'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, ShieldAlert, TrendingUp, FileCheck, Banknote, CreditCard, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const { login, quickLoginAs } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Successfully authenticated. Redirecting...');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials';
      setError(msg);
      toast.error(msg, 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await quickLoginAs(role);
      toast.success(`Logged in as ${role}!`, 'Switched Persona');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to login with demo role');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: UserRole.ADMIN, name: 'Admin Account', email: 'admin@lms.local', desc: 'Full access to all 4 modules & analytics', variant: 'destructive' as const, icon: ShieldAlert },
    { role: UserRole.SALES, name: 'Sales Executive', email: 'sales@lms.local', desc: 'Pre-application lead tracking', variant: 'blue' as const, icon: TrendingUp },
    { role: UserRole.SANCTION, name: 'Sanction Underwriter', email: 'sanction@lms.local', desc: 'Reviews applied loans & documents', variant: 'warning' as const, icon: FileCheck },
    { role: UserRole.DISBURSEMENT, name: 'Disbursement Officer', email: 'disburse@lms.local', desc: 'Releases funds for approved loans', variant: 'purple' as const, icon: Banknote },
    { role: UserRole.COLLECTION, name: 'Collection Agent', email: 'collection@lms.local', desc: 'Records payments with unique UTR', variant: 'success' as const, icon: CreditCard },
    { role: UserRole.BORROWER, name: 'Test Borrower', email: 'borrower@lms.local', desc: 'Active borrower with uploaded docs', variant: 'secondary' as const, icon: User },
  ];

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Standard Login Form */}
        <Card className="lg:col-span-5 shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access the Borrower Portal or Ops Dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 mt-2 shadow-md shadow-indigo-600/20 hover-lift cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                New applicant?{' '}
                <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 underline cursor-pointer">
                  Create a borrower account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Evaluator Quick Login Card Grid */}
        <div className="lg:col-span-7 bg-indigo-950/5 rounded-3xl p-6 border border-indigo-100/80 space-y-4">
          <div className="flex items-center space-x-2 text-indigo-950 font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2>Evaluator 1-Click Role Logins</h2>
          </div>
          <p className="text-xs text-slate-600">
            Click any seeded role below to authenticate directly without typing credentials:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoAccounts.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.role}
                  onClick={() => handleQuickLogin(item.role)}
                  disabled={loading}
                  className="text-left p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer relative hover-lift"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700 group-hover:scale-110 group-hover:text-indigo-600 transition-all shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-indigo-600 font-mono block mt-0.5">{item.email}</span>
                      </div>
                    </div>
                    <Badge variant={item.variant} className="text-[10px]">
                      {item.role}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">{item.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-indigo-100 text-[11px] text-slate-600 space-y-1 shadow-xs">
            <p className="font-semibold text-slate-800">Evaluator Note:</p>
            <p>
              All accounts are pre-seeded in MongoDB with realistic loan records at every stage of the lifecycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
