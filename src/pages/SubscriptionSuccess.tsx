import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

export function SubscriptionSuccess() {
  const { refetch } = useSubscription()

  useEffect(() => {
    // Refetch subscription data to get the latest status
    const timer = setTimeout(() => {
      refetch()
    }, 2000)

    return () => clearTimeout(timer)
  }, [refetch])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your subscription. Your account has been activated and you now have access to all premium features.
          </p>

          <div className="space-y-4">
            <Link
              to="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            
            <Link
              to="/subscription"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View Subscription Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}