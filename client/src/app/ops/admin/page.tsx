'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';
import { api, formatApiError } from '../../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  FileCheck,
  RefreshCw,
  History,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Building,
  DollarSign,
  Download
} from 'lucide-react';
import { Tooltip, InfoTooltip } from '../../../components/ui/tooltip';
import { exportToCsv } from '../../../lib/exportCsv';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/ui/skeleton';

interface IAdminOverviewData {
  metrics: {
    totalUsers: number;
    totalBorrowers: number;
    totalApplications: number;
    statusCounts: Record<string, number>;
    totalPrincipalDisbursed: number;
    totalInterestExpected: number;
    totalRepaymentsCollected: number;
    totalRemainingBalance: number;
  };
  recentAuditLogs: Array<{
    _id: string;
    action: string;
    performedBy: { name: string; email: string; role: string };
    loanId: { loanReference: string; status: string };
    remarks?: string;
    createdAt: string;
  }>;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<IAdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ops/admin/overview');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: unknown) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg, 'Failed to Load Admin Telemetry');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && user.role === UserRole.ADMIN) {
      fetchOverview();
    }
  }, [user, fetchOverview]);

  const handleExportAuditLogs = () => {
    if (!data?.recentAuditLogs || data.recentAuditLogs.length === 0) {
      toast.warning('No audit logs available to export.');
      return;
    }
    exportToCsv(
      'System_Compliance_Audit_Trail',
      data.recentAuditLogs,
      [
        { header: 'Action', accessor: (l) => l.action },
        { header: 'Loan Reference', accessor: (l) => l.loanId?.loanReference || 'N/A' },
        { header: 'Performed By', accessor: (l) => l.performedBy?.name || 'System' },
        { header: 'User Email', accessor: (l) => l.performedBy?.email || 'N/A' },
        { header: 'Role', accessor: (l) => l.performedBy?.role || 'N/A' },
        { header: 'Remarks', accessor: (l) => l.remarks || 'N/A' },
        { header: 'Timestamp', accessor: (l) => new Date(l.createdAt).toLocaleString('en-IN') },
      ]
    );
    toast.success(`Exported ${data.recentAuditLogs.length} audit trail records to CSV.`);
  };

  // User-friendly Access Guard
  if (user && user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900">Administrator Command Center</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This master analytics dashboard is reserved for <strong>System Administrators</strong> to oversee enterprise credit operations and portfolio health.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-rose-200/60 text-[11px] text-slate-500">
          Tip: You can switch to the <strong>Admin</strong> persona using the top evaluator bar.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title Bar */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              <span>Master Executive Cockpit</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Module — Portfolio Analytics</h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete operational visibility, capital recovery telemetry, risk status distribution, and audit trail.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start md:self-auto">
            <Tooltip content="Export system audit trail to CSV" position="bottom">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAuditLogs}
                disabled={loading || !data?.recentAuditLogs?.length}
                className="gap-1.5 text-xs font-bold text-slate-700 hover:text-rose-600 hover-lift cursor-pointer h-10 px-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </Button>
            </Tooltip>

            <Tooltip content="Refresh overview telemetry" position="bottom">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchOverview();
                  toast.info('Refreshing portfolio telemetry...');
                }}
                disabled={loading}
                className="cursor-pointer hover-lift h-10 w-10"
                aria-label="Refresh Overview"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Module Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/ops/sales"
          className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-lg transition-all flex items-center space-x-3.5 group hover-lift cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block group-hover:text-indigo-600 transition-colors">Sales Leads</span>
            <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
              <span>Pre-app funnel</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-indigo-500" />
            </span>
          </div>
        </Link>

        <Link
          href="/ops/sanction"
          className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400 hover:shadow-lg transition-all flex items-center space-x-3.5 group hover-lift cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block group-hover:text-amber-600 transition-colors">Sanction Queue</span>
            <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
              <span>Underwriting review</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-amber-500" />
            </span>
          </div>
        </Link>

        <Link
          href="/ops/disbursement"
          className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-purple-400 hover:shadow-lg transition-all flex items-center space-x-3.5 group hover-lift cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block group-hover:text-purple-600 transition-colors">Disbursement</span>
            <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
              <span>Fund release</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-purple-500" />
            </span>
          </div>
        </Link>

        <Link
          href="/ops/collection"
          className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-lg transition-all flex items-center space-x-3.5 group hover-lift cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block group-hover:text-emerald-600 transition-colors">Collection</span>
            <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
              <span>Payments &amp; auto-close</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-emerald-500" />
            </span>
          </div>
        </Link>
      </div>

      {/* Financial Capital Telemetry */}
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-purple-50/40 hover-lift transition-all cursor-default">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                    Total Capital Disbursed
                  </span>
                  <InfoTooltip content="Total cumulative principal funds disbursed to borrowers since inception." />
                </div>
                <span className="text-2xl font-black font-mono text-purple-950 mt-1 block">
                  ₹{data.metrics.totalPrincipalDisbursed.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Cumulative funds released to borrowers
                </span>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-emerald-50/40 hover-lift transition-all cursor-default">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Total Recovered (Paid)
                  </span>
                  <InfoTooltip content="Verified repayments received and accounted for across all loan facilities." />
                </div>
                <span className="text-2xl font-black font-mono text-emerald-800 mt-1 block">
                  ₹{data.metrics.totalRepaymentsCollected.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Verified collections via bank UTRs
                </span>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-indigo-50/40 hover-lift transition-all cursor-default">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                    Active Outstanding Balance
                  </span>
                  <InfoTooltip content="Current total active credit balance (principal plus interest) remaining to be recovered." />
                </div>
                <span className="text-2xl font-black font-mono text-indigo-900 mt-1 block">
                  ₹{data.metrics.totalRemainingBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Active principal + simple interest balance
                </span>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-slate-100/50 hover-lift transition-all cursor-default">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Total Users / Borrowers
                  </span>
                  <InfoTooltip content="Total registered user accounts across all 6 organizational roles in the system." />
                </div>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                  {data.metrics.totalUsers} ({data.metrics.totalBorrowers} Borrowers)
                </span>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Across all 6 system access roles
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Capital Recovery Health Gauge */}
          {(() => {
            const recoveryPercent =
              data.metrics.totalPrincipalDisbursed > 0
                ? Math.min(100, Math.round((data.metrics.totalRepaymentsCollected / data.metrics.totalPrincipalDisbursed) * 100))
                : 0;

            return (
              <Card className="shadow-xs border-slate-200 bg-white">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Portfolio Capital Recovery Gauge
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Total repayments collected relative to cumulative principal disbursed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-500 text-[11px]">Recovery Health:</span>
                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-sm">
                        {recoveryPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${recoveryPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>₹0 Collected</span>
                    <span>Disbursed ₹{data.metrics.totalPrincipalDisbursed.toLocaleString('en-IN')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Loan Status Distribution */}
      {data && (
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Loan Lifecycle Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { status: 'APPLIED', count: data.metrics.statusCounts['APPLIED'] || 0, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { status: 'SANCTIONED', count: data.metrics.statusCounts['SANCTIONED'] || 0, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { status: 'DISBURSED', count: data.metrics.statusCounts['DISBURSED'] || 0, color: 'text-purple-700 bg-purple-50 border-purple-200' },
                { status: 'CLOSED', count: data.metrics.statusCounts['CLOSED'] || 0, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { status: 'REJECTED', count: data.metrics.statusCounts['REJECTED'] || 0, color: 'text-rose-700 bg-rose-50 border-rose-200' },
              ].map((s) => (
                <div key={s.status} className={`p-4 rounded-2xl border ${s.color}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">{s.status}</span>
                  <span className="text-2xl font-black font-mono mt-1 block">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Audit Trail Log Table */}
      <Card className="shadow-xs border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold">System Compliance Audit Trail</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Live Lifecycle Events
          </Badge>
        </CardHeader>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : !data || data.recentAuditLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Loan Reference</th>
                  <th className="px-6 py-3">Actor / Executive</th>
                  <th className="px-6 py-3">Remarks</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentAuditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-800">
                      {log.loanId?.loanReference || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 space-y-0.5">
                      <span className="font-bold text-slate-900 block">{log.performedBy?.name || 'System'}</span>
                      <span className="text-[10px] text-slate-400">
                        {log.performedBy?.email} ({log.performedBy?.role})
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 text-[11px]">
                      {log.remarks || 'No remarks recorded'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
