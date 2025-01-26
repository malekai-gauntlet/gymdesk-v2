import { useState, useEffect, useRef } from 'react'
import { EllipsisVerticalIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabaseClient'
import { toast } from 'react-hot-toast'
import { sendTicketNotification } from '../../lib/supabaseClient'
import EmojiPicker from 'emoji-picker-react'
import { generateTicketResponse } from '../../lib/openaiClient'
import { useAuth } from '../../components/auth/AuthContext'

export default function TicketDetail({ ticket, onClose }) {
  const { user } = useAuth()
  const [replyText, setReplyText] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [solving, setSolving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showHeaderStatusMenu, setShowHeaderStatusMenu] = useState(false)
  const [isGeneratingAIResponse, setIsGeneratingAIResponse] = useState(false)
  const [agentData, setAgentData] = useState(null)
  const [agents, setAgents] = useState([])
  const emojiButtonRef = useRef(null)
  const statusButtonRef = useRef(null)
  const headerStatusRef = useRef(null)
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 })
  const [textareaHeight, setTextareaHeight] = useState(150) // Initial height in pixels
  const textareaRef = useRef(null)
  const [showBccMenu, setShowBccMenu] = useState(false)
  const [bccRecipients, setBccRecipients] = useState([])
  const bccButtonRef = useRef(null)

  // Debug log to see ticket data
  useEffect(() => {
    console.log('Ticket Data:', ticket)
  }, [ticket])

  // Reset messages when ticket changes
  useEffect(() => {
    // Start with the initial ticket message
    const initialMessage = {
      id: ticket.id,
      text: ticket.description,
      sender: 'customer',
      timestamp: ticket.created_at
    }

    // If history exists and has items, use it; otherwise use the initial message
    setMessages(ticket.history?.length ? ticket.history : [initialMessage])
  }, [ticket.id, ticket.description, ticket.created_at, ticket.history])

  // Calculate picker position when showing
  useEffect(() => {
    if (showEmojiPicker && emojiButtonRef.current) {
      const buttonRect = emojiButtonRef.current.getBoundingClientRect()
      const middleSection = emojiButtonRef.current.closest('.flex-1.flex.flex-col')
      const middleRect = middleSection.getBoundingClientRect()
      
      // Position above the button
      let top = buttonRect.top - 440 // 440px is approximate height of emoji picker
      let left = Math.min(
        buttonRect.left,
        middleRect.right - 352 // 352px is approximate width of emoji picker
      )
      
      // Ensure picker stays within middle section
      left = Math.max(middleRect.left, left)
      
      setPickerPosition({ top, left })
    }
  }, [showEmojiPicker])

  // Fetch agent data when component mounts
  useEffect(() => {
    const fetchAgentData = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) throw error
          setAgentData(data)
          console.log('Agent data loaded:', data)
        } catch (error) {
          console.error('Error fetching agent data:', error)
        }
      }
    }

    fetchAgentData()
  }, [user?.id])

  // Add this useEffect after the other useEffects
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('role', ['agent', 'admin'])

        if (error) throw error
        setAgents(data || [])
      } catch (error) {
        console.error('Error fetching agents:', error)
        toast.error('Failed to load agents')
      }
    }

    fetchAgents()
  }, [])

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    
    setSending(true)
    console.log('Before clearing text - textarea height:', textareaHeight)
    
    // Create the new message object
    const newMessage = {
      id: Date.now(),
      text: replyText,
      sender: 'agent',
      timestamp: new Date().toISOString()
    }

    // Update UI immediately
    setMessages(prev => [...prev, newMessage])
    setReplyText('')
    
    // Force reset the textarea height
    const textarea = textareaRef.current
    if (textarea) {
      console.log('Resetting textarea height...')
      textarea.style.height = '150px'
      setTextareaHeight(150)
      console.log('After reset - textarea height:', textarea.style.height)
    }
    
    try {
      // Save message to ticket history in database
      const { error: historyError } = await supabase
        .from('tickets')
        .update({ 
          history: messages.concat(newMessage),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id)

      if (historyError) {
        console.error('Error updating ticket history:', historyError)
        throw new Error('Failed to save message history')
      }

      // Prepare ticket data with all required fields
      const ticketData = {
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        created_by: ticket.created_by,
        member_email: ticket.member_email,
        type: 'reply',
        reply_text: newMessage.text,
        bcc: bccRecipients.map(agent => agent.email) // Add BCC recipients
      }
      
      if (!ticketData.member_email) {
        throw new Error('Member email is missing from the ticket data')
      }

      // Send the reply via Edge Function
      const { data, error: emailError } = await sendTicketNotification(ticketData)

      if (emailError) {
        console.error('Email Error Details:', emailError)
        throw new Error(emailError.message || 'Failed to send email')
      }

      console.log('Reply sent successfully:', data)
      toast.success('Reply sent successfully')
      
      // Clear BCC recipients after successful send
      setBccRecipients([])
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error(error.message || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    console.log('=== Starting Status Change ===')
    console.log('Ticket ID being updated:', ticket.id)
    console.log('Current status:', ticket.status)
    console.log('New status:', newStatus)
    
    setSolving(true)
    try {
      console.log('Making Supabase update call...')
      // First verify the ticket exists
      const { data: checkData, error: checkError } = await supabase
        .from('tickets')
        .select('status')
        .eq('id', ticket.id)
        .single()
      
      console.log('Current ticket in DB:', checkData)

      if (checkError) {
        console.error('Error checking ticket:', checkError)
        throw checkError
      }

      // Then make the update
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id)
        .select()

      console.log('Supabase update response:', { data, error })

      if (error) throw error
      
      if (data && data[0]) {
        // Update the local ticket state with the new status
        ticket.status = newStatus
        console.log('Local ticket updated:', ticket)
        toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`)
      } else {
        throw new Error('No data returned from update')
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Failed to update ticket status')
    } finally {
      setSolving(false)
      setShowStatusMenu(false)
      setShowHeaderStatusMenu(false)
    }
  }

  const onEmojiClick = (emojiObject) => {
    const cursor = document.querySelector('textarea').selectionStart
    const text = replyText.slice(0, cursor) + emojiObject.emoji + replyText.slice(cursor)
    setReplyText(text)
    setShowEmojiPicker(false)
  }

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusMenu && !event.target.closest('.status-menu-container')) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showStatusMenu])

  // Close header status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHeaderStatusMenu && !event.target.closest('.header-status-container')) {
        setShowHeaderStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showHeaderStatusMenu])

  // Add useEffect for closing BCC menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBccMenu && !event.target.closest('.bcc-menu-container')) {
        setShowBccMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showBccMenu])

  // Function to handle adding/removing BCC recipients
  const toggleBccRecipient = (agent) => {
    setBccRecipients(prev => {
      const isSelected = prev.some(r => r.id === agent.id)
      if (isSelected) {
        return prev.filter(r => r.id !== agent.id)
      } else {
        return [...prev, agent]
      }
    })
  }

  const handleAIResponse = async () => {
    try {
      setIsGeneratingAIResponse(true)
      console.log('Generating AI response for ticket:', {
        title: ticket.title,
        description: ticket.description,
        memberName: `${ticket.first_name || ''} ${ticket.last_name || ''}`.trim() || 'Customer',
        agentName: agentData ? `${agentData.first_name || ''} ${agentData.last_name || ''}`.trim() : 'Support Agent',
        agentPosition: agentData?.role || 'Support Team'
      })
      
      // Call the OpenAI function with member and agent info
      const aiResponse = await generateTicketResponse({
        ...ticket,
        memberName: `${ticket.first_name || ''} ${ticket.last_name || ''}`.trim() || 'Customer',
        agentName: agentData ? `${agentData.first_name || ''} ${agentData.last_name || ''}`.trim() : 'Support Agent',
        agentPosition: agentData?.role || 'Support Team'
      })
      console.log('AI Response received:', aiResponse)
      
      // Set the AI response in the textarea
      setReplyText(aiResponse)
      toast.success('AI response generated')
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      toast.error('Failed to generate AI response')
    } finally {
      setIsGeneratingAIResponse(false)
    }
  }

  // Update the useEffect for textarea height adjustment
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      console.log('Text changed, current value length:', replyText.length)
      
      // Only adjust height if there's text
      if (replyText.length > 0) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = '150px'
        
        // Calculate new height (capped at 2x original height)
        const newHeight = Math.min(300, Math.max(150, textarea.scrollHeight))
        console.log('Calculated new height:', newHeight)
        setTextareaHeight(newHeight)
        textarea.style.height = `${newHeight}px`
      } else {
        // If text is empty, reset to default height
        console.log('Text is empty, resetting to default height')
        textarea.style.height = '150px'
        setTextareaHeight(150)
      }
    }
  }, [replyText])

  // Handle textarea auto-expand (keep this for direct user input)
  const handleTextareaChange = (e) => {
    setReplyText(e.target.value)
  }

  // Add this function to handle category selection while in ticket detail view
  const handleCategorySelect = async (value, categoryName) => {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          member:created_by (
            email,
            first_name,
            last_name
          )
        `)
        .eq('status', value)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to include member info
      const ticketsWithMemberInfo = tickets.map(ticket => ({
        ...ticket,
        member_email: ticket.member?.email || 'No email provided',
        first_name: ticket.member?.first_name,
        last_name: ticket.member?.last_name
      }))

      // Close the ticket detail view and pass both the filtered tickets and category
      onClose(ticketsWithMemberInfo, categoryName)
    } catch (error) {
      console.error('Error fetching filtered tickets:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-white">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 mr-2">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-3 flex-1">
          <h1 className="text-lg font-medium text-gray-900">{ticket.title}</h1>
          <div className="relative header-status-container">
            <button
              ref={headerStatusRef}
              onClick={() => setShowHeaderStatusMenu(!showHeaderStatusMenu)}
              className={`px-2 py-1 text-sm rounded-full uppercase font-medium inline-flex items-center space-x-1 ${
                ticket.status === 'open' ? 'bg-green-100 text-green-800' : 
                ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'solved' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'closed' ? 'bg-gray-600 text-white' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              <span>{ticket.status.replace('_', ' ')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showHeaderStatusMenu && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu">
                  {['solved', 'closed', 'open', 'in_progress'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(status)
                        setShowHeaderStatusMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                      role="menuitem"
                    >
                      Mark as {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-500">
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 bg-gray-50 w-full overflow-hidden">
        {/* Conversation thread and reply box container */}
        <div className="flex-1 flex flex-col max-h-screen">
          {/* Conversation thread */}
          <div className="flex-1 overflow-y-auto px-4 pt-6">
            {messages.map(message => (
              <div key={message.id} className="flex space-x-3 mb-6">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {message.sender === 'customer' 
                        ? (ticket.first_name?.[0]?.toUpperCase() || 'M')
                        : 'A'
                      }
                    </span>
                  </div>
                </div>
                <div className={`flex-1 min-w-0 pr-4 rounded-lg p-4 ${
                  message.sender === 'customer' 
                    ? 'bg-white' 
                    : 'bg-blue-50'
                }`}>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-900">
                      {message.sender === 'customer' 
                        ? `${ticket.first_name || ''} ${ticket.last_name || ''}`.trim() || 'Member'
                        : 'Agent'
                      }
                    </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-gray-500">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply box */}
          <div className="bg-white border-t border-gray-200 flex-shrink-0">
            <div className="w-full">
              <div className="flex items-center justify-between py-3 text-sm text-gray-600 px-4">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center">
                    <span className="text-gray-500">To</span>
                    <div className="ml-2 flex items-center bg-gray-100 rounded-full px-2 py-1">
                      <span className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 mr-1">
                        {ticket.member_email?.[0]?.toUpperCase() || 'C'}
                      </span>
                      <span>{ticket.member_email || 'Customer'}</span>
                    </div>
                  </span>
                  <div className="relative bcc-menu-container flex items-center">
                    <button 
                      ref={bccButtonRef}
                      onClick={() => setShowBccMenu(!showBccMenu)}
                      className="text-blue-600 text-sm hover:text-blue-700 flex items-center"
                    >
                      BCC
                      {bccRecipients.length > 1 && (
                        <span className="ml-1 bg-blue-100 text-blue-600 text-xs rounded-full px-2">
                          {bccRecipients.length}
                        </span>
                      )}
                    </button>
                    {bccRecipients.length === 1 && (
                      <div className="ml-2 flex items-center bg-gray-100 rounded-full px-2 py-1">
                        <span className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 mr-1">
                          {bccRecipients[0].first_name[0]}
                        </span>
                        <span className="text-gray-700">{bccRecipients[0].email}</span>
                        <button
                          onClick={() => toggleBccRecipient(bccRecipients[0])}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {showBccMenu && (
                      <div className="absolute left-0 top-full mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-48 overflow-y-auto">
                        <div className="py-1">
                          {agents.map((agent) => {
                            const isSelected = bccRecipients.some(r => r.id === agent.id)
                            return (
                              <button
                                key={agent.id}
                                onClick={() => toggleBccRecipient(agent)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                              >
                                <span className="flex items-center">
                                  <span className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600 mr-2">
                                    {agent.first_name[0]}
                                  </span>
                                  <span className="text-gray-900">{`${agent.first_name} ${agent.last_name}`}</span>
                                </span>
                                {isSelected && (
                                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* AI Response Button */}
                <button
                  type="button"
                  onClick={handleAIResponse}
                  disabled={isGeneratingAIResponse}
                  className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 inline-flex items-center"
                >
                  {isGeneratingAIResponse ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Response
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-200">
                <div className="flex flex-col w-full">
                  <textarea
                    ref={textareaRef}
                    rows={6}
                    className="block w-full px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none text-sm resize-none border-0"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={handleTextareaChange}
                    style={{ height: `${textareaHeight}px`, maxHeight: '300px', transition: 'height 0.1s ease-out' }}
                  />
                  <div className="flex items-center justify-between py-3 px-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button className="p-2 text-gray-500 hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                      <div className="relative emoji-picker-container">
                        <button 
                          ref={emojiButtonRef}
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-gray-500 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        {showEmojiPicker && (
                          <div className="fixed" style={{
                            top: pickerPosition.top,
                            left: pickerPosition.left,
                            zIndex: 50
                          }}>
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      
                      <div className="relative status-menu-container">
                        <button
                          ref={statusButtonRef}
                          onClick={() => setShowStatusMenu(!showStatusMenu)}
                          disabled={solving}
                          className={`px-4 py-2 text-sm font-medium inline-flex items-center shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            ticket.status === 'open' ? 'text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 focus:ring-green-500' :
                            ticket.status === 'in_progress' ? 'text-yellow-700 bg-yellow-50 border border-yellow-300 hover:bg-yellow-100 focus:ring-yellow-500' :
                            ticket.status === 'solved' ? 'text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100 focus:ring-blue-500' :
                            ticket.status === 'closed' ? 'text-gray-700 bg-gray-50 border border-gray-300 hover:bg-gray-100 focus:ring-gray-500' :
                            'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500'
                          }`}
                        >
                          <span>Status: {ticket.status
                            .replace('_', ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                          </span>
                          <svg className="w-4 h-4 ml-1.5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showStatusMenu && (
                          <div className="absolute right-0 bottom-full mb-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1" role="menu">
                              {['solved', 'closed', 'open', 'in_progress'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(status)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                                  role="menuitem"
                                >
                                  Mark as {status.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        onClick={handleSubmitReply}
                        disabled={sending}
                        className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          sending ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {sending ? 'Sending...' : 'Send Email'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Member</h3>
                <div className="mt-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {ticket.first_name?.[0]?.toUpperCase() || 'M'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {`${ticket.first_name || ''} ${ticket.last_name || ''}`.trim() || 'Member'}
                      </p>
                      <p className="text-sm text-gray-500">{ticket.member_email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Properties */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Properties</h3>
                <dl className="mt-2 divide-y divide-gray-200">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{ticket.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Priority</dt>
                    <dd className="text-sm text-gray-900">{ticket.priority}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Ticket ID */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Ticket ID</h3>
                <div className="mt-2 bg-gray-50 rounded-md p-3">
                  <p className="text-sm font-mono text-gray-900">#{ticket.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 