'use client'

import React from 'react'
import { Check, Crown } from 'lucide-react'
import toast from 'react-hot-toast'

interface PricingCardProps {
  title: string
  price: string
  features: string[]
  popular: boolean
}

export function PricingCard({ title, price, features, popular }: PricingCardProps) {
  const handleUpgrade = () => {
    if (title === 'Free') {
      toast('You are already on the free tier!', { icon: '🤝' })
    } else {
      toast.success(`Request sent to upgrade to ${title}! 🚀`)
    }
  }

  return (
    <div 
      className={`relative rounded-3xl p-8 flex flex-col justify-between h-full transition duration-300 ${
        popular 
          ? 'bg-gradient-to-br from-indigo-900 to-blue-900 text-white shadow-2xl scale-105 border-2 border-indigo-400' 
          : 'bg-white/80 backdrop-blur-md border border-gray-100 text-gray-800 shadow-xl hover:shadow-2xl'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1 shadow-md">
          <Crown className="w-3.5 h-3.5 fill-slate-950" />
          Most Popular
        </div>
      )}

      <div>
        <h3 className={`text-xl font-bold mb-2 ${popular ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <div className="flex items-baseline gap-1 my-4">
          <span className="text-4xl font-extrabold tracking-tight">{price}</span>
          <span className={`text-xs ${popular ? 'text-indigo-200' : 'text-gray-500'}`}>/week</span>
        </div>
        
        <ul className="space-y-3.5 my-6 text-left">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Check className={`w-4 h-4 mt-0.5 ${popular ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span className={popular ? 'text-indigo-100' : 'text-gray-600'}>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleUpgrade}
        className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-150 ${
          popular 
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 shadow-lg' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200/80'
        }`}
      >
        {title === 'Free' ? 'Current Plan' : 'Upgrade Now'}
      </button>
    </div>
  )
}
export default PricingCard
