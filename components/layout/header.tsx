import React from 'react'
import { Sparkles, GraduationCap } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Study Buddy
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            AI Explainer Active
          </div>
        </div>
      </div>
    </header>
  )
}
