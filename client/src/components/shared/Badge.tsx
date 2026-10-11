import React from 'react';
import { LoanStatus, UserRole } from '../../types';
import { Badge } from '../ui/badge';

export const StatusBadge: React.FC<{ status: LoanStatus | string }> = ({ status }) => {
  switch (status) {
    case LoanStatus.APPLIED:
      return (
        <Badge variant="blue" className="gap-1.5 font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          APPLIED
        </Badge>
      );
    case LoanStatus.SANCTIONED:
      return (
        <Badge variant="warning" className="gap-1.5 font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          SANCTIONED
        </Badge>
      );
    case LoanStatus.DISBURSED:
      return (
        <Badge variant="purple" className="gap-1.5 font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          DISBURSED
        </Badge>
      );
    case LoanStatus.CLOSED:
      return (
        <Badge variant="success" className="gap-1.5 font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          CLOSED (SETTLED)
        </Badge>
      );
    case LoanStatus.REJECTED:
      return (
        <Badge variant="destructive" className="gap-1.5 font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          REJECTED
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="font-medium">
          {status}
        </Badge>
      );
  }
};

export const RoleBadge: React.FC<{ role: UserRole | string }> = ({ role }) => {
  switch (role) {
    case UserRole.ADMIN:
      return <Badge variant="destructive" className="font-bold">ADMIN</Badge>;
    case UserRole.SALES:
      return <Badge variant="blue" className="font-bold">SALES</Badge>;
    case UserRole.SANCTION:
      return <Badge variant="warning" className="font-bold">SANCTION</Badge>;
    case UserRole.DISBURSEMENT:
      return <Badge variant="purple" className="font-bold">DISBURSEMENT</Badge>;
    case UserRole.COLLECTION:
      return <Badge variant="success" className="font-bold">COLLECTION</Badge>;
    case UserRole.BORROWER:
      return <Badge variant="secondary" className="font-bold">BORROWER</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};
