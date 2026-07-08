'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, Check, FileDown, BookOpen, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExplanationViewProps {
  explanation: string
}

export function ExplanationView({ explanation }: ExplanationViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation)
    setCopied(true)
    toast.success('Explanation copied to clipboard! 📋')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([explanation], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'assignment-explanation.md')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Markdown file downloaded! 📂')
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Your Guided Study Plan</h3>
            <p className="text-xs text-gray-500">Read step-by-step guidance, structures, and checklists.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2.5 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Copy explanation"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            Copy
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2.5 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Download explanation"
          >
            <FileDown className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex gap-3 text-xs text-blue-700 leading-relaxed">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
        <p>
          <strong>Ethical Guidelines:</strong> This guide has been prepared to help you understand your task, break it down, and suggest study workflows. It does not provide direct answers or do your homework for you.
        </p>
      </div>

      <div className="markdown-content text-gray-700 prose max-w-none">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  )
}
export default ExplanationView
