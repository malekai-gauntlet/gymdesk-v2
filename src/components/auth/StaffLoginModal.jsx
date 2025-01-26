import { useEffect } from 'react'
import Login from './Login'

export default function StaffLoginModal({ isOpen, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300 z-10"
        onClick={onClose}
      />
      
      <div className="relative min-h-screen flex items-center justify-center p-4 pointer-events-none z-50">
        <div className="relative w-full max-w-md transform transition-all duration-300 scale-100">
          <div className="bg-[#1a1b23] rounded-2xl shadow-2xl border border-gray-800 relative pointer-events-auto">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Login isLightTheme={false} />
          </div>
        </div>
      </div>
    </div>
  )
} 