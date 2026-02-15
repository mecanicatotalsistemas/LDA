import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Subscription } from './pages/Subscription'
import { SubscriptionSuccess } from './pages/SubscriptionSuccess'
import { useAuth } from './hooks/useAuth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Life Data Analysis
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Hello, {user?.email}! Your dashboard is ready.
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Getting Started
            </h2>
            <p className="text-gray-600">
              This is your main dashboard. Here you can access all the life data analysis tools and features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription/success"
            element={
              <ProtectedRoute>
                <SubscriptionSuccess />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}