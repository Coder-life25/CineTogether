import React from 'react';

export const Input = React.forwardRef(({ label, error, icon: Icon, className = '', ...rest }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-text-secondary" />
          </div>
        )}
        <input
          ref={ref}
          className={`block w-full bg-secondary border ${error ? 'border-accent' : 'border-border'} rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent transition-colors sm:text-sm ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 ${className}`}
          {...rest}
        />
      </div>
      {error && <p className="mt-1 text-sm text-accent">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
