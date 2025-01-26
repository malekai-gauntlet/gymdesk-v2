import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function DashboardSidebar({ onTicketSelect, selectedTicketId, handleCategorySelect }) {
  const [allTickets, setAllTickets] = useState([]) // Keep track of all tickets
  const [displayTickets, setDisplayTickets] = useState([]) // For filtered display
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All tickets')
  const [stats, setStats] = useState({
    unsolvedTickets: 0,
    unassignedTickets: 0,
    allUnsolvedTickets: 0,
    recentlyUpdatedTickets: 0,
    pendingTickets: 0,
    recentlySolvedTickets: 0
  })

  useEffect(() => {
    fetchTickets()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('tickets-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          fetchTickets() // Refetch tickets when any changes occur
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchTickets() {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          history,
          member:created_by (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to include member info
      const ticketsWithMemberInfo = tickets.map(ticket => ({
        ...ticket,
        member_email: ticket.member?.email || 'No email provided',
        first_name: ticket.member?.first_name,
        last_name: ticket.member?.last_name
      }))

      // Calculate stats
      const stats = {
        unsolvedTickets: tickets.filter(t => t.status === 'open').length,
        unassignedTickets: tickets.filter(t => !t.assigned_to).length,
        allUnsolvedTickets: tickets.filter(t => t.status !== 'closed').length,
        recentlyUpdatedTickets: tickets.filter(t => {
          const lastWeek = new Date()
          lastWeek.setDate(lastWeek.getDate() - 7)
          return new Date(t.updated_at || t.created_at) > lastWeek
        }).length,
        pendingTickets: tickets.filter(t => t.status === 'pending').length,
        recentlySolvedTickets: tickets.filter(t => t.status === 'closed').length
      }

      setStats(stats)
      setAllTickets(ticketsWithMemberInfo) // Store all tickets with member info
      setDisplayTickets(ticketsWithMemberInfo) // Initially show all tickets with member info
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchFilteredTickets(value, categoryName, field = 'status') {
    console.log(`=== Fetching Filtered Tickets ===`)
    console.log(`Filtering by ${field}:`, value)
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          history,
          member:created_by (
            email,
            first_name,
            last_name
          )
        `)
        .eq(field, value)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      console.log('Raw tickets from query:', tickets)

      // Transform the data to include member info
      const ticketsWithMemberInfo = tickets.map(ticket => ({
        ...ticket,
        member_email: ticket.member?.email || 'No email provided',
        first_name: ticket.member?.first_name,
        last_name: ticket.member?.last_name
      }))

      console.log('Filtered tickets received:', ticketsWithMemberInfo)
      console.log('Number of tickets:', ticketsWithMemberInfo.length)
      setDisplayTickets(ticketsWithMemberInfo) // Update display tickets with member info
      handleCategorySelect(ticketsWithMemberInfo, categoryName)  // Pass both tickets and category name
    } catch (error) {
      console.error('Error fetching filtered tickets:', error)
    }
  }

  const ticketCategories = [
    { name: 'All tickets', count: allTickets.length }, // Use allTickets for counts
    { name: 'Open tickets', count: allTickets.filter(t => t.status === 'open').length },
    { name: 'In progress tickets', count: allTickets.filter(t => t.status === 'in_progress').length },
    { name: 'Solved tickets', count: allTickets.filter(t => t.status === 'solved').length },
    { name: 'Closed tickets', count: allTickets.filter(t => t.status === 'closed').length },
    { name: 'AI tickets', count: allTickets.filter(t => t.status === 'ai').length }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto h-screen">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Ticket Types</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-1">
          {ticketCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => {
                if (category.name === 'All tickets') {
                  setDisplayTickets(allTickets);
                  handleCategorySelect(allTickets, category.name);
                  setSelectedCategory(category.name);
                }
                else if (category.name === 'Open tickets') {
                  fetchFilteredTickets('open', category.name);
                  setSelectedCategory(category.name);
                }
                else if (category.name === 'In progress tickets') {
                  fetchFilteredTickets('in_progress', category.name);
                  setSelectedCategory(category.name);
                }
                else if (category.name === 'Solved tickets') {
                  fetchFilteredTickets('solved', category.name);
                  setSelectedCategory(category.name);
                }
                else if (category.name === 'Closed tickets') {
                  fetchFilteredTickets('closed', category.name);
                  setSelectedCategory(category.name);
                }
                else if (category.name === 'AI tickets') {
                  fetchFilteredTickets('ai', category.name);
                  setSelectedCategory(category.name);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${selectedCategory === category.name 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <span>{category.name}</span>
              <span className="text-gray-500">{category.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 