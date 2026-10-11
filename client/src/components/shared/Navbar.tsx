'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { RoleBadge } from './Badge';
import { Button } from '../ui/button';
import { Landmark, LogOut, LogIn, UserCheck, Shield, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const getNavLinks = () => {
    if (!user) {
      return [
        { href: '/borrower/apply', label: 'Apply for Loan' },
        { href: '/login', label: 'Sign In' },
      ];
    }

    if (user.role === UserRole.BORROWER) {
      return [
        { href: '/borrower/apply', label: 'Apply for Loan' },
        { href: '/borrower/dashboard', label: 'My Loans' },
      ];
    }

    if (user.role === UserRole.ADMIN) {
      return [
        { href: '/ops/admin', label: 'Overview' },
        { href: '/ops/sales', label: 'Sales' },
        { href: '/ops/sanction', label: 'Sanction' },
        { href: '/ops/disbursement', label: 'Disbursement' },
        { href: '/ops/collection', label: 'Collection' },
      ];
    }

    if (user.role === UserRole.SALES) {
      return [{ href: '/ops/sales', label: 'Sales Leads' }];
    }

    if (user.role === UserRole.SANCTION) {
      return [{ href: '/ops/sanction', label: 'Sanction Queue' }];
    }

    if (user.role === UserRole.DISBURSEMENT) {
      return [{ href: '/ops/disbursement', label: 'Disbursement Queue' }];
    }

    if (user.role === UserRole.COLLECTION) {
      return [{ href: '/ops/collection', label: 'Collection Module' }];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-[37px] z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-all">
                <Landmark className="w-5 h-5 text-indigo-100" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
                    CredPulse
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    LMS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Enterprise Lending Platform
                </span>
              </div>
            </Link>

            <div className="hidden md:flex md:space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900">{user.name}</span>
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="mt-0.5">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gap-1.5 shadow-md shadow-indigo-600/20">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Apply Now</span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
              </div>
              <RoleBadge role={user.role} />
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {!user && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full justify-center">
                    <UserCheck className="w-4 h-4 mr-1.5" />
                    <span>Apply Now</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
