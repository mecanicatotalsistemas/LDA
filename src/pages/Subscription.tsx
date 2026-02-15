import React from 'react'
import { stripeProducts } from '../stripe-config'
import { SubscriptionCard } from '../components/subscription/SubscriptionCard'
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export function Subscription() {
  const { user, loading: authLoading } = useAuth()
  const { subscription } = useSubscription()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your life data analysis needs. 
            Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="mb-8">
          <SubscriptionStatus />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stripeProducts.map((product) => (
            <SubscriptionCard
              key={product.priceId}
              product={product}
              isCurrentPlan={subscription?.price_id === product.priceId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}