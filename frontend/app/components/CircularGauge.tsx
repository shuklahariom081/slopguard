'use client'

import React from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

type Props = {
  score: number
  size?: number
  stroke?: number
}

const colorFor = (s: number) => (s >= 65 ? '#fb7185' : s >= 40 ? '#f59e0b' : '#34d399')
const labelFor = (s: number) => (s >= 65 ? 'High Risk' : s >= 40 ? 'Moderate' : 'Low Risk')

export default function CircularGauge({ score, size = 140, stroke = 10 }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, score)) / 100

  const spring = useSpring(0, { stiffness: 90, damping: 18 })
  const dash = useTransform(spring, v => `${circumference * (1 - v)}`)
  const displayScore = useTransform(spring, v => Math.round(v * 100))

  React.useEffect(() => {
    spring.set(pct)
  }, [pct, spring])

  const color = colorFor(score)

  return (
    <div style={{ width: size, height: size }} className="relative inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1a1d27"
          strokeWidth={stroke}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dash, filter: `drop-shadow(0 0 6px ${color}66)` }}
          initial={{ strokeDashoffset: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <motion.div style={{ color }} className="text-4xl font-bold leading-none tabular-nums">
            {displayScore}
          </motion.div>
          <div className="text-[10px] text-[#6b7280] uppercase tracking-wider mt-1">out of 100</div>
          <div style={{ color }} className="text-xs font-medium mt-1.5">{labelFor(score)}</div>
        </div>
      </div>
    </div>
  )
}