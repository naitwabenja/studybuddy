'use client'

import React, { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

export function UsageMeter() {
  const [usage, setUsage] = useState(0)
  const limit = 5

  useEffect(() => {
    // We can load current usage from localStorage or calculate it
    const today = new Date().toDateString()
    const stored = localStorage.getItem(`usage_${today}`)
    if (stored) {
      const val = parseInt(stored, 10)
      setTimeout(() => setUsage(val), 0)
    }
  }, [])

  const percent = Math.min((usage / limit) * 100, 100)

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-semibold text-gray-700">Daily Explanations</span>
        </div>
        <span className="text-xs font-bold text-gray-500">
          {usage} / {limit} Used
        </span>
      </div>
      
      <div className="w-full bg-gray-200/60 rounded-full h-2 overflow-hidden mb-3">
        <div 
          className="bg-blue-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {percent >= 100 ? (
        <p className="text-xs text-red-600 font-medium">
          Daily limit reached. Upgrade to Student Pack for unlimited access!
        </p>
      ) : (
        <p className="text-xs text-gray-600">
          You have {limit - usage} free explanations left for today.
        </p>
      )}
    </div>
  )
}
