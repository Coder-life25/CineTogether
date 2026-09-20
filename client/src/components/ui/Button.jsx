import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({ variant = 'primary', size = 'md', loading, disabled, icon: Icon, children, className = '', ...rest }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary';
  
  const variants = {
    primary: 'bg-gradient-to-r from-accent to-accent-glow text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 border border-accent-glow/50',
    secondary: 'bg-secondary text-text-primary border border-border hover:bg-elevated hover:border-text-secondary/50',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-secondary/50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </motion.button>
  );
};
