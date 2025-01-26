import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { toast } from 'react-hot-toast'

export default function CreateTeamMember({ onClose }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'agent' // Default role
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = async () => {
    const newErrors = {}

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate role
    if (!['agent', 'admin'].includes(formData.role)) {
      newErrors.role = 'Please select a valid role'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Submitting form data:', formData)
      
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role
        }
      })

      console.log('Edge Function response:', { data, error })

      if (error) throw error

      toast.success('Team member invited successfully! They will receive an email to set up their account.')
      
      // Reset form to initial state
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'agent'
      })
    } catch (error) {
      console.error('Error inviting team member:', error)
      toast.error(error.message || 'Failed to invite team member')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 p-8 bg-gray-50">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-4">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <span>Settings</span>
            <span className="mx-2">›</span>
          </li>
          <li className="flex items-center">
            <span>Team</span>
            <span className="mx-2">›</span>
          </li>
          <li className="text-gray-800">Create team member</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create team member</h1>
        <p className="mt-1 text-sm text-gray-600">
          Get new team members up and running in just a couple of steps.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Step 1: Enter details */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-white text-sm font-medium">
              1
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Enter details</h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name* (required)
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value })
                    if (errors.firstName) {
                      setErrors({ ...errors, firstName: '' })
                    }
                  }}
                  className={`mt-1 block w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name* (required)
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value })
                    if (errors.lastName) {
                      setErrors({ ...errors, lastName: '' })
                    }
                  }}
                  className={`mt-1 block w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email*
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) {
                    setErrors({ ...errors, email: '' })
                  }
                }}
                className={`mt-1 block w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Assign role */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-white text-sm font-medium">
              2
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Assign role</h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="agent"
                  name="role"
                  value="agent"
                  checked={formData.role === 'agent'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="agent" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Agent</div>
                  <div className="text-sm text-gray-500">Can view and respond to tickets</div>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="admin"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="admin" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Admin</div>
                  <div className="text-sm text-gray-500">Has full access to all settings and features</div>
                </label>
              </div>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Inviting...' : 'Create team member'}
          </button>
        </div>
      </form>
    </div>
  )
} 