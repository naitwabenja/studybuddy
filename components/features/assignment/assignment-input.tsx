'use client'

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface AssignmentInputProps {
  onResult: (result: string) => void
  isAnalyzing: boolean
  onAnalyzingChange: (isAnalyzing: boolean) => void
}

export function AssignmentInput({
  onResult,
  isAnalyzing,
  onAnalyzingChange,
}: AssignmentInputProps) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/')
    if (!isImage) {
      toast.error('Please upload an image file (PNG, JPG, or WEBP)')
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const removeFile = () => {
    setFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !file) {
      toast.error('Please enter assignment instructions or upload an image.')
      return
    }

    onAnalyzingChange(true)
    const toastId = toast.loading('Analyzing your assignment... 🤖')

    try {
      // Get anonymous or specific userId for history
      let userId = localStorage.getItem('studybuddy_user_id')
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 11)
        localStorage.setItem('studybuddy_user_id', userId)
      }

      interface AnalyzeBody {
        userId: string
        text: string
        image?: string
      }

      const body: AnalyzeBody = {
        userId,
        text: text,
      }

      if (filePreview) {
        body.image = filePreview // Base64 data URL
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze assignment')
      }

      // Record usage
      const today = new Date().toDateString()
      const currentUsage = parseInt(localStorage.getItem(`usage_${today}`) || '0', 10)
      localStorage.setItem(`usage_${today}`, (currentUsage + 1).toString())
      window.dispatchEvent(new Event('storage')) // Notify UsageMeter

      onResult(data.explanation)
      toast.success('Assignment explained! 🎉', { id: toastId })
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Analysis failed. Please try again.'
      toast.error(message, { id: toastId })
    } finally {
      onAnalyzingChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Paste Assignment Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your syllabus, rubric, prompt, or assignment details here..."
          className="w-full h-40 p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-800 bg-white/50 backdrop-blur-sm"
          disabled={isAnalyzing}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200/80" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400 font-medium">OR</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Upload Assignment Screenshot / Image
        </label>
        
        {filePreview ? (
          <div className="relative border border-blue-200 bg-blue-50/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-white flex-shrink-0">
              <Image 
                src={filePreview} 
                alt="Upload preview" 
                fill 
                className="object-cover" 
                unoptimized 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{file?.name}</p>
              <p className="text-xs text-gray-500">{( (file?.size || 0) / 1024 / 1024 ).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition"
              disabled={isAnalyzing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50/40'
                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isAnalyzing}
            />
            <div className="bg-blue-50 p-4 rounded-full text-blue-600">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Drag and drop image here, or <span className="text-blue-600 hover:underline">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG, WEBP (max 10MB)</p>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isAnalyzing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-5 h-5" />
        {isAnalyzing ? 'Analyzing Assignment...' : 'Explain Assignment'}
      </button>
    </form>
  )
}
