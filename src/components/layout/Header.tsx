import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { LogOut, User, CreditCard } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const { getSubscriptionPlan } = useSubscription()

  const planName = getSubscriptionPlan()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Life Data Analysis
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {planName && (
                  <div className="hidden sm:flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    <CreditCard className="h-4 w-4 mr-1" />
                    {planName}
                  </div>
                )}
                
                <Link
                  to="/subscription"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Subscription
                </Link>

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>

                <button
                  onClick={signOut}
                  className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}