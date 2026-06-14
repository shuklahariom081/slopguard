'use client'

import React from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

type Props = {
  score: number
  size?: number
  stroke?: number
}

const colorFor = (s: number) => (s >= 65 ? '#fb7185' : s >= 40 ? '#f59e0b' : '#34d399')

export default function CircularGauge({ score, size = 120, stroke = 12 }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, score)) / 100

  const spring = useSpring(pct, { stiffness: 120, damping: 20 })
  const dash = useTransform(spring, v => `${circumference * (1 - v)}`)

  const color = colorFor(score)

  return (
    <div style={{ width: size, height: size }} className="inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0f1117"
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
          style={{ strokeDashoffset: dash }}
          initial={{ strokeDashoffset: circumference }}
        />
        <foreignObject x="0" y="0" width={size} height={size}>
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div style={{ color }} className="text-3xl font-bold leading-none">{Math.round(score)}</div>
              <div className="text-xs text-[#9ca3af]">out of 100</div>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}
