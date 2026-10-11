'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UserRole, ILoan, IUser } from '../../../types';
import { api, formatApiError } from '../../../lib/api';
import { StatusBadge } from '../../../components/shared/Badge';
import { Modal } from '../../../components/shared/Modal';
import { DocumentViewerModal } from '../../../components/shared/DocumentViewerModal';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Search,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { Tooltip, InfoTooltip } from '../../../components/ui/tooltip';
import { exportToCsv } from '../../../lib/exportCsv';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/ui/skeleton';
import { SanctionLetterModal } from '../../../components/shared/SanctionLetterModal';
import { Download, FileCheck2 } from 'lucide-react';

export default function SanctionModulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [queue, setQueue] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Review modal state
  const [activeLoan, setActiveLoan] = useState<ILoan | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Document viewer modal
  const [selectedDoc, setSelectedDoc] = useState<{ path: string; name: string } | null>(null);

  // Official Sanction Letter modal
  const [letterLoan, setLetterLoan] = useState<ILoan | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ops/sanction/queue');
      if (res.data?.success) {
        setQueue(res.data.data);
      }
    } catch (err: unknown) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg, 'Failed to Load Queue');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && (user.role === UserRole.SANCTION || user.role === UserRole.ADMIN)) {
      fetchQueue();
    }
  }, [user, fetchQueue]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    if (!filteredQueue || filteredQueue.length === 0) {
      toast.warning('No applications to export.');
      return;
    }
    exportToCsv(
      'Underwriting_Sanction_Queue',
      filteredQueue,
      [
        { header: 'Loan Reference', accessor: (l) => l.loanReference },
        { header: 'Borrower Name', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.name : 'N/A') },
        { header: 'PAN Number', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.panNumber : 'N/A') },
        { header: 'Monthly Salary', accessor: (l) => (typeof l.borrowerId === 'object' ? (l.borrowerId as IUser)?.monthlySalary : 'N/A') },
        { header: 'Principal Amount', accessor: (l) => l.principalAmount },
        { header: 'Tenure (Days)', accessor: (l) => l.tenureDays },
        { header: 'Calculated Interest', accessor: (l) => l.calculatedInterest },
        { header: 'Total Repayment', accessor: (l) => l.totalRepaymentAmount },
        { header: 'Status', accessor: (l) => l.status },
        { header: 'Applied On', accessor: (l) => new Date(l.createdAt).toLocaleDateString('en-IN') },
      ]
    );
    toast.success(`Exported ${filteredQueue.length} underwriting records to CSV.`);
  };

  // Filtered queue
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) return queue;
    const q = searchQuery.toLowerCase();
    return queue.filter((loan) => {
      const borrower = typeof loan.borrowerId === 'object' ? (loan.borrowerId as IUser) : null;
      return (
        loan.loanReference.toLowerCase().includes(q) ||
        borrower?.name.toLowerCase().includes(q) ||
        borrower?.panNumber?.toLowerCase().includes(q)
      );
    });
  }, [queue, searchQuery]);

  // User-friendly Access Guard
  if (user && user.role !== UserRole.SANCTION && user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <FileCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900">Underwriting &amp; Sanction Area</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module is reserved for <strong>Sanction Underwriters</strong> to review income documents and make credit approval decisions.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-amber-200/60 text-[11px] text-slate-500">
          Tip: You can switch to the <strong>Sanction</strong> or <strong>Admin</strong> persona using the top evaluator bar.
        </div>
      </div>
    );
  }

  const openDecisionModal = (loan: ILoan, action: 'APPROVE' | 'REJECT') => {
    setActiveLoan(loan);
    setReviewAction(action);
    setRemarks(action === 'APPROVE' ? 'Applicant meets underwriting risk policy. Approved for fund disbursement.' : '');
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan || !reviewAction) return;

    if (reviewAction === 'REJECT' && (!remarks || remarks.trim().length < 5)) {
      toast.warning('A detailed rejection reason (minimum 5 characters) is mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/ops/sanction/${activeLoan._id}/review`, {
        action: reviewAction,
        remarks: remarks.trim(),
      });

      if (res.data?.success) {
        const ref = activeLoan.loanReference;
        const act = reviewAction;
        setActiveLoan(null);
        setReviewAction(null);
        setRemarks('');
        toast.success(
          act === 'APPROVE'
            ? `Loan ${ref} sanctioned and queued for Treasury disbursement!`
            : `Loan ${ref} rejected with formal feedback.`
        );
        fetchQueue();
      }
    } catch (err: unknown) {
      toast.error(formatApiError(err), 'Decision Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <FileCheck className="w-4 h-4" />
              <span>Underwriting Assessment</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sanction Module — Review Queue</h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify borrower applications, inspect salary slips, and approve or reject with reasons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                type="text"
                placeholder="Search reference, name, PAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <Tooltip content="Export underwriting queue to CSV" position="bottom">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={loading || !queue.length}
                className="gap-1.5 text-xs font-bold text-slate-700 hover:text-amber-600 hover-lift cursor-pointer h-10 px-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>
            </Tooltip>

            <Tooltip content="Refresh queue" position="bottom">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchQueue();
                  toast.info('Refreshing sanction queue...');
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

      {/* Queue Table */}
      <Card className="shadow-xs border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-bold">Applications Awaiting Underwriting Decision</CardTitle>
          </div>
          <Badge variant="warning" className="font-bold">
            {filteredQueue.length} Pending
          </Badge>
        </CardHeader>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>
              {searchQuery
                ? 'No applications match your search query.'
                : 'Sanction queue is clear. No loans currently in APPLIED status.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1020px] w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Loan Reference</th>
                  <th className="px-6 py-3">Borrower Details</th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Requested Facility</span>
                      <InfoTooltip content="Sanctioned principal amount and tenure requested by applicant." />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Repayment Terms</span>
                      <InfoTooltip content="Interest calculated transparently at 12% p.a. simple interest with total maturity amount." />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      <span>Income Proof Document</span>
                      <InfoTooltip content="Uploaded salary slip used to verify declared monthly income meets ₹25,000 policy." />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right">Credit Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((loan) => {
                  const borrower = typeof loan.borrowerId === 'object' ? (loan.borrowerId as IUser) : null;
                  const initials = borrower?.name
                    ? borrower.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'AP';

                  return (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">{loan.loanReference}</span>
                          <Tooltip content={copiedId === loan._id ? 'Copied reference!' : 'Copy loan reference ID'} position="top">
                            <button
                              onClick={() => copyToClipboard(loan.loanReference, loan._id)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
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

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-[11px] shadow-xs shrink-0">
                            {initials}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">{borrower?.name || 'Applicant'}</span>
                            <div className="text-slate-500 font-mono text-[11px]">
                              PAN: {borrower?.panNumber || 'N/A'}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Monthly Salary: {borrower?.monthlySalary ? `₹${borrower.monthlySalary.toLocaleString('en-IN')}` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-slate-900 text-base block">
                          ₹{loan.principalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {loan.tenureDays} Days @ {loan.interestRateAnnual}% p.a.
                        </span>
                      </td>

                      <td className="px-6 py-4 space-y-0.5">
                        <div className="text-slate-600 font-mono text-[11px]">
                          Interest: ₹{loan.calculatedInterest.toLocaleString('en-IN')}
                        </div>
                        <div className="font-bold text-indigo-700 font-mono">
                          Total Due: ₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {borrower?.salarySlipPath ? (
                          <Tooltip content="Inspect uploaded salary slip in document viewer" position="top">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedDoc({
                                  path: borrower.salarySlipPath!,
                                  name: borrower.name,
                                })
                              }
                              className="gap-1.5 text-xs text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Document</span>
                            </Button>
                          </Tooltip>
                        ) : (
                          <span className="text-slate-400">No document attached</span>
                        )}
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
                              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Preview KFS</span>
                            </Button>
                          </Tooltip>
                          <Tooltip content="Approve loan and send to Treasury for fund disbursement" position="top">
                            <Button
                              variant="emerald"
                              size="sm"
                              onClick={() => openDecisionModal(loan, 'APPROVE')}
                              className="h-8 px-3 text-xs font-bold hover-lift cursor-pointer shadow-xs inline-flex items-center"
                            >
                              Approve
                            </Button>
                          </Tooltip>
                          <Tooltip content="Decline loan request with transparent feedback reason" position="top">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDecisionModal(loan, 'REJECT')}
                              className="h-8 px-3 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 font-bold hover-lift cursor-pointer inline-flex items-center"
                            >
                              Reject
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
      </Card>

      {/* Underwriting Decision Modal */}
      {activeLoan && reviewAction && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActiveLoan(null);
            setReviewAction(null);
          }}
          title={reviewAction === 'APPROVE' ? `Sanction Approval — ${activeLoan.loanReference}` : `Sanction Rejection — ${activeLoan.loanReference}`}
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Principal Facility:</span>
                <span className="font-mono font-bold text-slate-900">₹{activeLoan.principalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tenure:</span>
                <span className="font-mono font-bold text-slate-900">{activeLoan.tenureDays} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total Repayment:</span>
                <span className="font-mono font-bold text-indigo-700">₹{activeLoan.totalRepaymentAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {reviewAction === 'APPROVE' ? 'Approval Remarks (Optional)' : 'Rejection Reason (Mandatory, min 5 chars)'}
                </label>
                <InfoTooltip
                  content={
                    reviewAction === 'APPROVE'
                      ? 'Helpful underwriting notes or verification comments recorded in the loan audit trail.'
                      : 'Clear, transparent explanation shared with the applicant explaining why the loan could not be approved.'
                  }
                />
              </div>
              <textarea
                required={reviewAction === 'REJECT'}
                minLength={reviewAction === 'REJECT' ? 5 : 0}
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  reviewAction === 'APPROVE'
                    ? 'Enter approval notes for audit trail...'
                    : 'Explain specific reason for underwriting rejection...'
                }
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveLoan(null);
                  setReviewAction(null);
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                variant={reviewAction === 'APPROVE' ? 'emerald' : 'destructive'}
                size="sm"
                className="font-bold shadow-xs cursor-pointer hover-lift"
              >
                {submitting ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm Sanction' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Salary Document Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentPath={selectedDoc.path}
          applicantName={selectedDoc.name}
        />
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
