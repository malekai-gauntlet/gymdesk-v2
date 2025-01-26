import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function MemberDetail({ member, onClose }) {
  return (
    <div className="flex-1 overflow-auto">
      {/* Header with back button */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="mr-4 p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {member.first_name} {member.last_name}
              </h1>
              <p className="text-sm text-gray-500">End user</p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600">
              Tickets (1)
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Related
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Security Settings
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 p-6">
        {/* Left column - Member Info */}
        <div className="col-span-1">
          {/* Combined info sections in one white group */}
          <div className="bg-white rounded-lg shadow">
            {/* User Type Section */}
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">User type</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">End user</span>
                  <span className="text-sm text-gray-500">▼</span>
                </div>
              </div>
            </div>

            {/* Access Section */}
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Access</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Can view and edit own tickets</span>
                  <span className="text-sm text-gray-500">▼</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Primary email</h3>
                <button className="text-sm text-gray-400 hover:text-gray-500">
                  ⚠️
                </button>
              </div>
              <p className="text-sm text-gray-500">{member.email}</p>
              <button className="mt-3 text-sm text-indigo-600 hover:text-indigo-500">
                + add contact
              </button>
            </div>

            {/* Tags */}
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Tags</h3>
              <div className="mt-2">
                <span className="text-sm text-gray-500">-</span>
              </div>
            </div>

            {/* Details */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-sm font-medium text-gray-900">Details</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Created: </span>
                  <span className="text-sm text-gray-900">
                    {new Date(member.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last updated: </span>
                  <span className="text-sm text-gray-900">
                    {new Date(member.updated_at || member.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right columns - Tickets */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Requested tickets (1)</h3>
              
              {/* Sample ticket */}
              <div className="border-t border-gray-200">
                <div className="py-4">
                  <div className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <span className="ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Open
                    </span>
                    <span className="ml-2 text-sm text-gray-900">SAMPLE TICKET: Do i put it together?</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Sunday 19:49
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 