'use client'

import React from 'react'
import CircularGauge from './CircularGauge'
import Button from './Button'

type Result = {
  slop_score: number
  verdict: string
  confidence: string
  features: Record<string, string>
}

export default function ResultCard({ result, duration }: { result: Result; duration?: number }) {
  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slopguard-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyResults = async () => {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
  }

  return (
    <div>
      <div className="flex flex-col items-center text-center gap-4 mb-6">
        <CircularGauge score={result.slop_score} />
        <div className="w-full">
          <div className="text-lg font-semibold text-white">{result.verdict}</div>
          <div className="text-xs text-[#8892a4] mt-1">Confidence: {result.confidence}</div>
          {typeof duration === 'number' && (
            <div className="text-xs text-[#8892a4] mt-1">Scan time: {duration} ms</div>
          )}

          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={copyResults}>Copy JSON</Button>
            <Button variant="secondary" onClick={downloadReport}>Download</Button>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[#8892a4] text-xs font-medium uppercase tracking-wider mb-3">
          Feature Breakdown
        </p>
        <div className="space-y-2 bg-[#0f1117] rounded-md p-3 border border-[#2e3348]">
          {Object.entries(result.features).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-sm">
              <span className="text-[#9ca3af]">{k}</span>
              <span className="text-white font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}