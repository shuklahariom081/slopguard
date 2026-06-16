'use client'

import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: Props) {
  const base =
    'font-semibold py-2 px-4 rounded-lg inline-flex items-center justify-center gap-2 ' +
    'text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1117] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed'

  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-transparent border border-[#2e3348] text-[#e2e8f0] hover:border-indigo-500 hover:text-white',
    ghost: 'bg-transparent text-[#8892a4] hover:text-white hover:bg-white/5',
  }

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}