"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, FileText, Code, Image, LogOut, History, Zap } from 'lucide-react'
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
                  onClick={() => { setTab(t.key); setResult(null); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    tab === t.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0f1117] text-[#8892a4] hover:text-white'
                  }`}
                >
                  {t.label}
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
          <div className="bg-[#1a1d27] border border-[#2e3348] rounded-xl p-6">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <Shield size={48} className="text-[#2e3348]" />
                <p className="text-[#8892a4] text-sm">Your results will appear here</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="animate-spin text-4xl">⚡</div>
                <p className="text-[#8892a4] text-sm">Analysing content...</p>
              </div>
            )}

            {result && !loading && (
              <div>
                {/* Score */}
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${scoreColor(result.slop_score)}`}>
                    {result.slop_score}
                  </div>
                  <div className="text-[#8892a4] text-sm mt-1">out of 100</div>

                  {/* Bar */}
                  <div className="w-full bg-[#0f1117] rounded-full h-3 mt-4">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${scoreBarColor(result.slop_score)}`}
                      style={{ width: `${result.slop_score}%` }}
                    />
                  </div>
                </div>

                {/* Verdict */}
                <div className="bg-[#0f1117] rounded-lg px-4 py-3 mb-4 text-center">
                  <p className="text-white font-semibold">{result.verdict}</p>
                  <p className="text-[#8892a4] text-xs mt-1">Confidence: {result.confidence}</p>
                </div>

                {/* Features */}
                <div>
                  <p className="text-[#8892a4] text-xs font-medium uppercase tracking-wider mb-3">
                    Feature Breakdown
                  </p>
                  <div className="space-y-2">
                    {Object.entries(result.features).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center 
                                               border-b border-[#2e3348] pb-2">
                        <span className="text-[#8892a4] text-xs">{k}</span>
                        <span className="text-white text-xs font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}