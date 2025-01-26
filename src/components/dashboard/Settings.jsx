import { useState } from 'react'

export default function Settings() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Center</h1>
        <p className="text-sm text-gray-500">Your home for settings to manage your account, team, and more.</p>
      </div>

      {/* Setup Guide Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Help for every step, every day</h2>
            <p className="text-sm text-gray-500">Get setup guidance, search the help center, watch training videos, connect with the community.</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          See setup guides
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Storage Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Storage usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Ticket data storage</span>
                <span>0 of 10,500 MB used</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-0"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>File storage</span>
                <span>0 of 35,000 MB used</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-0"></div>
              </div>
            </div>
          </div>
        </div>

        {/* API Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API usage (last 7 days)</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total requests</span>
              <span>0% of requests</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Limit reaches</span>
              <span>0</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Limit approaches</span>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Automated Resolutions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Automated resolutions usage</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Allowance usage</span>
              <span>0 of 600</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Overage allowed</span>
              <span>0%</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Days elapsed</span>
              <span>3 of 365</span>
            </div>
          </div>
        </div>
      </div>

      {/* Updates Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Updates</h3>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
              Announcements
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              What's new
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Developer updates
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Release notes
            </button>
          </nav>
        </div>
        <div className="mt-4 space-y-4">
          {/* Sample announcements */}
          <div className="py-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jan 22, 2024</span>
              <a href="#" className="text-blue-600 hover:text-blue-700">New features available in sandbox environment</a>
            </div>
          </div>
          <div className="py-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jan 21, 2024</span>
              <a href="#" className="text-blue-600 hover:text-blue-700">Important updates to department spaces</a>
            </div>
          </div>
          <div className="py-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jan 20, 2024</span>
              <a href="#" className="text-blue-600 hover:text-blue-700">New data retention policies in effect</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 