import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,    // Keeps the user logged in across page refreshes
    autoRefreshToken: true,  // Automatically refreshes the token before it expires
  },
  realtime: {
    params: {
      eventsPerSecond: 10    // Rate limiting for realtime events
    },
    timeout: 20000,          // Connection timeout in milliseconds
    retryAttempts: 5,        // Number of reconnection attempts
    retryInterval: 1000,     // Delay between retry attempts in milliseconds
  },
  db: {
    schema: 'public'         // Default schema to use
  }
})

// Function to send ticket notifications
export const sendTicketNotification = async (ticketData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-ticket-notification', {
      body: ticketData
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error sending ticket notification:', error)
    return { data: null, error }
  }
}

// Also add a default export for flexibility
export default supabase

// Development-only logging
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase key configured:', !!supabaseAnonKey)
} 