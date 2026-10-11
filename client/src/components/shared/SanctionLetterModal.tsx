'use client';

import React from 'react';
import { Modal } from './Modal';
import { ILoan, IUser } from '../../types';
import { Printer, ShieldCheck, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface SanctionLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: ILoan;
}

export const SanctionLetterModal: React.FC<SanctionLetterModalProps> = ({
  isOpen,
  onClose,
  loan,
}) => {
  if (!loan) return null;

  const borrower = typeof loan.borrowerId === 'object' ? (loan.borrowerId as IUser) : null;
  const sanctionDate = new Date(loan.updatedAt || loan.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const maturityDate = new Date(
    new Date(loan.createdAt).getTime() + loan.tenureDays * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const dailyInterest = ((loan.principalAmount * 0.12) / 365).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Key Fact Statement & Sanction Letter"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Printable Letterhead Document Card */}
        <div
          id="sanction-letter-print-area"
          className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 text-slate-800 font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* Header & NBFC Credentials */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Building2 className="w-6 h-6" />
                <span className="text-xl font-black tracking-tight">NEXUS DIGITAL NBFC LIMITED</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                RBI Reg. No: B-08.00921 &bull; CIN: U65923DL2024PTC981273
              </p>
              <p className="text-[11px] text-slate-500">
                Regd. Office: 4th Floor, Tech Hub Tower, Cyber City, Gurugram 122002
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <Badge variant="blue" className="font-mono text-xs uppercase font-bold tracking-wider">
                Official Sanction Letter
              </Badge>
              <div className="text-xs text-slate-500 mt-1">
                Ref No: <span className="font-mono font-bold text-slate-900">{loan.loanReference}</span>
              </div>
              <div className="text-xs text-slate-500">
                Date: <span className="font-medium text-slate-800">{sanctionDate}</span>
              </div>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">To (Borrower):</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {borrower?.name || 'Authorized Applicant'}
              </span>
              <span className="text-slate-600 font-mono mt-0.5 block">
                PAN: {borrower?.panNumber || 'Verified on Record'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Contact &amp; Account:</span>
              <span className="text-slate-700 block mt-0.5">
                Email: {borrower?.email || 'Registered Email'}
              </span>
              <span className="text-slate-700 font-mono block mt-0.5">
                Phone: {borrower?.phone || 'Registered Phone'}
              </span>
            </div>
          </div>

          {/* Letter Body */}
          <div className="text-xs leading-relaxed text-slate-700 space-y-2">
            <p>
              Dear <strong>{borrower?.name || 'Applicant'}</strong>,
            </p>
            <p>
              We are pleased to inform you that following comprehensive underwriting review and criteria verification, your application for an unsecured short-term credit facility has been sanctioned under the following terms and conditions:
            </p>
          </div>

          {/* Key Fact Statement (KFS) Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Key Fact Statement (KFS) — Commercial Terms</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-600 w-1/2">Sanctioned Principal Facility (P)</td>
                    <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                      ₹{loan.principalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-slate-600">Annualized Interest Rate (R)</td>
                    <td className="px-4 py-2.5 font-bold font-mono text-indigo-700">
                      {loan.interestRateAnnual}% p.a. (Fixed Simple Interest)
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-600">Loan Tenure (T)</td>
                    <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                      {loan.tenureDays} Calendar Days (~{(loan.tenureDays / 30).toFixed(1)} Months)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-slate-600">Daily Simple Interest Accrual</td>
                    <td className="px-4 py-2.5 font-mono text-slate-800">
                      ₹{dailyInterest} per day
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-600">Total Interest Payable</td>
                    <td className="px-4 py-2.5 font-bold font-mono text-amber-700">
                      ₹{loan.calculatedInterest.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50/40">
                    <td className="px-4 py-3 font-bold text-slate-900">Total Maturity Repayment (P + I)</td>
                    <td className="px-4 py-3 font-black font-mono text-base text-indigo-900">
                      ₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-slate-600">Maturity Repayment Date</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {maturityDate}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-600">Processing &amp; Foreclosure Charges</td>
                    <td className="px-4 py-2.5 font-semibold text-emerald-700">
                      Nil &bull; Zero Hidden Costs
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Notes & Undertaking */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
            <span className="font-bold text-slate-800 block">Terms of Acceptance &amp; Repayment:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Repayments must be remitted via authorized banking channels (NEFT/RTGS/IMPS/UPI) quoting the Loan Reference ID.</li>
              <li>Upon complete settlement of ₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}, a digital No Objection Certificate (NOC) will be generated and the facility automatically closed.</li>
              <li>This sanction letter is compliant with the RBI Digital Lending Guidelines and Fair Practices Code.</li>
            </ul>
          </div>

          {/* Official Signatures & Digital Seal */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 gap-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-700 font-semibold">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Digitally Authenticated Document &bull; Nexus Underwriting Core</span>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Authorized Signatory
              </span>
              <span className="text-xs font-bold text-slate-900 block font-serif italic">
                Nexus Capital Credit Committee
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Verification Hash: {loan._id.substring(loan._id.length - 8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2 cursor-pointer hover-lift font-bold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
