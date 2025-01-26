import { useState } from 'react'
import NavigationBar from './NavigationBar'
import DashboardSidebar from './DashboardSidebar'
import MainContent from './MainContent'
import MemberSidebar from './MemberSidebar'
import SettingsSidebar from './SettingsSidebar'

export default function DashboardLayout() {
  const [selectedView, setSelectedView] = useState('dashboard')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [filteredTickets, setFilteredTickets] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All Tickets')
  const [activeSection, setActiveSection] = useState('settings')

  const handleViewChange = (view) => {
    // For settings-related views, keep selectedView as 'settings'
    if (['settings', 'billing', 'people-team-members'].includes(view)) {
      setSelectedView('settings')
      setActiveSection(view)
    } else {
      setSelectedView(view)
      setActiveSection(null) // Reset activeSection when leaving settings
    }
    setSelectedTicket(null)
  }

  const handleTicketUpdate = (ticketData, categoryName) => {
    if (Array.isArray(ticketData)) {
      // If we receive an array, it's filtered tickets
      setFilteredTickets(ticketData)
      if (categoryName) {
        setSelectedCategory(categoryName)
      }
      setSelectedTicket(null) // Clear selected ticket when showing filtered view
    } else {
      // If we receive a single ticket, it's for viewing details
      setSelectedTicket(ticketData)
    }
  }

  const renderSidebar = () => {
    switch (selectedView) {
      case 'dashboard':
        return <DashboardSidebar 
          onTicketSelect={handleTicketUpdate} 
          selectedTicketId={selectedTicket?.id}
          handleCategorySelect={handleTicketUpdate} // Pass the handler to the sidebar
        />
      case 'customers':
        return <MemberSidebar selectedView={selectedView} />
      case 'settings':
        return <SettingsSidebar onSectionChange={handleViewChange} activeSection={activeSection} />
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <NavigationBar selectedView={selectedView} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-shrink-0">
            {renderSidebar()}
          </div>
          <div className="flex-1 overflow-auto">
            <MainContent 
              view={selectedView === 'settings' ? activeSection : selectedView}
              selectedTicket={selectedTicket} 
              onTicketSelect={handleTicketUpdate}
              filteredTickets={filteredTickets}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 