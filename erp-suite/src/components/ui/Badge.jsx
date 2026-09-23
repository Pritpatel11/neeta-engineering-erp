import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-red-50 text-red-700 border-red-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    brand: 'bg-blue-50 text-[#0059bb] border-blue-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const dotColor = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    brand: 'bg-[#0059bb]',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
    draft: 'bg-slate-400',
  };

  const chosenSize = sizeStyles[size] || sizeStyles.md;
  const chosenVariant = variantStyles[variant] || variantStyles.neutral;
  const chosenDot = dotColor[variant] || dotColor.neutral;

  return (
    <span
      className={`inline-flex items-center rounded-full border leading-none tracking-wide select-none ${chosenSize} ${chosenVariant} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${chosenDot}`} />}
      {children}
    </span>
  );
}
