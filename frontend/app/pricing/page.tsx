import Link from 'next/link'
import { Shield, Check, Zap } from 'lucide-react'

export default function PricingPage() {
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
        <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white 
                                       text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
          Get Started
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Simple Pricing</h1>
        <p className="text-[#8892a4] text-lg mb-12">Start free. Upgrade when you need more.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">

          {/* Free */}
          <div className="bg-[#1a1d27] border border-[#2e3348] rounded-2xl p-8 text-left">
            <div className="text-[#8892a4] text-sm font-medium mb-2">FREE</div>
            <div className="text-4xl font-bold text-white mb-1">₹0</div>
            <div className="text-[#8892a4] text-sm mb-6">forever</div>

            <div className="space-y-3 mb-8">
              {[
                '10 scans per day',
                'Text detection',
                'Code detection',
                'Image detection',
                'Basic history',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <Check size={16} className="text-green-400 shrink-0" />
                  <span className="text-[#8892a4] text-sm">{f}</span>
                </div>
              ))}
            </div>

            <Link href="/login"
              className="block w-full text-center border border-indigo-500 text-indigo-400 
                         hover:bg-indigo-500 hover:text-white font-semibold py-2.5 
                         rounded-lg transition-all duration-200">
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-indigo-600/10 border-2 border-indigo-500 rounded-2xl p-8 text-left relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 
                            text-white text-xs font-bold px-4 py-1 rounded-full">
              MOST POPULAR
            </div>
            <div className="text-indigo-400 text-sm font-medium mb-2">PRO</div>
            <div className="text-4xl font-bold text-white mb-1">₹799</div>
            <div className="text-[#8892a4] text-sm mb-6">per month</div>

            <div className="space-y-3 mb-8">
              {[
                'Unlimited scans',
                'Text detection',
                'Code detection',
                'Image detection',
                'Full scan history',
                'PDF export (coming soon)',
                'API access (coming soon)',
                'Priority support',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-[#8892a4] text-sm">{f}</span>
                </div>
              ))}
            </div>

            <Link href="/login"
              className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 
                         text-white font-semibold py-2.5 rounded-lg transition-all 
                         duration-200 flex items-center justify-center gap-2">
              <Zap size={16} /> Upgrade to Pro
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-left max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">FAQ</h2>
          {[
            {
              q: 'What counts as a scan?',
              a: 'Each time you analyse text, code, or an image counts as one scan.',
            },
            {
              q: 'Do credits reset daily?',
              a: 'Yes — free users get 10 fresh scans every day at midnight UTC.',
            },
            {
              q: 'Can I cancel Pro anytime?',
              a: 'Yes, cancel anytime. You keep Pro access until the end of your billing period.',
            },
          ].map(item => (
            <div key={item.q} className="border-b border-[#2e3348] py-4">
              <p className="text-white font-medium mb-1">{item.q}</p>
              <p className="text-[#8892a4] text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}