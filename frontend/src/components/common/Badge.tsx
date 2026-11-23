import React from 'react';

interface BadgeProps {
  variant: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ADMIN' | 'EMPLOYEE' | 'IN' | 'OUT';
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, label }) => {
  switch (variant) {
    case 'IN_STOCK':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full"></span>
          {label || 'In Stock'}
        </span>
      );
    case 'LOW_STOCK':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 mr-1.5 bg-amber-500 rounded-full animate-pulse"></span>
          {label || 'Low Stock'}
        </span>
      );
    case 'OUT_OF_STOCK':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 mr-1.5 bg-rose-500 rounded-full"></span>
          {label || 'Out of Stock'}
        </span>
      );
    case 'ADMIN':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          Admin
        </span>
      );
    case 'EMPLOYEE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          Staff
        </span>
      );
    case 'IN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
          + IN
        </span>
      );
    case 'OUT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
          - OUT
        </span>
      );
    default:
      return null;
  }
};
