import Link from 'next/link'
import { Shield, FileText, Code, Image, Zap, Lock, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1117]">

      {/* Navbar */}
      <nav className="border-b border-[#2e3348] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="text-indigo-500" size={24} />
          <span className="text-xl font-bold text-white">Slop<span className="text-indigo-400">Guard</span></span>
        </div>
        <div className="flex gap-4">
          <Link href="/pricing" className="text-[#8892a4] hover:text-white transition-colors text-sm">Pricing</Link>
          <Link href="/login" className="btn-primary text-sm py-1.5 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 
                        rounded-full px-4 py-1.5 text-indigo-400 text-sm mb-8">
          <Zap size={14} /> Free 10 scans per day — no credit card needed
        </div>
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Detect AI Slop in<br />
          <span className="text-indigo-400">Text, Code & Images</span>
        </h1>
        <p className="text-[#8892a4] text-xl mb-10 max-w-2xl mx-auto">
          SlopGuard assigns a continuous Slop Score to your content — 
          instantly revealing AI-generated, low-quality, or generic material.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="btn-primary text-base py-3 px-8">
            Start Scanning Free
          </Link>
          <Link href="/pricing" className="btn-secondary text-base py-3 px-8">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Three Modalities. One Score.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <FileText className="text-indigo-400" size={28} />,
              title: 'Text Detection',
              desc: 'Analyses vocabulary richness, AI buzzword density, sentence rhythm, and transition phrase overuse.',
            },
            {
              icon: <Code className="text-indigo-400" size={28} />,
              title: 'Code Detection',
              desc: 'Detects over-commenting, AI prose in docstrings, boilerplate patterns, and over-descriptive identifiers.',
            },
            {
              icon: <Image className="text-indigo-400" size={28} />,
              title: 'Image Detection',
              desc: 'Uses a fine-tuned ViT model combined with pixel-level heuristics to classify real vs AI-generated images.',
            },
          ].map((f, i) => (
            <div key={i} className="card hover:border-indigo-500/50 transition-colors">
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-[#8892a4] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Score legend */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="card">
          <h3 className="text-white font-semibold text-lg mb-6 text-center">Score Interpretation</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { range: '0 – 39', label: 'Likely Human', color: 'text-green-400', bg: 'bg-green-400/10' },
              { range: '40 – 64', label: 'Borderline', color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { range: '65 – 100', label: 'High AI Slop', color: 'text-red-400', bg: 'bg-red-400/10' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-lg p-4`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.range}</div>
                <div className="text-[#8892a4] text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to detect slop?</h2>
        <p className="text-[#8892a4] mb-8">Join thousands of writers, developers and researchers using SlopGuard.</p>
        <Link href="/login" className="btn-primary text-base py-3 px-10">
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2e3348] px-6 py-8 text-center text-[#8892a4] text-sm">
        © 2026 SlopGuard · Built by Hariom Shukla · 
        <Link href="/pricing" className="hover:text-white ml-1">Pricing</Link>
      </footer>

    </main>
  )
}