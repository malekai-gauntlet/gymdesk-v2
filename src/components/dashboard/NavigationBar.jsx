import { HomeIcon, TicketIcon, UsersIcon, ChartBarIcon, Cog6ToothIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'

const navigationItems = [
  { name: 'Dashboard', icon: HomeIcon, view: 'dashboard' },
  { name: 'Customers', icon: UsersIcon, view: 'customers' },
  { name: 'Settings', icon: Cog6ToothIcon, view: 'settings' }
]

export default function NavigationBar({ selectedView, onViewChange }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user } = useAuth()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="w-16 min-w-[64px] flex-shrink-0 bg-[#1B1D21] flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center">
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
        </svg>
      </div>

      {/* Navigation Icons */}
      <nav className="space-y-4">
        {navigationItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onViewChange(item.view)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors ${
              selectedView === item.view ? 'bg-gray-700' : ''
            }`}
          >
            <item.icon className="w-6 h-6 text-gray-300" />
          </button>
        ))}
      </nav>

      {/* Bottom Icons */}
      <div className="mt-auto space-y-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors">
          <BellIcon className="w-6 h-6 text-gray-300" />
        </button>
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors"
          >
            <UserCircleIcon className="w-6 h-6 text-gray-300" />
          </button>
          
          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute left-full ml-2 bottom-0 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-sm text-gray-700 text-left hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 