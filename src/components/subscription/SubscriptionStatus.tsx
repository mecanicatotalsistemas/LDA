import React from 'react'
import { useSubscription } from '../../hooks/useSubscription'
import { Alert } from '../ui/Alert'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

export function SubscriptionStatus() {
  const { subscription, loading, error, getSubscriptionPlan, isActive } = useSubscription()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert type="error">
        Failed to load subscription status: {error}
      </Alert>
    )
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-400">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">No Active Subscription</h3>
            <p className="text-sm text-gray-600">Subscribe to access premium features</p>
          </div>
        </div>
      </div>
    )
  }

  const planName = getSubscriptionPlan()
  const active = isActive()

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${active ? 'border-green-500' : 'border-red-500'}`}>
      <div className="flex items-center">
        {active ? (
          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 mr-3" />
        )}
        <div>
          <h3 className="font-medium text-gray-900">
            {planName || 'Subscription'}
          </h3>
          <p className="text-sm text-gray-600 capitalize">
            Status: {subscription.subscription_status.replace('_', ' ')}
          </p>
          {subscription.current_period_end && (
            <p className="text-xs text-gray-500">
              {active ? 'Renews' : 'Expired'} on{' '}
              {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}