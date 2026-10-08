import React from 'react';
import type { DoseStatus, StockStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }[variant];

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeStyles} ${variantStyles} ${className}`}>
      {children}
    </span>
  );
};

export const StockBadge: React.FC<{ status: StockStatus; currentStock: number }> = ({ status, currentStock }) => {
  if (status === 'out_of_stock') {
    return (
      <Badge variant="danger">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
        Out of Stock (0)
      </Badge>
    );
  }
  if (status === 'low') {
    return (
      <Badge variant="warning">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        Low Stock ({currentStock})
      </Badge>
    );
  }
  return (
    <Badge variant="success">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
      Normal ({currentStock})
    </Badge>
  );
};

export const DoseStatusBadge: React.FC<{ status: DoseStatus }> = ({ status }) => {
  if (status === 'taken') {
    return (
      <Badge variant="success">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        Taken
      </Badge>
    );
  }
  if (status === 'missed') {
    return (
      <Badge variant="danger">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
        Missed
      </Badge>
    );
  }
  return (
    <Badge variant="info">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5" />
      Pending
    </Badge>
  );
};
