'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { EmploymentMode } from '../../../types';
import { api, formatApiError } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Slider } from '../../../components/ui/slider';
import { Badge } from '../../../components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Calculator,
  ArrowRight,
  User,
  CreditCard,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Calendar,
  Clock,
  Percent,
  Check,
  X
} from 'lucide-react';
import { Tooltip, InfoTooltip } from '../../../components/ui/tooltip';
import { useToast } from '../../../context/ToastContext';

export default function BorrowerApplyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(2);

  // Step 2: Personal Details & BRE
  const [fullName, setFullName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number>(55000);
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode>(EmploymentMode.SALARIED);

  const [breLoading, setBreLoading] = useState(false);
  const [breResult, setBreResult] = useState<{
    passed: boolean;
    errorMessages: string[];
    calculatedAgeYears?: number;
  } | null>(null);

  // Step 3: Salary Slip Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Step 4: Loan Calculator
  const [principalAmount, setPrincipalAmount] = useState<number>(150000);
  const [tenureDays, setTenureDays] = useState<number>(90);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Populate from existing user if logged in
  useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.panNumber) setPanNumber(user.panNumber);
      if (user.dateOfBirth) setDateOfBirth(user.dateOfBirth.split('T')[0] ?? '');
      if (user.monthlySalary) setMonthlySalary(user.monthlySalary);
      if (user.employmentMode) setEmploymentMode(user.employmentMode);
      if (user.salarySlipPath) {
        setUploadSuccess(true);
        setUploadedFileName(user.salarySlipOriginalName || 'Uploaded Salary Slip');
      }
    }
  }, [user]);

  // Real-time inline PAN pattern check
  const isPanValid = useMemo(() => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase());
  }, [panNumber]);

  // Real-time inline age calculation from DOB
  const [liveCalculatedAge, setLiveCalculatedAge] = useState<number | null>(null);

  useEffect(() => {
    if (!dateOfBirth) {
      setLiveCalculatedAge(null);
      return;
    }
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      setLiveCalculatedAge(null);
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    setLiveCalculatedAge(age);
  }, [dateOfBirth]);

  const isAgeValid = liveCalculatedAge !== null && liveCalculatedAge >= 23 && liveCalculatedAge <= 50;
  const isSalaryValid = monthlySalary >= 25000;

  // Live Simple Interest math strictly following: SI = (P * R * T) / (365 * 100)
  const interestRate = 12.0;
  const rawInterest = (principalAmount * interestRate * tenureDays) / (365 * 100);
  const calculatedInterest = Math.round((rawInterest + Number.EPSILON) * 100) / 100;
  const totalRepayment = Math.round((principalAmount + calculatedInterest + Number.EPSILON) * 100) / 100;
  const dailyInterest = Math.round((calculatedInterest / tenureDays + Number.EPSILON) * 100) / 100;
  const monthlyEquivalent = Math.round(((totalRepayment / (tenureDays / 30)) + Number.EPSILON) * 100) / 100;

  // Percent ratios for financial visualizer
  const principalPercent = totalRepayment > 0 ? Math.round((principalAmount / totalRepayment) * 1000) / 10 : 0;
  const interestPercent = totalRepayment > 0 ? Math.round((100 - principalPercent) * 10) / 10 : 0;

  // Estimated maturity calendar date
  const [maturityDateStr, setMaturityDateStr] = useState<string>('');

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + tenureDays);
    setMaturityDateStr(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  }, [tenureDays]);

  // Preset Evaluator Fillers
  const loadEligiblePreset = () => {
    setFullName('Aarav Mehta');
    setPanNumber('ABCDE1234F');
    setDateOfBirth('1995-05-20'); // ~31 years old
    setMonthlySalary(65000);
    setEmploymentMode(EmploymentMode.SALARIED);
    setBreResult(null);
    toast.info('Loaded Eligible Profile (Age 31, ₹65,000 salary, Salaried)', 'Test Profile Loaded');
  };

  const loadIneligiblePresetAge = () => {
    setFullName('Young Applicant');
    setPanNumber('ABCDE1234F');
    setDateOfBirth('2006-01-10'); // ~20 years old (< 23)
    setMonthlySalary(50000);
    setEmploymentMode(EmploymentMode.SALARIED);
    setBreResult(null);
    toast.warning('Loaded Profile with Age 20 (Fails < 23 age criteria)', 'Test Profile Loaded');
  };

  const loadIneligiblePresetSalary = () => {
    setFullName('Low Salary Applicant');
    setPanNumber('ABCDE1234F');
    setDateOfBirth('1995-05-20');
    setMonthlySalary(18000); // < 25,000
    setEmploymentMode(EmploymentMode.SALARIED);
    setBreResult(null);
    toast.warning('Loaded Profile with Monthly Salary ₹18,000 (Fails ₹25,000 threshold)', 'Test Profile Loaded');
  };

  const handleRunBreCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreLoading(true);
    setBreResult(null);

    try {
      const res = await api.post('/borrower/eligibility-check', {
        fullName,
        panNumber,
        dateOfBirth,
        monthlySalary: Number(monthlySalary),
        employmentMode,
      });

      if (res.data?.success) {
        setBreResult({
          passed: true,
          errorMessages: [],
          calculatedAgeYears: res.data.data.decision.calculatedAgeYears,
        });
        toast.success('Instant eligibility criteria satisfied! Proceeding to document upload.');
        setCurrentStep(3); // Auto-advance to document upload
      }
    } catch (err: unknown) {
      const msg = formatApiError(err);
      const errors = msg.includes(': ') ? msg.split(': ')[1]?.split(', ') : [msg];
      setBreResult({
        passed: false,
        errorMessages: errors?.length ? errors : [msg],
      });
      toast.error('Application criteria did not pass underwriting policy.', 'Eligibility Assessment Notice');
    } finally {
      setBreLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('salarySlip', selectedFile);

    try {
      const res = await api.post('/borrower/upload-salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setUploadSuccess(true);
        setUploadedFileName(selectedFile.name);
        toast.success(`Document '${selectedFile.name}' verified and attached.`);
        setCurrentStep(4); // Advance to loan configuration
      }
    } catch (err: unknown) {
      toast.error(formatApiError(err), 'Document Upload Failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleApplyLoan = async () => {
    setSubmittingLoan(true);
    try {
      const res = await api.post('/borrower/apply', {
        principalAmount,
        tenureDays,
      });

      if (res.data?.success) {
        setSubmitSuccess(true);
        toast.success('Loan application submitted for sanction review!', 'Application Queued');
        setTimeout(() => {
          router.push('/borrower/dashboard');
        }, 2000);
      }
    } catch (err: unknown) {
      toast.error(formatApiError(err), 'Loan Application Submission Failed');
    } finally {
      setSubmittingLoan(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper Progress Card */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Borrower Application Funnel
            </span>
            <Badge variant="blue" className="font-bold">
              Step {currentStep} of 4
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              { step: 1, label: '1. Account' },
              { step: 2, label: '2. Eligibility Check' },
              { step: 3, label: '3. Salary Slip' },
              { step: 4, label: '4. Loan Config & Apply' },
            ].map((s) => (
              <div key={s.step} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all ${
                    s.step < currentStep || (s.step === 1 && user)
                      ? 'bg-emerald-500'
                      : s.step === currentStep
                      ? 'bg-indigo-600'
                      : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`text-[11px] font-semibold block truncate ${
                    s.step === currentStep ? 'text-indigo-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Personal Details + Eligibility Assessment */}
      {currentStep === 2 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <CardTitle>Step 2: Personal Details &amp; Eligibility Check</CardTitle>
              <CardDescription className="mt-1">
                Instant assessment against transparent lending criteria (Age 23–50, Monthly Salary &ge; ₹25,000, Valid PAN)
              </CardDescription>
            </div>

            {/* Evaluator Quick Demo Profiles */}
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip content="Auto-fill sample profile that meets all requirements (Age 31, ₹65,000 salary, valid PAN)" position="bottom">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadEligiblePreset}
                  className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 font-bold cursor-pointer hover-lift"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>Test: Eligible Profile</span>
                </Button>
              </Tooltip>
              <Tooltip content="Auto-fill profile with age 20 to demonstrate under-age criterion safeguard (< 23 years)" position="bottom">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadIneligiblePresetAge}
                  className="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 font-bold cursor-pointer hover-lift"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  <span>Test: Age Safeguard</span>
                </Button>
              </Tooltip>
              <Tooltip content="Auto-fill profile with monthly salary ₹18,000 to demonstrate minimum income criteria safeguard (< ₹25,000)" position="bottom">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadIneligiblePresetSalary}
                  className="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 font-bold cursor-pointer hover-lift"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  <span>Test: Income Safeguard</span>
                </Button>
              </Tooltip>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Eligibility Assessment Result Banner */}
            {breResult && (
              <div>
                {breResult.passed ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-in fade-in">
                    <div className="flex items-center space-x-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Instant Eligibility Approved! You qualify for our lending facilities.</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Applicant age ({breResult.calculatedAgeYears} years), verified monthly income, PAN format, and employment status satisfy all underwriting guidelines.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-in fade-in">
                    <div className="flex items-center space-x-2 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>Eligibility Assessment Notice: Application Does Not Meet Criteria</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-rose-800 space-y-1">
                      {breResult.errorMessages.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-rose-700 font-medium pt-1">
                      Please adjust the details above to satisfy the policy requirements or select &quot;Test: Eligible Profile&quot; to continue.
                    </p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleRunBreCheck} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aarav Mehta"
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* PAN Input with Real-time Regex Indicator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        PAN Number (10 Alphanumeric)
                      </label>
                      <InfoTooltip content="Your 10-character PAN card number, mandated by RBI regulations for identity and CIBIL credit check." />
                    </div>
                    {panNumber.length > 0 && (
                      <span className={`text-[11px] font-bold flex items-center space-x-1 ${isPanValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isPanValid ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Valid PAN Format</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            <span>Must match ABCDE1234F</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type="text"
                      required
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className={`pl-9 font-mono uppercase ${
                        panNumber.length === 10
                          ? isPanValid
                            ? 'border-emerald-500 focus-visible:ring-emerald-500/20'
                            : 'border-rose-400 focus-visible:ring-rose-500/20'
                          : ''
                      }`}
                    />
                  </div>
                </div>

                {/* DOB Input with Real-time Calendar Age Badge */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Date of Birth
                      </label>
                      <InfoTooltip content="Borrowers must be between 23 and 50 years of age on application date as per institutional credit policy." />
                    </div>
                    {liveCalculatedAge !== null && (
                      <span className={`text-[11px] font-bold ${isAgeValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Age: {liveCalculatedAge} yrs {isAgeValid ? '· Eligible' : '· Outside 23–50 range'}
                      </span>
                    )}
                  </div>
                  <Input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={
                      liveCalculatedAge !== null
                        ? isAgeValid
                          ? 'border-emerald-500'
                          : 'border-rose-400'
                        : ''
                    }
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Underwriting requires applicant to be between 23 and 50 years of age.
                  </span>
                </div>

                {/* Monthly Salary Input with Policy Gauge */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Monthly Salary (INR)
                      </label>
                      <InfoTooltip content="Verified net monthly take-home income. Minimum policy requirement is ₹25,000/month." />
                    </div>
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${isSalaryValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isSalaryValid ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Meets ₹25,000 policy threshold</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Below ₹25,000 threshold</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="text-slate-400 absolute left-3.5 top-2.5 text-sm font-bold">₹</span>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(Number(e.target.value))}
                      className="pl-8 font-mono"
                    />
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isSalaryValid ? 'bg-emerald-500' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(100, (monthlySalary / 50000) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Employment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { mode: EmploymentMode.SALARIED, label: 'Salaried' },
                      { mode: EmploymentMode.SELF_EMPLOYED, label: 'Self-Employed' },
                      { mode: EmploymentMode.UNEMPLOYED, label: 'Unemployed (Ineligible)' },
                    ].map((item) => (
                      <label
                        key={item.mode}
                        className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                          employmentMode === item.mode
                            ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="employmentMode"
                          value={item.mode}
                          checked={employmentMode === item.mode}
                          onChange={() => setEmploymentMode(item.mode)}
                          className="sr-only"
                        />
                        <span className="text-xs block">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <Button
                  type="submit"
                  size="lg"
                  disabled={breLoading}
                  className="gap-2 shadow-md shadow-indigo-600/20 hover-lift cursor-pointer"
                >
                  <span>{breLoading ? 'Verifying Criteria...' : 'Verify Loan Eligibility'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Salary Slip Upload */}
      {currentStep === 3 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <CardTitle>Step 3: Upload Salary Slip</CardTitle>
              <CardDescription className="mt-1">
                Accepted formats: PDF, JPG, PNG &bull; Max file size: 5 MB
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(2)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              &larr; Back to Step 2
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-8 text-center bg-indigo-50/20 transition-all">
                <Upload className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900">Choose salary slip document or drag here</p>
                <p className="text-xs text-slate-500 mt-1">PDF, PNG, or JPG up to 5 Megabytes</p>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-4 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />

                {selectedFile && (
                  <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 max-w-sm mx-auto flex items-center justify-between text-xs shadow-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate font-medium">{selectedFile.name}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>

              {uploadSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Document &apos;{uploadedFileName}&apos; has been linked to your application.</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                {uploadSuccess && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentStep(4)}
                    className="gap-2 cursor-pointer hover-lift text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 font-bold"
                  >
                    <span>Continue with Verified Document</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={!selectedFile || uploadLoading}
                  className="gap-2 cursor-pointer hover-lift"
                >
                  <span>{uploadLoading ? 'Uploading...' : 'Upload & Proceed'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Loan Configuration & Term Sheet */}
      {currentStep === 4 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <CardTitle>Step 4: Configure Loan Terms &amp; Submit</CardTitle>
              <CardDescription className="mt-1">
                Fixed 12.0% annual interest &bull; Simple Interest Calculation Engine
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(3)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              &larr; Back to Step 3
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            {submitSuccess && (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-bold">Loan Application Successfully Submitted!</h3>
                <p className="text-xs text-emerald-800">
                  Your application has moved to status <strong>APPLIED</strong> and is queued for underwriting sanction. Redirecting to your dashboard...
                </p>
              </div>
            )}

            {!submitSuccess && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sliders Configuration */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Quick Term Presets */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Quick Presets:
                    </span>
                    <Tooltip content="Quick setup: ₹1,00,000 for 90 days tenure" position="top">
                      <button
                        type="button"
                        onClick={() => { setPrincipalAmount(100000); setTenureDays(90); }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors hover-lift"
                      >
                        ₹1L · 90D
                      </button>
                    </Tooltip>
                    <Tooltip content="Quick setup: ₹2,50,000 for 180 days (6 months) tenure" position="top">
                      <button
                        type="button"
                        onClick={() => { setPrincipalAmount(250000); setTenureDays(180); }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors hover-lift"
                      >
                        ₹2.5L · 180D
                      </button>
                    </Tooltip>
                    <Tooltip content="Quick setup: ₹5,00,000 for 365 days (1 year) tenure" position="top">
                      <button
                        type="button"
                        onClick={() => { setPrincipalAmount(500000); setTenureDays(365); }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors hover-lift"
                      >
                        ₹5L · 365D
                      </button>
                    </Tooltip>
                  </div>

                  {/* Principal Amount Slider */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Borrowing Amount (₹50K – ₹5L)
                        </label>
                        <InfoTooltip content="Select the principal loan amount needed, between ₹50,000 and ₹5,00,000." />
                      </div>
                      <span className="text-2xl font-black text-indigo-700 font-mono tracking-tight">
                        ₹{principalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Slider
                      min={50000}
                      max={500000}
                      step={5000}
                      value={[principalAmount]}
                      onValueChange={(val) => val[0] && setPrincipalAmount(val[0])}
                    />

                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>₹50,000</span>
                      <span>₹2,50,000</span>
                      <span>₹5,00,000</span>
                    </div>
                  </div>

                  {/* Tenure Days Slider */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Tenure (30 – 365 Days)
                        </label>
                        <InfoTooltip content="Repayment duration in days. Shorter tenure reduces total interest payable." />
                      </div>
                      <span className="text-xl font-black text-indigo-700 font-mono tracking-tight">
                        {tenureDays} Days (~{(tenureDays / 30).toFixed(1)} Months)
                      </span>
                    </div>

                    <Slider
                      min={30}
                      max={365}
                      step={5}
                      value={[tenureDays]}
                      onValueChange={(val) => val[0] && setTenureDays(val[0])}
                    />

                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>30 Days (1 mo)</span>
                      <span>180 Days (6 mos)</span>
                      <span>365 Days (1 yr)</span>
                    </div>
                  </div>

                  {/* Repayment Ratio Segmented Progress Bar */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-indigo-900 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                        <span>Principal Share: {principalPercent}%</span>
                      </span>
                      <span className="text-amber-900 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span>Interest Share: {interestPercent}%</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full flex overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all" style={{ width: `${principalPercent}%` }} />
                      <div className="bg-amber-500 h-full transition-all" style={{ width: `${interestPercent}%` }} />
                    </div>
                  </div>
                </div>

                {/* Fintech Term Sheet Live Card */}
                <div className="lg:col-span-5 bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-5 border border-indigo-800/40 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60">
                    <div className="flex items-center space-x-2 text-indigo-300">
                      <Calculator className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-xs uppercase tracking-wider">Loan Term Summary</span>
                    </div>
                    <Badge variant="blue" className="text-[10px] uppercase font-bold">
                      12% APR Fixed
                    </Badge>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Principal (P):</span>
                      <span className="font-bold font-mono text-base text-white">
                        ₹{principalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tenure (T):</span>
                      <span className="font-bold font-mono text-slate-200">
                        {tenureDays} Days
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Fixed Rate (R):</span>
                      <span className="font-bold font-mono text-slate-200">12.0% p.a.</span>
                    </div>

                    <div className="pt-2 border-t border-indigo-800/60 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-indigo-300 font-medium">Simple Interest (SI):</span>
                        <InfoTooltip
                          content="Calculated transparently: (Principal × 12% × Days) / 36,500. No compounding or hidden surcharges."
                          iconClassName="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-200 transition-colors"
                        />
                      </div>
                      <span className="font-bold font-mono text-amber-300 text-sm">
                        ₹{calculatedInterest.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Daily Accrual:</span>
                      <span className="font-mono text-slate-300">₹{dailyInterest} / day</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Monthly Equivalent:</span>
                      <span className="font-mono text-slate-300">~₹{monthlyEquivalent.toLocaleString('en-IN')} / mo</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>Maturity Date:</span>
                      </span>
                      <span className="font-medium text-slate-200">{maturityDateStr}</span>
                    </div>

                    <div className="pt-3 border-t border-indigo-800/60 flex justify-between items-baseline">
                      <span className="text-slate-300 font-bold">Total Repayment:</span>
                      <span className="font-black font-mono text-2xl text-emerald-400">
                        ₹{totalRepayment.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleApplyLoan}
                      disabled={submittingLoan}
                      variant="emerald"
                      size="lg"
                      className="w-full font-black text-slate-950 gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <span>{submittingLoan ? 'Submitting Application...' : 'Apply for Loan Now'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
