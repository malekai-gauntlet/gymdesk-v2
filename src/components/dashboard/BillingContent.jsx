import React from 'react'

export default function BillingContent() {
  return (
    <div className="flex-1 p-8 bg-gray-50">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600">
        Settings &gt; Account
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Trial Banner */}
        {/* <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Unlock more features</h3>
                <p className="text-sm text-gray-500">Extend your GymDesk trial for an extra 14 days.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Extend trial
            </button>
          </div>
        </div> */}

        {/* Current Subscription */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium">Current subscription</h2>
              <div className="space-x-4">
                <button className="text-blue-600 hover:text-blue-700">View plans</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Buy your trial
                </button>
              </div>
            </div>
          </div>
          
          {/* Subscription Table */}
          <div className="px-6 py-4">
            <table className="w-full">
              <thead className="text-left">
                <tr className="border-b border-gray-200">
                  <th className="pb-4 font-medium">Product</th>
                  <th className="pb-4 font-medium">Plan</th>
                  <th className="pb-4 font-medium">Details</th>
                  <th className="pb-4 font-medium text-right">Annual cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4">GymDesk Suite</td>
                  <td className="py-4">Professional</td>
                  <td className="py-4">11 days left in trial</td>
                  <td className="py-4 text-right">--</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan="3" className="py-4 font-medium">Total cost</td>
                  <td className="py-4 text-right font-medium">$0</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Additional Billing Sections */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium">Payment method</h2>
          </div>
          <div className="px-6 py-4">
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Add payment method
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium">Billing history</h2>
          </div>
          <div className="px-6 py-4 text-gray-500">
            No billing history available
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium">Billing details</h2>
          </div>
          <div className="px-6 py-4">
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Add billing details
            </button>
          </div>
        </div> */}
      </div>
    </div>
  )
} 