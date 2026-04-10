'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, LogOut, Zap, FileText, Code, Image, Clock } from 'lucide-react'
import { createClient } from '../../lib/supabase'
import { getHistory, setAuthToken } from '../../lib/api'

type Scan = {
  id: string
  modality: string
  slop_score: number
  verdict: string
  confidence: string
  input_preview: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setAuthToken(session.access_token)
      setUserEmail(session.user.email || '')
      const data = await getHistory(50, 0)
      setScans(data.scans)
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filtered = filter === 'all' ? scans : scans.filter(s => s.modality === filter)

  const scoreColor = (score: number) =>
    score >= 65 ? 'text-red-400' : score >= 40 ? 'text-amber-400' : 'text-green-400'

  const scoreBg = (score: number) =>
    score >= 65 ? 'bg-red-500/10 border-red-500/20' : 
    score >= 40 ? 'bg-amber-500/10 border-amber-500/20' : 
    'bg-green-500/10 border-green-500/20'

  const modalityIcon = (m: string) => {
    if (m === 'text') return <FileText size={14} />
    if (m === 'code') return <Code size={14} />
    return <Image size={14} />
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    })
  }

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

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Scan History</h1>
            <p className="text-[#8892a4] text-sm mt-1">{scans.length} total scans</p>
          </div>

          {/* Stats */}
          <div className="hidden md:flex gap-4">
            {[
              { label: 'Text', count: scans.filter(s => s.modality === 'text').length, icon: '📝' },
              { label: 'Code', count: scans.filter(s => s.modality === 'code').length, icon: '💻' },
              { label: 'Image', count: scans.filter(s => s.modality === 'image').length, icon: '🖼️' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#1a1d27] border border-[#2e3348] 
                                                rounded-lg px-4 py-2 text-center">
                <div className="text-white font-bold">{stat.count}</div>
                <div className="text-[#8892a4] text-xs">{stat.icon} {stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'text', 'code', 'image'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1a1d27] border border-[#2e3348] text-[#8892a4] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Scan list */}
        {loading ? (
          <div className="text-center py-20 text-[#8892a4]">Loading history...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Shield size={48} className="text-[#2e3348] mx-auto mb-4" />
            <p className="text-[#8892a4]">No scans yet.</p>
            <Link href="/scan" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Run your first scan →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(scan => (
              <div key={scan.id}
                className="bg-[#1a1d27] border border-[#2e3348] rounded-xl p-4 
                           hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Score badge */}
                    <div className={`border rounded-lg px-3 py-1.5 text-center min-w-[60px] ${scoreBg(scan.slop_score)}`}>
                      <div className={`text-lg font-bold ${scoreColor(scan.slop_score)}`}>
                        {scan.slop_score}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8892a4] flex items-center gap-1 text-xs capitalize">
                          {modalityIcon(scan.modality)} {scan.modality}
                        </span>
                        <span className="text-[#2e3348]">·</span>
                        <span className="text-[#8892a4] text-xs">{scan.confidence} confidence</span>
                      </div>
                      <p className="text-white text-sm font-medium mt-0.5">{scan.verdict}</p>
                      {scan.input_preview && (
                        <p className="text-[#8892a4] text-xs mt-1 truncate max-w-sm">
                          {scan.input_preview}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-[#8892a4] text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(scan.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}