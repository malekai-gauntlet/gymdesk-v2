import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StaffLoginModal from './auth/StaffLoginModal'
import MemberLoginModal from './auth/MemberLoginModal'

export default function LandingPage() {
  const navigate = useNavigate()
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#1a1b23] text-white">
      {/* Header */}
      <header className="bg-[#1a1b23] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">GymDesk</h1>
          <div className="flex items-center space-x-6">
            <button className="text-gray-300 hover:text-white transition-colors">Help</button>
            <button className="px-4 py-2 rounded-full bg-[#e12c4c] text-white hover:bg-[#d11b3b] transition-colors">
              Try GymDesk
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 bg-gray-800/50 rounded-full px-4 py-2">
              <span className="text-[#e12c4c] font-semibold">★</span>
              <span className="text-sm font-medium">Trusted by 1000+ Independent Gyms</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              The AI-Powered CRM for Independent Gyms
            </h2>
            
            <p className="text-xl text-gray-400">
              Save time and money. Let AI manage your memberships, member requests, and more.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => setIsMemberModalOpen(true)}
                className="px-8 py-3 rounded-full bg-[#e12c4c] text-white hover:bg-[#d11b3b] transition-colors text-lg font-semibold"
              >
                Member Portal
              </button>
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="px-8 py-3 rounded-full border-2 border-gray-700 hover:border-gray-500 text-white transition-colors text-lg font-semibold"
              >
                Staff Portal
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800">
              <div>
                <div className="text-2xl font-bold">1000+</div>
                <div className="text-gray-400">Active Gyms</div>
              </div>
              <div>
                <div className="text-2xl font-bold">50k+</div>
                <div className="text-gray-400">Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold">4.8★</div>
                <div className="text-gray-400">Rating</div>
              </div>
            </div>
          </div>

          {/* Right column - Image/Screenshot */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
                alt="GymDesk Dashboard"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1b23] via-transparent to-transparent opacity-60"></div>
            </div>
            
            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 bg-[#23242f] p-6 rounded-xl shadow-xl">
              <div className="text-sm text-gray-400 mb-2">Monthly Growth</div>
              <div className="text-2xl font-bold">+127%</div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full">
                <div className="h-2 bg-[#e12c4c] rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modals */}
      <StaffLoginModal 
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />
      <MemberLoginModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />
    </div>
  )
} 