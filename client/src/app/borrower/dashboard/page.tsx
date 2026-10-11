'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { ILoan, LoanStatus } from '../../../types';
import { api, formatApiError } from '../../../lib/api';
import { StatusBadge } from '../../../components/shared/Badge';
import { DocumentViewerModal } from '../../../components/shared/DocumentViewerModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Printer
} from 'lucide-react';
import { Tooltip, InfoTooltip } from '../../../components/ui/tooltip';
import { useToast } from '../../../context/ToastContext';
import { SanctionLetterModal } from '../../../components/shared/SanctionLetterModal';
import { Skeleton } from '../../../components/ui/skeleton';

export default function BorrowerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<{ path: string; name: string } | null>(null);
  const [selectedLetterLoan, setSelectedLetterLoan] = useState<ILoan | null>(null);

  const fetchMyLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/borrower/my-loans');
      if (res.data?.success) {
        setLoans(res.data.data);
      }
    } catch (err) {
      toast.error(formatApiError(err), 'Failed to Load Loan Facilities');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMyLoans();
  }, [fetchMyLoans]);

  return (
    <div className="space-y-8">
      {/* Header Profile Card */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Borrower Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Loan Facilities &amp; Applications</h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your credit requests, sanction underwriting decisions, and repayment progress in real-time.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Tooltip content="Refresh latest loan statuses and repayments" position="bottom">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchMyLoans}
                disabled={loading}
                aria-label="Refresh loans"
                className="cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
            <Link href="/borrower/apply">
              <Button size="sm" className="gap-2 shadow-md shadow-indigo-600/20 font-bold hover-lift cursor-pointer">
                <PlusCircle className="w-4 h-4" />
                <span>Apply for New Loan</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Verified Profile Card */}
      {user && (
        <Card className="shadow-xs border-slate-200/80 bg-slate-50/50">
          <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Applicant Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Verified PAN</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                {user.panNumber || 'Not submitted'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Monthly Income</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {user.monthlySalary ? `₹${user.monthlySalary.toLocaleString('en-IN')}/mo` : 'Pending'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Salary Slip Document</span>
              {user.salarySlipPath ? (
                <button
                  onClick={() =>
                    setSelectedDoc({
                      path: user.salarySlipPath!,
                      name: user.name,
                    })
                  }
                  className="text-indigo-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer mt-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Uploaded File</span>
                </button>
              ) : (
                <span className="text-amber-600 font-medium mt-1 block">Pending Upload</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loans List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
            Active Applications &amp; Repayment Schedules
          </h2>
          <Badge variant="outline" className="font-mono text-xs">
            {loans.length} Facility Records
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 space-y-4">
            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">No Loan Applications Found</h3>
              <p className="text-xs text-slate-500">
                You have not submitted any loan applications yet. Complete the 4-step wizard to apply.
              </p>
            </div>
            <Link href="/borrower/apply">
              <Button size="sm" className="gap-2 cursor-pointer hover-lift">
                <span>Start Application</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {loans.map((loan) => {
              const repaymentPercentage =
                loan.totalRepaymentAmount > 0
                  ? Math.min(100, Math.round((loan.totalPaidAmount / loan.totalRepaymentAmount) * 100))
                  : 0;

              return (
                <Card
                  key={loan._id}
                  className="shadow-sm border-slate-200 hover:border-slate-300 transition-all overflow-hidden hover-lift"
                >
                  <CardHeader className="py-4 px-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                        {loan.loanReference}
                      </span>
                      <StatusBadge status={loan.status} />
                    </div>
                    <span className="text-xs text-slate-400">
                      Applied on {new Date(loan.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </CardHeader>

                  <CardContent className="p-6 space-y-5">
                    {/* Financial Terms Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="flex items-center">
                          <span className="text-slate-400 block">Sanctioned Principal</span>
                          <InfoTooltip content="The approved loan capital transferred to your account." />
                        </div>
                        <span className="font-black text-slate-900 font-mono text-lg mt-0.5 block">
                          ₹{loan.principalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center">
                          <span className="text-slate-400 block">Tenure / Rate</span>
                          <InfoTooltip content="Repayment period in days with 12% annual simple interest." />
                        </div>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {loan.tenureDays} Days @ {loan.interestRateAnnual}% p.a.
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center">
                          <span className="text-slate-400 block">Total Due</span>
                          <InfoTooltip content="Total principal plus transparent 12% simple interest due on maturity." />
                        </div>
                        <span className="font-bold text-slate-800 font-mono text-sm mt-0.5 block">
                          ₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center">
                          <span className="text-slate-400 block">Outstanding Balance</span>
                          <InfoTooltip content="Remaining amount left to be paid. Automatically closes once settled." />
                        </div>
                        <span
                          className={`font-black font-mono text-lg mt-0.5 block ${
                            loan.status === LoanStatus.CLOSED
                              ? 'text-emerald-600'
                              : 'text-indigo-700'
                          }`}
                        >
                          ₹{loan.remainingBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for Active Disbursed Loans */}
                    {loan.status === LoanStatus.DISBURSED && (
                      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/80 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-purple-900 flex items-center space-x-1.5">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span>Repayment Progress</span>
                          </span>
                          <span className="font-mono font-bold text-purple-900">
                            {repaymentPercentage}% Settled (₹{loan.totalPaidAmount.toLocaleString('en-IN')} of ₹
                            {loan.totalRepaymentAmount.toLocaleString('en-IN')})
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-purple-200/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${repaymentPercentage}%` }}
                          />
                        </div>
                        {loan.disbursementReference && (
                          <div className="flex items-center justify-between text-[11px] text-purple-700 pt-1">
                            <span>Disbursement Reference:</span>
                            <span className="font-mono font-bold">{loan.disbursementReference}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {loan.status === LoanStatus.CLOSED && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Facility Settled &amp; Closed</span>
                          <span className="text-[11px] text-emerald-700">
                            Total repayment has been completely satisfied. Excellent credit track record!
                          </span>
                        </div>
                      </div>
                    )}

                    {loan.status === LoanStatus.SANCTIONED && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                          <span>Sanction Approved by Underwriting</span>
                        </div>
                        <p className="text-amber-800 text-[11px]">
                          Remarks: &quot;{loan.sanctionRemarks || 'Application verified and approved for fund release.'}&quot;
                        </p>
                      </div>
                    )}

                    {loan.status === LoanStatus.REJECTED && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Underwriting Rejection</span>
                        </div>
                        <p className="text-rose-800 text-[11px]">Reason: {loan.rejectionReason}</p>
                      </div>
                    )}

                    {/* Official Sanction Letter / Key Fact Statement Link */}
                    {loan.status !== LoanStatus.APPLIED && loan.status !== LoanStatus.REJECTED && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Official Key Fact Statement (KFS) &bull; Verified Lending Terms</span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLetterLoan(loan)}
                          className="text-xs gap-1.5 font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 border-indigo-200 cursor-pointer hover-lift"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>View Sanction Letter (KFS)</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Salary Slip Modal Viewer */}
      {selectedDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentPath={selectedDoc.path}
          applicantName={selectedDoc.name}
        />
      )}

      {/* Official Sanction Letter Modal */}
      {selectedLetterLoan && (
        <SanctionLetterModal
          isOpen={true}
          onClose={() => setSelectedLetterLoan(null)}
          loan={selectedLetterLoan}
        />
      )}
    </div>
  );
}
