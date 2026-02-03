'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
  secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, className = '', disabled, isLoading, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none
        ${variantClass[variant]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>処理中...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
);

Button.displayName = 'Button';
