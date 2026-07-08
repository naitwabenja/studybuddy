'use client'

import { useState } from 'react'
import { Sparkles, BookOpen } from 'lucide-react'
import { AssignmentInput } from '@/components/features/assignment/assignment-input'
import { UsageMeter } from '@/components/features/subscription/usage-meter'
import { Container } from '@/components/layout/container'
import { Header } from '@/components/layout/header'
import { ExplanationView } from '@/components/features/assignment/explanation-view'
import { PricingCard } from '@/components/features/subscription/pricing-card'
import toast from 'react-hot-toast'

export default function Home() {
  const [result, setResult] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <Header />
      
      <Container className="py-20">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-white/50 mb-8">
            <Sparkles className="w-10 h-10 text-yellow-500 animate-pulse" />
            <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Explain My Assignment
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Turn confusing assignment instructions into crystal-clear guidance. 
            Your AI teacher explains what to do, step-by-step, without doing your homework for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
          {/* Input Section */}
          <div className="space-y-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 border border-white/50 shadow-2xl">
              <UsageMeter />
              
              <AssignmentInput 
                onResult={(result) => {
                  setResult(result)
                  toast.success('Assignment explained! 🎉')
                }}
                isAnalyzing={isAnalyzing}
                onAnalyzingChange={setIsAnalyzing}
              />
            </div>
          </div>

          {/* Result Section */}
          <div>
            {result ? (
              <ExplanationView explanation={result} />
            ) : (
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 border border-white/50 shadow-2xl h-[600px] flex flex-col items-center justify-center text-center">
                <BookOpen className="w-24 h-24 text-gray-300 mb-8" />
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  Paste your assignment above
                </h3>
                <p className="text-gray-600 max-w-md">
                  Upload an image, PDF, or paste text. Get instant clarity on what to do next.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Teaser */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            <h2 className="text-3xl font-bold mb-4">Unlimited explanations for KES 100/week</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <PricingCard 
              title="Free"
              price="0 KES"
              features={['5 explanations/day', 'Basic outlines', 'History']}
              popular={false}
            />
            <PricingCard 
              title="Student Pack"
              price="100 KES"
              features={['Unlimited explanations', 'Advanced breakdowns', 'Priority support', 'PDF exports']}
              popular={true}
            />
            <PricingCard 
              title="School License"
              price="Contact us"
              features={['For entire school', 'Custom branding', 'Admin dashboard', 'Usage analytics']}
              popular={false}
            />
          </div>
        </div>
      </Container>
    </div>
  )
}
