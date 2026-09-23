import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[46px]',
    icon: 'p-2 min-h-[36px] min-w-[36px] rounded-full aspect-square',
  };

  const variantStyles = {
    primary: 'bg-[#0059bb] hover:bg-[#004c9e] text-white shadow-sm hover:shadow focus-visible:ring-[#0059bb]',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 focus-visible:ring-slate-400',
    outline: 'bg-transparent border border-[#0059bb] text-[#0059bb] hover:bg-blue-50 focus-visible:ring-[#0059bb]',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow focus-visible:ring-red-500',
    dangerOutline: 'bg-transparent border border-red-300 text-red-600 hover:bg-red-50 focus-visible:ring-red-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-300',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-500',
  };

  const chosenSize = variant === 'icon' ? sizeStyles.icon : (sizeStyles[size] || sizeStyles.md);
  const chosenVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${chosenSize} ${chosenVariant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0 text-current" />}
          {children}
        </>
      )}
    </button>
  );
}
