import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    required = false,
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 tracking-wide flex items-center justify-between">
          <span>
            {label} {required && <span className="text-red-500 font-bold">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`
            w-full rounded-lg border bg-white text-slate-900 text-sm transition-all duration-150
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            min-h-[40px] px-3.5 py-2
            ${Icon ? 'pl-9' : ''}
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-300 hover:border-slate-400 focus:border-[#0059bb] focus:ring-blue-100'
            }
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <span className="text-xs text-red-600 font-medium mt-0.5 flex items-center gap-1">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span className="text-xs text-slate-500 mt-0.5">
          {helperText}
        </span>
      )}
    </div>
  );
});

export default Input;
