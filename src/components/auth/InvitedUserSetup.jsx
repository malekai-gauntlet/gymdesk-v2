import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { toast } from 'react-hot-toast'

export default function InvitedUserSetup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)

  // Get the token_hash from URL parameters
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  useEffect(() => {
    if (!tokenHash || type !== 'invite') {
      setError('Invalid invitation link. Please contact your administrator.')
      return
    }

    // Verify the token hash
    const verifyInvite = async () => {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'invite'
        })
        
        if (error) throw error
        
        if (data?.user?.email) {
          setEmail(data.user.email)
        }
      } catch (error) {
        console.error('Error verifying invite:', error)
        setError('Invalid or expired invitation link. Please contact your administrator.')
      }
    }

    verifyInvite()
  }, [tokenHash, type])

  const handleSetup = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Update user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      // Update last_sign_in_at in users table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: lastSignInError } = await supabase
          .from('users')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', user.id)

        if (lastSignInError) {
          console.error('Error updating last_sign_in_at:', lastSignInError)
        }
      }

      toast.success('Account setup complete! You can now sign in.')
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Setup error:', error)
      setError(error.message || 'Failed to set up account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1b23] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1b23] rounded-2xl shadow-2xl border border-gray-800 p-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-[#e12c4c]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
                </svg>
              </div>
              <h2 className="text-center text-2xl font-bold tracking-tight text-white">
                Complete Your GymDesk Setup
              </h2>
              <p className="mt-2 text-center text-sm text-gray-300">
                Create a password to access your account
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSetup}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700/50 px-3 py-2 text-white placeholder-gray-400 text-sm cursor-not-allowed opacity-75"
                  value={email}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-600/50 px-3 py-2 text-white placeholder-gray-300 focus:border-[#e12c4c] focus:ring-[#e12c4c] text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-600/50 px-3 py-2 text-white placeholder-gray-300 focus:border-[#e12c4c] focus:ring-[#e12c4c] text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-[#e12c4c] hover:bg-[#d11b3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e12c4c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 