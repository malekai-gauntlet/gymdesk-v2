import OpenAI from 'openai'
import { findRelevantEntries } from './knowledgeBaseUtils'

// Initialize the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from the backend
})

export const generateTicketResponse = async (ticket) => {
  console.log('🤖 Generating AI response for ticket:', {
    title: ticket.title,
    description: ticket.description
  });

  // First, find relevant knowledge base entries
  const relevantEntries = await findRelevantEntries(ticket.title + " " + ticket.description)
  
  console.log('📝 Using knowledge base entries:', 
    relevantEntries.map(entry => ({
      title: entry.title,
      similarity: entry.similarity,
      preview: entry.content.substring(0, 100) + '...'
    }))
  );
  
  // Format knowledge base entries for the prompt
  const knowledgeBaseContext = relevantEntries.length > 0 
    ? `\nRelevant gym policies and information:\n${relevantEntries.map(entry => 
        `${entry.title}:\n${entry.content}`
      ).join('\n\n')}`
    : '';

  const prompt = `Please write a professional and helpful response to this support ticket. Write the response as if you are directly replying to the customer's email - do not include any subject line or email headers, just the message body. If you use information from the provided gym policies, make sure to reference it naturally in your response:

Title: ${ticket.title}
Customer Name: ${ticket.memberName}
Customer Request: ${ticket.description}
Agent Name: ${ticket.agentName}
Agent Position: ${ticket.agentPosition}${knowledgeBaseContext}

Write a response that is:
1. Professional and courteous
2. Directly addresses the customer's request
3. Clear and concise
4. Helpful and solution-oriented
5. Start with "Hi ${ticket.memberName}" if a name is provided (use the first name if possible), otherwise use an appropriate greeting
6. End with a professional signature using the agent's name and position
7. Incorporate relevant gym policies and information from the knowledge base when applicable

Best regards,
[Agent Name - use first name if possible]
GymDesk Team`

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    const response = completion.choices[0].message.content.trim();

    // Add citations if we have relevant entries
    if (relevantEntries.length > 0) {
      const citations = '\n\n---\nSources:\n' + relevantEntries
        .map(entry => `• ${entry.title}`)
        .join('\n');
      return response + citations;
    }

    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

export default openai 