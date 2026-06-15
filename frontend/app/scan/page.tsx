"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, FileText, Code, Image, LogOut, Zap } from 'lucide-react'
import { createClient } from '../../lib/supabase'
import { scanText, scanCode, scanImage, setAuthToken, getCredits } from '../../lib/api'
import { motion } from 'framer-motion'
import ResultCard from '../components/ResultCard'
import Button from '../components/Button'

type Result = {
  slop_score: number
  verdict: string
  confidence: string
  features: Record<string, string>
  credits_remaining: number
} | null

export default function ScanPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'text' | 'code' | 'image'>('text')
  const [textInput, setTextInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [result, setResult] = useState<Result>(null)
  const [scanDuration, setScanDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [credits, setCredits] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setAuthToken(session.access_token)
      setUserEmail(session.user.email || '')
      const c = await getCredits()
      setCredits(c.credits_remaining)
    }
    init()
  }, [])

  const handleScan = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    setScanDuration(null)
    try {
      const start = performance.now()
      let res
      if (tab === 'text') res = await scanText(textInput)
      else if (tab === 'code') res = await scanCode(codeInput)
      else if (tab === 'image' && imageFile) res = await scanImage(imageFile)
      else throw new Error('Please provide input to scan.')
      const dur = Math.round(performance.now() - start)
      setResult(res)
      setScanDuration(dur)
      setCredits(res.credits_remaining)
    } catch (err: any) {
      const msg = err?.response?.data?.detail
      if (typeof msg === 'object') setError(msg.message)
      else setError(msg || err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const scoreColor = (score: number) =>
    score >= 65 ? 'text-red-400' : score >= 40 ? 'text-amber-400' : 'text-green-400'

  const scoreBarColor = (score: number) =>
    score >= 65 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-green-500'

  const tabs = [
    { key: 'text', label: 'Text', icon: <FileText size={14} /> },
    { key: 'code', label: 'Code', icon: <Code size={14} /> },
    { key: 'image', label: 'Image', icon: <Image size={14} /> },
  ] as const

  return (
    <main className="min-h-screen bg-[#0f1117]">

      {/* Navbar */}
      <nav className="border-b border-[#2e3348] px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="text-indigo-500" size={22} />
          <span className="text-lg font-bold text-white">
            Slop<span className="text-indigo-400">Guard</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/scan" className="bg-indigo-600 hover:bg-indigo-700 text-white 
                                        text-sm font-medium px-4 py-1.5 rounded-lg transition-colors
                                        flex items-center gap-1">
            <Zap size={14} /> New Scan
          </Link>
          <span className="text-[#8892a4] text-sm hidden md:block">{userEmail}</span>
          <button onClick={handleLogout} className="text-[#8892a4] hover:text-white">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">New Scan</h1>
            <p className="text-[#8892a4] text-sm mt-1">Scan text, code or images for sloppiness</p>
          </div>
          <div className="text-sm text-[#8892a4]">Credits: {credits ?? '–'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left — input */}
          <div className="md:col-span-2 bg-[#1a1d27] border border-[#2e3348] rounded-xl p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setResult(null); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    tab === t.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0f1117] text-[#8892a4] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Input area */}
            {tab === 'text' && (
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Paste any text here — blog post, essay, email..."
                className="w-full h-64 bg-[#0f1117] border border-[#2e3348] rounded-lg 
                           p-4 text-white text-sm placeholder-[#8892a4] resize-none
                           focus:outline-none focus:border-indigo-500 transition-colors"
              />
            )}

            {tab === 'code' && (
              <textarea
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                placeholder="Paste source code here..."
                className="w-full h-64 bg-[#0f1117] border border-[#2e3348] rounded-lg 
                           p-4 text-white text-sm placeholder-[#8892a4] resize-none font-mono
                           focus:outline-none focus:border-indigo-500 transition-colors"
              />
            )}

            {tab === 'image' && (
              <div className="h-64 border-2 border-dashed border-[#2e3348] rounded-lg 
                              flex flex-col items-center justify-center gap-3 
                              hover:border-indigo-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('imgInput')?.click()}
              >
                <Image size={32} className="text-[#8892a4]" />
                {imageFile ? (
                  <p className="text-white text-sm font-medium">{imageFile.name}</p>
                ) : (
                  <p className="text-[#8892a4] text-sm">Click to upload image</p>
                )}
                <input
                  id="imgInput" type="file" accept="image/*" className="hidden"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg 
                              px-4 py-3 text-red-400 text-sm">
                {error}
                {error.includes('free scans') && (
                  <Link href="/pricing" className="ml-2 text-indigo-400 underline">Upgrade to Pro →</Link>
                )}
              </div>
            )}

            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
                         text-white font-semibold py-3 rounded-lg transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin">⚡</span> Analysing...</>
              ) : (
                <><Zap size={16} /> Scan Now</>
              )}
            </button>
          </div>

          {/* Right — Result */}
          <div className="bg-[#1a1d27] border border-[#2e3348] rounded-xl p-6 min-h-[240px]">
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center gap-3">
                <Shield size={48} className="text-[#2e3348]" />
                <p className="text-[#8892a4] text-sm">Your results will appear here</p>
              </motion.div>
            )}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center gap-3">
                <div className="animate-spin text-4xl">⚡</div>
                <p className="text-[#8892a4] text-sm">Analysing content...</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
                <ResultCard result={result as any} duration={scanDuration ?? undefined} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
