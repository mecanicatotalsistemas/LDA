import React, { useState } from 'react'
import { StripeProduct } from '../../stripe-config'
import { supabase } from '../../lib/supabase'
import { Alert } from '../ui/Alert'
import { CreditCard, Loader2 } from 'lucide-react'

interface SubscriptionCardProps {
  product: StripeProduct
  isCurrentPlan?: boolean
}

export function SubscriptionCard({ product, isCurrentPlan = false }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('You must be logged in to subscribe')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/subscription/success`,
          cancel_url: `${window.location.origin}/subscription`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Subscription error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start subscription process')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${isCurrentPlan ? 'border-green-500' : 'border-gray-200'}`}>
      {isCurrentPlan && (
        <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
          Current Plan
        </div>
      )}
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-4">{product.description}</p>
      
      <div className="mb-6">
        <span className="text-3xl font-bold text-gray-900">
          {product.currencySymbol}{product.price.toFixed(2)}
        </span>
        <span className="text-gray-600 ml-2">
          /{product.mode === 'subscription' ? 'month' : 'one-time'}
        </span>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      <button
        onClick={handleSubscribe}
        disabled={loading || isCurrentPlan}
        className={`w-full flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : loading
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Subscribe Now
          </>
        )}
      </button>
    </div>
  )
}