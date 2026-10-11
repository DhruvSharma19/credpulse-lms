'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UserRole, IUser } from '../../../types';
import { api, formatApiError } from '../../../lib/api';
import { Users, TrendingUp, RefreshCw, AlertCircle, Phone, Mail, Clock, Search, Copy, Check, User, Download, Filter } from 'lucide-react';
import { Tooltip, InfoTooltip } from '../../../components/ui/tooltip';
import { exportToCsv } from '../../../lib/exportCsv';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/ui/skeleton';
import { Button } from '../../../components/ui/button';

export default function SalesModulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [data, setData] = useState<{
    totalLeads: number;
    funnelCounts: Record<string, number>;
    leads: IUser[];
  } | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ops/sales/leads');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: unknown) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg, 'Failed to Load Leads');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && (user.role === UserRole.SALES || user.role === UserRole.ADMIN)) {
      fetchLeads();
    }
  }, [user, fetchLeads]);

  // User-friendly stage formatter
  const formatStage = (stage: string) => {
    switch (stage) {
      case 'REGISTERED':
        return { label: 'Account Created', desc: 'Signed up, has not yet entered loan requirements', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'PERSONAL_INFO_COMPLETED':
        return { label: 'Details Provided', desc: 'Eligible for loan, needs to upload income proof', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'DOCUMENT_UPLOADED':
        return { label: 'Ready to Submit', desc: 'Documents uploaded, pending final confirmation', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: stage, desc: 'Applicant in progress', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // User-friendly Access Guard
  if (user && user.role !== UserRole.SALES && user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900">Sales &amp; Outreach Area</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module is designed for the <strong>Sales Team</strong> to assist applicants whose loan requests are pending completion.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-amber-200/60 text-[11px] text-slate-500">
          Tip: You can switch to the <strong>Sales</strong> or <strong>Admin</strong> persona using the top evaluator bar.
        </div>
      </div>
    );
  }

  const handleCopy = (text?: string, label = 'Information') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.info(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleExportCsv = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast.warning('No leads available to export in current view.');
      return;
    }
    exportToCsv(
      'Prospective_Borrowers_Leads',
      filteredLeads,
      [
        { header: 'Applicant Name', accessor: (l) => l.name },
        { header: 'Email Address', accessor: (l) => l.email },
        { header: 'Phone Number', accessor: (l) => l.phone || 'N/A' },
        { header: 'Application Stage', accessor: (l) => l.applicationStage || 'REGISTERED' },
        { header: 'Monthly Salary', accessor: (l) => l.monthlySalary ? `₹${l.monthlySalary}` : 'Pending' },
        { header: 'Verified PAN', accessor: (l) => l.panNumber || 'Pending' },
        { header: 'Registered On', accessor: (l) => l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : 'N/A' },
      ]
    );
    toast.success(`Exported ${filteredLeads.length} lead records to CSV.`);
  };

  const filteredLeads = (data?.leads || []).filter((lead) => {
    // Stage filter
    if (selectedStage !== 'ALL' && lead.applicationStage !== selectedStage) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.phone && lead.phone.includes(q)) ||
      (lead.applicationStage && lead.applicationStage.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Module Title Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Applicant Assistance &amp; Follow-Up</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Module — Prospective Borrowers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reach out to applicants who created an account but need assistance submitting their application.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <Tooltip content="Export filtered leads to CSV spreadsheet" position="bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={loading || !data?.leads.length}
              className="gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 hover-lift cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </Tooltip>

          <Tooltip content="Refresh list of pending applicants" position="bottom">
            <button
              onClick={() => {
                fetchLeads();
                toast.info('Refreshing leads queue...');
              }}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer hover-lift"
              aria-label="Refresh list"
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

      {/* KPI Funnel Drop-off Cards with Info Tooltips */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 hover-lift transition-all cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Incomplete
              </span>
              <InfoTooltip content="Total registered applicants who have not yet submitted a finalized loan request." />
            </div>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {data.totalLeads}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Awaiting follow-up</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 hover-lift transition-all cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
                Step 1: Sign Up Only
              </span>
              <InfoTooltip content="Users who signed up but have not filled out their personal details or desired loan amount." />
            </div>
            <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
              {data.funnelCounts['REGISTERED'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Needs onboarding call</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 hover-lift transition-all cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                Step 2: Details Done
              </span>
              <InfoTooltip content="Users who provided their PAN and salary details, but still need to upload their salary slip." />
            </div>
            <span className="text-2xl font-black text-blue-700 font-mono mt-1 block">
              {data.funnelCounts['PERSONAL_INFO_COMPLETED'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Document pending</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 hover-lift transition-all cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
                Step 3: Docs Uploaded
              </span>
              <InfoTooltip content="Applicants who attached income proof, ready to select loan tenure and submit." />
            </div>
            <span className="text-2xl font-black text-indigo-700 font-mono mt-1 block">
              {data.funnelCounts['DOCUMENT_UPLOADED'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Ready for submission</span>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-sm text-slate-900">Applicants Awaiting Assistance</h2>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredLeads.length} of {data?.leads.length || 0})
            </span>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-text"
            />
          </div>
        </div>

        {/* Funnel Stage Filter Pills */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mr-1">
            <Filter className="w-3 h-3 mr-1 text-slate-400" />
            Stage:
          </span>
          {[
            { id: 'ALL', label: 'All Leads', count: data?.leads.length || 0 },
            { id: 'REGISTERED', label: 'Step 1: Sign Up Only', count: data?.funnelCounts['REGISTERED'] || 0 },
            { id: 'PERSONAL_INFO_COMPLETED', label: 'Step 2: Details Done', count: data?.funnelCounts['PERSONAL_INFO_COMPLETED'] || 0 },
            { id: 'DOCUMENT_UPLOADED', label: 'Step 3: Docs Uploaded', count: data?.funnelCounts['DOCUMENT_UPLOADED'] || 0 },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedStage(pill.id)}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer hover-lift ${
                selectedStage === pill.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {pill.label} ({pill.count})
            </button>
          ))}
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : !data || filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>
              {searchQuery || selectedStage !== 'ALL'
                ? 'No applicants match your filter criteria.'
                : 'Great job! No pending drop-off leads found. All registered borrowers have submitted their applications.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Applicant Name</th>
                  <th className="px-6 py-3">Contact Details</th>
                  <th className="px-6 py-3">Current Progress</th>
                  <th className="px-6 py-3">Declared Monthly Salary</th>
                  <th className="px-6 py-3">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const stageInfo = formatStage(lead.applicationStage);
                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{lead.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {lead._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{lead.email}</span>
                          <Tooltip content={copiedText === lead.email ? 'Copied to clipboard!' : 'Copy email address'} position="top">
                            <button
                              type="button"
                              onClick={() => handleCopy(lead.email)}
                              aria-label="Copy email"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
                            >
                              {copiedText === lead.email ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center space-x-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono text-[11px]">{lead.phone}</span>
                            <Tooltip content={copiedText === lead.phone ? 'Copied to clipboard!' : 'Copy phone number'} position="top">
                              <button
                                type="button"
                                onClick={() => handleCopy(lead.phone)}
                                aria-label="Copy phone number"
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
                              >
                                {copiedText === lead.phone ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Tooltip content={stageInfo.desc} position="top">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${stageInfo.color}`}>
                            {stageInfo.label}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800 text-sm block">
                          {lead.monthlySalary ? `₹${lead.monthlySalary.toLocaleString('en-IN')}` : 'Not entered yet'}
                        </span>
                        <span className="text-[10px] text-slate-400">Monthly net income</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <span className="font-medium text-slate-700 block">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400">Account created</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
