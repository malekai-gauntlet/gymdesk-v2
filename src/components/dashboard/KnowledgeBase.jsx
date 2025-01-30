import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import AddKnowledgeEntryModal from './AddKnowledgeEntryModal'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { supabase } from '../../lib/supabaseClient'
import { toast } from 'react-hot-toast'

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    fetchEntries()

    // Set up real-time subscription
    const subscription = supabase
      .channel('knowledge-base-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'knowledge_base' },
        (payload) => {
          console.log('Knowledge base change received:', payload)
          fetchEntries() // Refetch entries when any changes occur
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      console.log('Fetched entries:', data)
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching knowledge base entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async (formData) => {
    try {
      // Prepare the entry data
      const entry = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Split by comma and remove empty tags
        category: 'general', // Default category
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        embedding_text: `Title: ${formData.title}\nContent: ${formData.content}\nTags: ${formData.tags}`
      }

      const { data, error } = await supabase
        .from('knowledge_base')
        .insert([entry])
        .select()
        .single()

      if (error) throw error

      console.log('Successfully added entry:', data)
      // Update local state immediately
      setEntries(currentEntries => [data, ...currentEntries])
      setShowAddModal(false)
      toast.success('Entry added successfully')
    } catch (error) {
      console.error('Error adding knowledge base entry:', error)
      toast.error('Failed to add entry')
    }
  }

  // Update handleContentChange function to only update local state
  const handleContentChange = (e) => {
    const newContent = e.target.value
    setSelectedEntry({ ...selectedEntry, content: newContent })
    setHasUnsavedChanges(true)
  }

  // Add new save function
  const handleSaveChanges = async () => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ 
          content: selectedEntry.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEntry.id)

      if (error) throw error

      setHasUnsavedChanges(false)
      toast.success('Changes saved successfully')
    } catch (error) {
      console.error('Error updating entry:', error)
      toast.error('Failed to save changes')
    }
  }

  // Add new useEffect for focusing textarea
  useEffect(() => {
    if (selectedEntry && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [selectedEntry])

  // Update handleDeleteEntry function
  const handleDeleteEntry = async (entry) => {
    setEntryToDelete(entry)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', entryToDelete.id)

      if (error) throw error

      // Immediately update UI
      setEntries(entries.filter(entry => entry.id !== entryToDelete.id))
      
      // Clear selected entry if it was the one deleted
      if (selectedEntry?.id === entryToDelete.id) {
        setSelectedEntry(null)
      }

      toast.success('Entry deleted successfully')
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    } finally {
      setShowDeleteModal(false)
      setEntryToDelete(null)
    }
  }

  // Add filtered entries computation
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const titleMatch = entry.title?.toLowerCase().includes(query);
    const contentMatch = entry.content?.toLowerCase().includes(query);
    const tagsMatch = entry.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return titleMatch || contentMatch || tagsMatch;
  });

  // Add highlight function
  const highlightMatch = (text, query) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200">{part}</span>
      ) : part
    );
  };

  return (
    <div className="flex-1 p-8 bg-gray-50">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-2">
        Settings &gt; Knowledge Base
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your organization's knowledge base entries, update content, and maintain AI training data.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Entry
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge base entries..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - Split view */}
      <div className="flex gap-6 h-[calc(100vh-13rem)]">
        {/* Left panel - Entries list */}
        <div className="w-1/2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="h-full overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                      {searchQuery.trim() 
                        ? "No entries found matching your search."
                        : "No entries found. Click \"Add Entry\" to create one."}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr 
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`cursor-pointer hover:bg-gray-50 ${selectedEntry?.id === entry.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {highlightMatch(entry.title, searchQuery)}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {entry.tags?.map((tag, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase())
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {highlightMatch(tag, searchQuery)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry);
                          }}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel - Entry detail */}
        <div className="w-1/2 bg-white rounded-lg shadow-sm p-6 overflow-y-auto border border-gray-200">
          {selectedEntry ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-medium text-gray-900">{selectedEntry.title}</h2>
                {hasUnsavedChanges && (
                  <button
                    onClick={handleSaveChanges}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                )}
              </div>
              <div className="prose max-w-none">
                <textarea
                  ref={textareaRef}
                  className="w-full min-h-[300px] p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={selectedEntry.content}
                  onChange={handleContentChange}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedEntry.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Select an entry to view and edit its content</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      <AddKnowledgeEntryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEntry}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setEntryToDelete(null)
        }}
        onConfirm={confirmDelete}
        title={entryToDelete?.title}
      />
    </div>
  )
} 