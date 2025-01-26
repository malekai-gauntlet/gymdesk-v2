export default function MemberSidebar() {
  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto h-screen">
      <div className="p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Members Lists</h2>
        
        {/* Member Categories */}
        <nav className="space-y-1 mb-8">
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-md">
            All Members
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Active Members
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Inactive Members
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Personal Trainers
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Personal Training Clients
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Month Pass Members
          </button>
        </nav>

        {/* Live View Section */}
        <h2 className="text-lg font-medium text-gray-900 mb-4">Live View</h2>
        <nav className="space-y-1">
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Live Attendance View
          </button>
        </nav>
      </div>
    </div>
  )
} 