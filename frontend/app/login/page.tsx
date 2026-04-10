'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email for a confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/scan')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Shield className="text-indigo-500" size={32} />
            <span className="text-2xl font-bold text-white">
              Slop<span className="text-indigo-400">Guard</span>
            </span>
          </Link>
          <p className="text-[#8892a4] mt-2 text-sm">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1d27] border border-[#2e3348] rounded-2xl p-8">

          {/* Toggle */}
          <div className="flex bg-[#0f1117] rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                !isSignUp ? 'bg-indigo-600 text-white' : 'text-[#8892a4] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                isSignUp ? 'bg-indigo-600 text-white' : 'text-[#8892a4] hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-[#8892a4] text-sm mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892a4]" size={16} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0f1117] border border-[#2e3348] rounded-lg 
                           pl-10 pr-4 py-2.5 text-white text-sm placeholder-[#8892a4]
                           focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="text-[#8892a4] text-sm mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892a4]" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0f1117] border border-[#2e3348] rounded-lg 
                           pl-10 pr-10 py-2.5 text-white text-sm placeholder-[#8892a4]
                           focus:outline-none focus:border-indigo-500 transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error / Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 
                            text-red-400 text-sm mb-4">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 
                            text-green-400 text-sm mb-4">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 
                       disabled:cursor-not-allowed text-white font-semibold py-2.5 
                       rounded-lg transition-all duration-200"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          {/* Divider */}
          <p className="text-center text-[#8892a4] text-sm mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-400 hover:text-indigo-300"
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>

        {/* Back */}
        <p className="text-center text-[#8892a4] text-sm mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}