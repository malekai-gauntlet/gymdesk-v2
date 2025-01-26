import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface TicketData {
  title: string
  description: string
  priority: string
  created_by: string
  status: string
  member_email: string
  type?: 'notification' | 'reply'  // New field to differentiate between notification and reply
  reply_text?: string             // New field for agent replies
  bcc?: string[]  // Add BCC field to interface
}

// Validate required fields based on type
const validateTicketData = (ticket: TicketData) => {
  const requiredFields = ['title', 'description', 'priority', 'status', 'member_email']
  const missingFields = requiredFields.filter(field => !ticket[field])
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }

  if (ticket.type === 'reply' && !ticket.reply_text) {
    throw new Error('reply_text is required for reply type tickets')
  }
}

// Function to generate email content based on type
const getEmailContent = (ticket: TicketData) => {
  if (ticket.type === 'reply') {
    return {
      subject: `Re: ${ticket.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Response to Your Support Ticket</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #555;">${ticket.reply_text}</p>
          </div>
          <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px;">
            <p style="color: #666; font-size: 14px;"><strong>Original Request:</strong></p>
            <p style="color: #666; font-size: 14px;">${ticket.description}</p>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #999;">
            <p>Ticket #${ticket.title} • Priority: ${ticket.priority}</p>
          </div>
        </div>
      `
    }
  }

  // Default notification template (existing functionality)
  return {
    subject: `New Support Ticket: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Support Ticket</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p><strong>Member Email:</strong> ${ticket.member_email}</p>
          <p><strong>Description:</strong></p>
          <p>${ticket.description}</p>
        </div>
      </div>
    `
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Edge Function Invoked ===')
    
    // Log the RESEND_API_KEY presence (not the actual key)
    console.log('RESEND_API_KEY present:', !!RESEND_API_KEY)
    
    const ticket: TicketData = await req.json()
    console.log('Received ticket data:', JSON.stringify(ticket, null, 2))
    
    try {
      // Validate the ticket data
      validateTicketData(ticket)
      console.log('Ticket data validation passed')
    } catch (validationError) {
      console.error('Validation error:', validationError.message)
      throw validationError
    }
    
    if (!RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY environment variable')
      throw new Error('Missing RESEND_API_KEY')
    }

    // Get email content based on type
    const emailContent = getEmailContent(ticket)
    
    // For testing: Use the verified email address
    // TODO: Remove this override when domain is verified in production
    const recipient = 'malekai.mischke@gauntletai.com' // Temporary override for testing
    const actualRecipient = ticket.member_email // Store actual recipient for future use
    
    console.log('Email content generated:', {
      subject: emailContent.subject,
      recipient,
      actualRecipient, // Log both for clarity
      type: ticket.type,
      hasHtml: !!emailContent.html
    })
    
    console.log('Attempting to send email via Resend API...')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: recipient,
        bcc: ticket.bcc || [], // Add BCC recipients to email
        subject: emailContent.subject,
        html: `
          ${emailContent.html}
          ${ticket.type === 'reply' ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                [Testing Mode] This email would normally be sent to: ${actualRecipient}
              </p>
            </div>
          ` : ''}
        `
      })
    })

    const result = await response.json()
    console.log('Resend API response status:', response.status)
    console.log('Resend API response:', result)

    if (!response.ok) {
      console.error('Resend API error:', {
        status: response.status,
        result: result,
        error: result.message || 'Unknown error'
      })
      throw new Error(result.message || 'Failed to send email')
    }

    console.log('Email sent successfully')
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Edge Function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      type: 'error',
      name: error.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 