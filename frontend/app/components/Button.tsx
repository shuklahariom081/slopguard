'use client'

import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'font-semibold py-2 px-4 rounded-lg inline-flex items-center justify-center gap-2'
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-transparent border border-[#2e3348] text-[#e2e8f0] hover:border-indigo-500',
    ghost: 'bg-transparent text-[#8892a4] hover:text-white',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props} />
  )
}
