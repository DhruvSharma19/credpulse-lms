'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UserRole, ILoan, IUser } from '../../../types';
import { api, formatApiError } from '../../../lib/api';
import { StatusBadge } from '../../../components/shared/Badge';
import { Modal } from '../../../components/shared/Modal';
import { Tooltip, InfoTooltip } from '../../../components/ui/tooltip';
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Copy,
  Check,
  User,
  Download,
  FileCheck2
} from 'lucide-react';
import { exportToCsv } from '../../../lib/exportCsv';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/ui/skeleton';
import { SanctionLetterModal } from '../../../components/shared/SanctionLetterModal';
import { Button } from '../../../components/ui/button';

export default function DisbursementModulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [queue, setQueue] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Disbursement action modal state
  const [activeLoan, setActiveLoan] = useState<ILoan | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sanction Letter modal
  const [letterLoan, setLetterLoan] = useState<ILoan | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ops/disbursement/queue');
      if (res.data?.success) {
        setQueue(res.data.data);
      }
    } catch (err: unknown) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg, 'Failed to Load Disbursement Queue');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && (user.role === UserRole.DISBURSEMENT || user.role === UserRole.ADMIN)) {
      fetchQueue();
    }
  }, [user, fetchQueue]);

  // User-friendly access guard
  if (user && user.role !== UserRole.DISBURSEMENT && user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
          <Banknote className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900">Treasury &amp; Disbursement Area</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module is reserved for <strong>Disbursement Officers</strong> to execute bank transfers for approved loans.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-purple-200/60 text-[11px] text-slate-500">
          Tip: You can switch to the <strong>Disbursement</strong> or <strong>Admin</strong> persona using the top evaluator bar.
        </div>
      </div>
    );
  }

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    toast.info(`Copied Reference: ${ref}`);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleExportCsv = () => {
    if (!filteredQueue || filteredQueue.length === 0) {
      toast.warning('No approved loans available to export.');
      return;
    }
    exportToCsv(
      'Ready_Payouts_Disbursement_Queue',
      filteredQueue,
      [
        { header: 'Loan Reference', accessor: (l) => l.loanReference },
        { header: 'Borrower Name', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.name : 'N/A') },
        { header: 'Borrower Phone', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.phone : 'N/A') },
        { header: 'Borrower Email', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.email : 'N/A') },
        { header: 'Principal Facility', accessor: (l) => l.principalAmount },
        { header: 'Tenure (Days)', accessor: (l) => l.tenureDays },
        { header: 'Total Repayment', accessor: (l) => l.totalRepaymentAmount },
        { header: 'Sanction Remarks', accessor: (l) => l.sanctionRemarks || 'Approved' },
        { header: 'Sanctioned On', accessor: (l) => new Date(l.updatedAt || l.createdAt).toLocaleDateString('en-IN') },
      ]
    );
    toast.success(`Exported ${filteredQueue.length} payout records to CSV.`);
  };

  const filteredQueue = queue.filter((loan) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const borrower = typeof loan.borrowerId === 'object' ? (loan.borrowerId as IUser) : null;
    return (
      loan.loanReference.toLowerCase().includes(q) ||
      (borrower?.name && borrower.name.toLowerCase().includes(q)) ||
      (borrower?.email && borrower.email.toLowerCase().includes(q)) ||
      (borrower?.phone && borrower.phone.includes(q))
    );
  });

  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;

    if (!referenceNumber || referenceNumber.trim().length < 3) {
      toast.warning('Valid disbursement reference number is required (min 3 chars).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/ops/disbursement/${activeLoan._id}/disburse`, {
        referenceNumber: referenceNumber.trim().toUpperCase(),
        notes: notes.trim(),
      });

      if (res.data?.success) {
        const ref = activeLoan.loanReference;
        const utr = referenceNumber.trim().toUpperCase();
        setActiveLoan(null);
        setReferenceNumber('');
        setNotes('');
        toast.success(`Loan ${ref} disbursed successfully! Ref: ${utr}`);
        fetchQueue();
      }
    } catch (err: unknown) {
      toast.error(formatApiError(err), 'Disbursement Transfer Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Banknote className="w-4 h-4" />
            <span>Treasury &amp; Fund Execution</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Disbursement Module — Approved Loans</h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute fund transfers for credit-approved loans and record verified bank transfer identifiers.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <Tooltip content="Export ready payouts to CSV" position="bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={loading || !queue.length}
              className="gap-1.5 text-xs font-bold text-slate-700 hover:text-purple-600 hover-lift cursor-pointer h-10 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </Tooltip>

          <Tooltip content="Refresh list of loans pending disbursement" position="bottom">
            <button
              onClick={() => {
                fetchQueue();
                toast.info('Refreshing payout queue...');
              }}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer hover-lift"
              aria-label="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-sm text-slate-900">Approved Applications Ready for Fund Release</h2>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredQueue.length} of {queue.length})
            </span>
          </div>
          
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, applicant name..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all cursor-text"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>
              {searchQuery ? 'No loans match your search filter.' : 'All approved loans have been disbursed! No pending payouts in the queue.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Loan Reference</th>
                  <th className="px-6 py-3">Borrower Name</th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Approved Principal</span>
                      <InfoTooltip content="The sanctioned loan amount to be transferred directly to borrower's account." />
                    </div>
                  </th>
                  <th className="px-6 py-3">Underwriting Notes</th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Tenure &amp; Repayment</span>
                      <InfoTooltip content="Loan term in days and total repayment calculated with transparent 12% simple interest." />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((loan) => {
                  const borrower = typeof loan.borrowerId === 'object' ? (loan.borrowerId as IUser) : null;
                  const sanctionedExec = typeof loan.sanctionedBy === 'object' ? (loan.sanctionedBy as IUser) : null;
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900 block">{loan.loanReference}</span>
                          <Tooltip content={copiedRef === loan.loanReference ? 'Copied reference!' : 'Copy loan reference ID'} position="top">
                            <button
                              type="button"
                              onClick={() => handleCopyRef(loan.loanReference)}
                              className="p-1 text-slate-400 hover:text-purple-600 rounded transition-colors cursor-pointer"
                              aria-label="Copy Loan Reference"
                            >
                              {copiedRef === loan.loanReference ? (
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
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-100">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{borrower?.name || 'Applicant'}</span>
                            <div className="text-slate-500 text-[11px]">{borrower?.email}</div>
                            <div className="text-slate-500 text-[11px]">{borrower?.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-slate-900 text-base block">
                          ₹{loan.principalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-emerald-700 font-semibold text-[11px]">Sanctioned Payout</span>
                      </td>

                      <td className="px-6 py-4 space-y-1">
                        <div className="text-slate-700 text-[11px] font-medium line-clamp-2">
                          &quot;{loan.sanctionRemarks || 'Application verified and approved.'}&quot;
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Approved by: {sanctionedExec?.name || 'Credit Officer'}
                        </div>
                      </td>

                      <td className="px-6 py-4 space-y-0.5">
                        <div className="font-medium text-slate-800">{loan.tenureDays} Days duration</div>
                        <div className="font-bold font-mono text-purple-700">
                          Total Repayment: ₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
                          <Tooltip content="Preview official Key Fact Statement (KFS) and Sanction Letter terms" position="top">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setLetterLoan(loan)}
                              className="h-8 px-2.5 text-xs gap-1 font-semibold hover-lift cursor-pointer"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                              <span>Preview KFS</span>
                            </Button>
                          </Tooltip>
                          <Tooltip content="Transfer capital and start repayment schedule" position="left">
                            <Button
                              size="sm"
                              onClick={() => {
                                setActiveLoan(loan);
                                setReferenceNumber(`NEFT-AXIS-${Math.floor(100000 + Math.random() * 900000)}`);
                              }}
                              className="h-8 px-3 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all hover-lift inline-flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Release Funds</span>
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disbursement Confirmation Modal */}
      {activeLoan && (
        <Modal
          isOpen={true}
          onClose={() => setActiveLoan(null)}
          title={`Confirm Fund Release — ${activeLoan.loanReference}`}
        >
          <form onSubmit={handleDisbursementSubmit} className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-purple-900 font-medium">Principal to Transfer:</span>
                <span className="font-mono font-black text-lg text-purple-950">
                  ₹{activeLoan.principalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Confirming this action marks the loan as <strong>DISBURSED</strong>. The borrower will receive immediate access to the funds, and the repayment schedule will be activated.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Bank Transfer / UTR Number
                </label>
                <InfoTooltip content="The Unique Transaction Reference number from your bank transfer (NEFT/RTGS/IMPS)." />
              </div>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                placeholder="e.g. NEFT-HDFC-8829102"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-text"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Transfer Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Transferred to verified borrower bank account..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-text"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveLoan(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs flex items-center space-x-1.5 cursor-pointer hover-lift"
              >
                <span>{submitting ? 'Processing Transfer...' : 'Confirm Fund Release'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
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
