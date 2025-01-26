import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

export default function Login({ isMemberPortal, isLightTheme }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState(null)
  const [rememberMe, setRememberMe] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const userRole = user.user_metadata?.role
      // Only redirect if the user's role matches the portal type
      if (isMemberPortal && userRole === 'member') {
        navigate('/member')
      } else if (!isMemberPortal && userRole === 'agent') {
        navigate('/admin/dashboard')
      } else {
        // If roles don't match, sign out
        supabase.auth.signOut()
        setError('Please use the correct portal to sign in based on your role.')
      }
    }
  }, [user, navigate, isMemberPortal])

  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setLoading(true)
      
      if (isSignUp) {
        // Only allow member signups through member portal
        /* Temporarily commented out to allow staff signups for evaluation
        if (!isMemberPortal) {
          throw new Error('Staff accounts can only be created through invitation')
        }
        */

        // Step 1: Sign up the user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: isMemberPortal ? 'member' : 'agent' // Updated to allow agent role for staff portal
            }
          }
        })
        
        if (signUpError) throw signUpError
        
        if (!authData?.user?.id) {
          throw new Error('Failed to get user ID after signup')
        }

        // Step 2: Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: email,
              first_name: firstName,
              last_name: lastName,
              role: isMemberPortal ? 'member' : 'agent'
            }
          ])
          .select()

        if (profileError) {
          console.error('Profile creation error:', profileError)
          await supabase.auth.signOut()
          throw new Error('Failed to create user profile. Please try again.')
        }

        // Step 3: Auto sign in after successful signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          throw new Error('Account created successfully. Please sign in.')
        }

        // Navigate based on user role
        if (isMemberPortal) {
          navigate('/member')
        } else {
          navigate('/admin/dashboard')
        }
      } else {
        // Handle sign in
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })
        if (error) throw error

        // Verify user role matches portal type
        const userRole = data.user.user_metadata?.role
        if (isMemberPortal && userRole !== 'member') {
          await supabase.auth.signOut()
          throw new Error('This is the member portal. Please use the staff portal to sign in as staff.')
        } else if (!isMemberPortal && userRole !== 'agent') {
          await supabase.auth.signOut()
          throw new Error('This is the staff portal. Please use the member portal to sign in as a member.')
        }

        // Update last_sign_in_at in users table
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('Error updating last_sign_in_at:', updateError)
        }
      }
    } catch (error) {
      setError(error.message)
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (user) {
        // Set role in user metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: isMemberPortal ? 'member' : 'agent' }
        })

        if (updateError) throw updateError

        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              role: isMemberPortal ? 'member' : 'agent',
              created_at: new Date().toISOString(),
            }
          ])

        if (profileError) throw profileError
      }
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div>
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-[#e12c4c]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
            </svg>
          </div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white">
            {isMemberPortal ? 'Member Portal' : 'Staff Portal'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-200">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-600/50 px-3 py-2 text-white placeholder-gray-300 focus:border-[#e12c4c] focus:ring-[#e12c4c] text-sm"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-200">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-600/50 px-3 py-2 text-white placeholder-gray-300 focus:border-[#e12c4c] focus:ring-[#e12c4c] text-sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-600/50 px-3 py-2 text-white placeholder-gray-300 focus:border-[#e12c4c] focus:ring-[#e12c4c] text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-2 border-gray-600 bg-transparent text-[#e12c4c] focus:ring-[#e12c4c] focus:ring-offset-[#1a1b23] focus:ring-1 checked:bg-[#e12c4c] checked:border-transparent transition-colors cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg viewBox=%270 0 16 16%27 fill=%27white%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%27/%3E%3C/svg%3E')]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-200">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-[#e12c4c] hover:text-[#d11b3b]">
                  Forgot password?
                </a>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-[#e12c4c] hover:bg-[#d11b3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e12c4c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign up' : 'Sign in')}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              className="text-sm text-[#e12c4c] hover:text-[#d11b3b]"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 