'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UserRole, ILoan, IUser, IPayment, LoanStatus } from '../../../types';
import { api, formatApiError } from '../../../lib/api';
import { StatusBadge } from '../../../components/shared/Badge';
import { Modal } from '../../../components/shared/Modal';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  History,
  TrendingUp,
  ShieldCheck,
  Check,
  Search,
  Sparkles,
  Copy,
  Download,
  Filter,
  FileCheck2,
  ArrowUpDown
} from 'lucide-react';
import { Tooltip, InfoTooltip } from '../../../components/ui/tooltip';
import { exportToCsv } from '../../../lib/exportCsv';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/ui/skeleton';
import { SanctionLetterModal } from '../../../components/shared/SanctionLetterModal';

export default function CollectionModulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [summary, setSummary] = useState<{
    activeDisbursedCount: number;
    closedCount: number;
    totalOutstandingBalance: number;
    totalCollected: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISBURSED' | 'CLOSED'>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'BALANCE_DESC' | 'PROGRESS_DESC'>('DEFAULT');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Record payment modal state
  const [activeLoan, setActiveLoan] = useState<ILoan | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Payment history modal
  const [historyLoan, setHistoryLoan] = useState<ILoan | null>(null);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sanction Letter modal
  const [letterLoan, setLetterLoan] = useState<ILoan | null>(null);

  const fetchCollectionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ops/collection/loans');
      if (res.data?.success) {
        setLoans(res.data.data.loans);
        setSummary(res.data.data.summary);
      }
    } catch (err: unknown) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg, 'Failed to Load Collection Portfolio');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && (user.role === UserRole.COLLECTION || user.role === UserRole.ADMIN)) {
      fetchCollectionData();
    }
  }, [user, fetchCollectionData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info(`Copied Reference: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    if (!filteredLoans || filteredLoans.length === 0) {
      toast.warning('No loans to export in current view.');
      return;
    }
    exportToCsv(
      'Collection_Recovery_Ledger',
      filteredLoans,
      [
        { header: 'Loan Reference', accessor: (l) => l.loanReference },
        { header: 'Borrower Name', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.name : 'N/A') },
        { header: 'Borrower PAN', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.panNumber : 'N/A') },
        { header: 'Borrower Phone', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.phone : 'N/A') },
        { header: 'Principal Amount', accessor: (l) => l.principalAmount },
        { header: 'Total Due', accessor: (l) => l.totalRepaymentAmount },
        { header: 'Amount Repaid', accessor: (l) => l.totalPaidAmount },
        { header: 'Outstanding Balance', accessor: (l) => l.remainingBalance },
        {
          header: 'Recovery %',
          accessor: (l) =>
            l.totalRepaymentAmount > 0
              ? `${Math.round((l.totalPaidAmount / l.totalRepaymentAmount) * 100)}%`
              : '0%',
        },
        { header: 'Status', accessor: (l) => l.status },
        { header: 'Disbursement Ref', accessor: (l) => l.disbursementReference || 'N/A' },
      ]
    );
    toast.success(`Exported ${filteredLoans.length} loan records to CSV.`);
  };

  const filteredLoans = useMemo(() => {
    let result = [...loans];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((loan) => {
        const borrower = typeof loan.borrowerId === 'object' ? (loan.borrowerId as IUser) : null;
        return (
          loan.loanReference.toLowerCase().includes(q) ||
          borrower?.name.toLowerCase().includes(q) ||
          borrower?.panNumber?.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    if (sortBy === 'BALANCE_DESC') {
      result.sort((a, b) => b.remainingBalance - a.remainingBalance);
    } else if (sortBy === 'PROGRESS_DESC') {
      result.sort((a, b) => {
        const pA = a.totalRepaymentAmount > 0 ? a.totalPaidAmount / a.totalRepaymentAmount : 0;
        const pB = b.totalRepaymentAmount > 0 ? b.totalPaidAmount / b.totalRepaymentAmount : 0;
        return pB - pA;
      });
    }

    return result;
  }, [loans, statusFilter, searchQuery, sortBy]);

  // User-friendly Access Guard
  if (user && user.role !== UserRole.COLLECTION && user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CreditCard className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900">Collection &amp; Repayments Area</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module is reserved for <strong>Collection Agents</strong> to record borrower repayments and verify unique bank transfer UTRs.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-emerald-200/60 text-[11px] text-slate-500">
          Tip: You can switch to the <strong>Collection</strong> or <strong>Admin</strong> persona using the top evaluator bar.
        </div>
      </div>
    );
  }

  const openRecordPaymentModal = (loan: ILoan) => {
    setActiveLoan(loan);
    setAmount(loan.remainingBalance); // Default to full remaining balance for 1-click test
    setPaymentDate(new Date().toISOString().split('T')[0] ?? '');
    setUtrNumber(`UTR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`);
    setNotes('Borrower bank instalment transfer verified');
    setPaymentSuccessMsg(null);
  };

  const openHistoryModal = async (loan: ILoan) => {
    setHistoryLoan(loan);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/ops/collection/${loan._id}/payments`);
      if (res.data?.success) {
        setPayments(res.data.data);
      }
    } catch {
      setPayments([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;

    if (amount <= 0) {
      toast.warning('Payment amount must be greater than zero.');
      return;
    }

    if (amount > activeLoan.remainingBalance) {
      toast.warning(`Payment of ₹${amount} exceeds remaining balance of ₹${activeLoan.remainingBalance}.`);
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.post(`/ops/collection/${activeLoan._id}/record-payment`, {
        utrNumber: utrNumber.trim().toUpperCase(),
        amount: Number(amount),
        paymentDate,
        notes: notes.trim(),
      });

      if (res.data?.success) {
        setPaymentSuccessMsg(res.data.message);
        toast.success(res.data.message, 'Payment Recorded');
        setTimeout(() => {
          setActiveLoan(null);
          setPaymentSuccessMsg(null);
          fetchCollectionData();
        }, 1500);
      }
    } catch (err: unknown) {
      toast.error(formatApiError(err), 'Payment Recording Failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <CreditCard className="w-4 h-4" />
              <span>Repayment &amp; Portfolio Servicing</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Collection Module — Active Facilities</h1>
            <p className="text-xs text-slate-500 mt-1">
              Record verified borrower repayments with unique UTR identifiers. Automatic closure triggers upon full settlement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                type="text"
                placeholder="Search reference, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <Tooltip content="Export recovery ledger to CSV" position="bottom">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={loading || !loans.length}
                className="gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 hover-lift cursor-pointer h-10 px-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>
            </Tooltip>

            <Tooltip content="Refresh Collections" position="bottom">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchCollectionData();
                  toast.info('Refreshing collection portfolio...');
                }}
                disabled={loading}
                className="h-10 w-10 cursor-pointer hover-lift"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards with Glowing Accents */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-purple-50/30 hover-lift transition-all cursor-default">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                  Active Disbursed Loans
                </span>
                <InfoTooltip content="Active borrower facilities currently undergoing repayment servicing." />
              </div>
              <span className="text-2xl font-black text-purple-950 font-mono mt-1 block">
                {summary.activeDisbursedCount}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Requiring repayment servicing</span>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-emerald-50/30 hover-lift transition-all cursor-default">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Auto-Closed (Settled)
                </span>
                <InfoTooltip content="Loans where the borrower has paid the full amount and the facility automatically closed." />
              </div>
              <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                {summary.closedCount}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Zero remaining balance</span>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-indigo-50/30 hover-lift transition-all cursor-default">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Total Outstanding Balance
                </span>
                <InfoTooltip content="The remaining balance across all active borrowers to be recovered." />
              </div>
              <span className="text-2xl font-black text-indigo-900 font-mono mt-1 block">
                ₹{summary.totalOutstandingBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Active recovery pipeline</span>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200 bg-linear-to-br from-white to-emerald-50/30 hover-lift transition-all cursor-default">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Total Recovered Capital
                </span>
                <InfoTooltip content="Actual repayments received and verified via bank transfer reference numbers (UTRs)." />
              </div>
              <span className="text-2xl font-black text-emerald-900 font-mono mt-1 block">
                ₹{summary.totalCollected.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Verified via bank UTRs</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Loans Table */}
      <Card className="shadow-xs border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold">Serviced Loans Portfolio</CardTitle>
          </div>
          <Badge variant="success" className="font-bold">
            {filteredLoans.length} Loans
          </Badge>
        </CardHeader>

        {/* Status Filter Pills & Sort Selector */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mr-1">
              <Filter className="w-3 h-3 mr-1 text-slate-400" />
              Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Records', count: loans.length },
              { id: 'DISBURSED', label: 'Active (Disbursed)', count: summary?.activeDisbursedCount || 0 },
              { id: 'CLOSED', label: 'Settled (Closed)', count: summary?.closedCount || 0 },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id as 'ALL' | 'DISBURSED' | 'CLOSED')}
                className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer hover-lift ${
                  statusFilter === pill.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {pill.label} ({pill.count})
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'DEFAULT' | 'BALANCE_DESC' | 'PROGRESS_DESC')}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="DEFAULT">Recent (Default)</option>
              <option value="BALANCE_DESC">Highest Outstanding Due</option>
              <option value="PROGRESS_DESC">Highest Recovery %</option>
            </select>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={7} />
        ) : filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>
              {searchQuery || statusFilter !== 'ALL'
                ? 'No loans match your search or filter selection.'
                : 'No loans found matching your query.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Loan Reference</th>
                  <th className="px-6 py-3">Borrower Details</th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Total Repayment</span>
                      <InfoTooltip content="Total principal plus 12% simple interest due for the loan tenure." />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Amount Repaid</span>
                      <InfoTooltip content="Cumulative sum of all verified repayments processed." />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Outstanding Due</span>
                      <InfoTooltip content="Current outstanding balance remaining on this credit facility." />
                    </div>
                  </th>
                  <th className="px-6 py-3">Recovery Progress</th>
                  <th className="px-6 py-3 text-right">Repayment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan) => {
                  const borrower = typeof loan.borrowerId === 'object' ? (loan.borrowerId as IUser) : null;
                  const progress =
                    loan.totalRepaymentAmount > 0
                      ? Math.min(100, Math.round((loan.totalPaidAmount / loan.totalRepaymentAmount) * 100))
                      : 0;

                  return (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">{loan.loanReference}</span>
                          <Tooltip content={copiedId === loan._id ? 'Copied reference!' : 'Copy loan reference ID'} position="top">
                            <button
                              onClick={() => copyToClipboard(loan.loanReference, loan._id)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer transition-colors"
                              aria-label="Copy Loan Reference"
                            >
                              {copiedId === loan._id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                        <div className="mt-1">
                          <StatusBadge status={loan.status} />
                        </div>
                      </td>

                      <td className="px-6 py-4 space-y-0.5">
                        <span className="font-bold text-slate-900 block">{borrower?.name || 'Applicant'}</span>
                        <div className="text-slate-500 font-mono text-[11px]">PAN: {borrower?.panNumber || 'N/A'}</div>
                        <div className="text-slate-500 text-[11px]">{borrower?.phone}</div>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        ₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                        ₹{loan.totalPaidAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`font-mono font-black text-sm ${
                            loan.status === LoanStatus.CLOSED ? 'text-emerald-600' : 'text-indigo-700'
                          }`}
                        >
                          ₹{loan.remainingBalance.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="px-6 py-4 w-44">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>{progress}% Recovered</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                loan.status === LoanStatus.CLOSED
                                  ? 'bg-emerald-500'
                                  : 'bg-linear-to-r from-indigo-500 to-indigo-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
                          <Tooltip content="Preview official Sanction Letter & Statement" position="top">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLetterLoan(loan)}
                              className="h-8 px-2.5 text-xs gap-1 font-semibold hover-lift cursor-pointer text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>KFS</span>
                            </Button>
                          </Tooltip>

                          <Tooltip content="View itemized ledger of recorded repayments" position="top">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openHistoryModal(loan)}
                              className="h-8 px-2.5 text-xs gap-1 font-semibold hover-lift cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>History</span>
                            </Button>
                          </Tooltip>

                          {loan.status === LoanStatus.DISBURSED && (
                            <Tooltip content="Record incoming payment with UTR number" position="top">
                              <Button
                                variant="emerald"
                                size="sm"
                                onClick={() => openRecordPaymentModal(loan)}
                                className="h-8 px-3 text-xs font-bold shadow-xs hover-lift cursor-pointer inline-flex items-center"
                              >
                                Record Payment
                              </Button>
                            </Tooltip>
                          )}

                          {loan.status === LoanStatus.CLOSED && (
                            <span className="h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      {activeLoan && (
        <Modal
          isOpen={true}
          onClose={() => setActiveLoan(null)}
          title={`Record Repayment — ${activeLoan.loanReference}`}
        >
          {paymentSuccessMsg ? (
            <div className="p-6 text-center space-y-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-base">Payment Recorded Successfully</h4>
                <p className="text-xs text-emerald-800">{paymentSuccessMsg}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveLoan(null);
                  setPaymentSuccessMsg(null);
                  fetchCollectionData();
                }}
                className="font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-100 cursor-pointer"
              >
                Close &amp; View Updated Ledger
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                  <span className="font-mono font-black text-base text-indigo-700">
                    ₹{activeLoan.remainingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Total Repayment Facility:</span>
                  <span className="font-mono font-medium">₹{activeLoan.totalRepaymentAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Quick Helper Preset Buttons */}
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Fill Amount:
                </span>
                <Tooltip content="Auto-fill the remaining loan balance to completely settle and close this loan" position="top">
                  <button
                    type="button"
                    onClick={() => setAmount(activeLoan.remainingBalance)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 cursor-pointer transition-colors hover-lift"
                  >
                    Full Settlement (₹{activeLoan.remainingBalance.toLocaleString('en-IN')})
                  </button>
                </Tooltip>
                <Tooltip content="Auto-fill half (50%) of the outstanding balance for partial repayment" position="top">
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(activeLoan.remainingBalance / 2))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors hover-lift"
                  >
                    50% Balance
                  </button>
                </Tooltip>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Bank Transfer / UTR Number
                  </label>
                  <InfoTooltip content="Unique Transaction Reference (UTR) issued by the bank or payment gateway for this deposit. Every payment must have a unique reference." />
                </div>
                <Input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. UTR-2026-902341"
                  className="font-mono uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ensures safe, duplicate-protected transaction logging across banking partners.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amount (Max: ₹{activeLoan.remainingBalance})
                  </label>
                  <Input
                    type="number"
                    required
                    min={1}
                    max={activeLoan.remainingBalance}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Date
                  </label>
                  <Input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Settlement Alert */}
              {amount === activeLoan.remainingBalance && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    This payment settles the entire remaining balance. The loan will <strong>AUTOMATICALLY CLOSE</strong>.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Remarks / Notes (Optional)
                </label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instalment, NEFT transfer..."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveLoan(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingPayment}
                  variant="emerald"
                  size="sm"
                  className="font-bold shadow-xs"
                >
                  {submittingPayment ? 'Processing...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Payment History Modal */}
      {historyLoan && (
        <Modal
          isOpen={true}
          onClose={() => setHistoryLoan(null)}
          title={`Repayment History — ${historyLoan.loanReference}`}
          maxWidth="lg"
        >
          {historyLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading payment transactions...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No payments recorded for this facility yet.</div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 flex justify-between pb-2 border-b border-slate-100 font-medium">
                <span>Total Recorded: {payments.length} Transaction(s)</span>
                <span className="font-mono font-bold text-emerald-700">
                  Total Paid: ₹{historyLoan.totalPaidAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">{p.utrNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })} &bull; Recorded by {p.recordedBy?.name || 'Agent'}
                      </span>
                      {p.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">{p.notes}</p>}
                    </div>
                    <span className="font-mono font-black text-sm text-emerald-600">
                      +₹{p.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Official Sanction Letter Modal */}
      {letterLoan && (
        <SanctionLetterModal
          isOpen={true}
          onClose={() => setLetterLoan(null)}
          loan={letterLoan}
        />
      )}
    </div>
  );
}
