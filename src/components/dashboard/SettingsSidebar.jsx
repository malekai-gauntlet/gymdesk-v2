import { useState } from 'react'
import { MagnifyingGlassIcon, HomeIcon, ClockIcon, StarIcon, UserIcon, UsersIcon, ArrowsRightLeftIcon, WindowIcon, CubeIcon, PuzzlePieceIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function SettingsSidebar({ onSectionChange, activeSection }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  const handleSectionClick = (section) => {
    onSectionChange(section)
  }

  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto h-screen">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search Admin Center"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="px-2 space-y-1">
        <button 
          onClick={() => handleSectionClick('settings')}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50
            ${activeSection === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
        >
          <HomeIcon className="mr-3 h-5 w-5 text-gray-400" />
          Home
        </button>
        {/* <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
          <StarIcon className="mr-3 h-5 w-5 text-gray-400" />
          Discover
        </button> */}

        <div className="border-t border-gray-200 my-2"></div>

        {/* Account Section */}
        <button 
          onClick={() => handleSectionClick('billing')}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50
            ${activeSection === 'billing' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
        >
          <div className="flex items-center">
            <UserIcon className="mr-3 h-5 w-5 text-gray-400" />
            Account
          </div>
        </button>

        {/* Team Section */}
        <button 
          onClick={() => handleSectionClick('people-team-members')}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50
            ${activeSection === 'people-team-members' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
        >
          <UsersIcon className="mr-3 h-5 w-5 text-gray-400" />
          Team
        </button>

        <div className="border-t border-gray-200 my-2"></div>

        {/* Knowledge Base Section */}
        <button 
          onClick={() => handleSectionClick('knowledge-base')}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50
            ${activeSection === 'knowledge-base' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
        >
          <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Knowledge Base
        </button>

        {/* Other buttons */}
        {/* <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
          <ArrowsRightLeftIcon className="mr-3 h-5 w-5 text-gray-400" />
          Channels
        </button>
        <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
          <WindowIcon className="mr-3 h-5 w-5 text-gray-400" />
          Workspaces
        </button>
        <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
          <CubeIcon className="mr-3 h-5 w-5 text-gray-400" />
          Objects and rules
        </button>
        <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
          <PuzzlePieceIcon className="mr-3 h-5 w-5 text-gray-400" />
          Apps and integrations
        </button> */}
      </nav>
    </div>
  )
} 