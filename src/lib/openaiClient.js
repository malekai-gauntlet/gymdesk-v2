import OpenAI from 'openai'
import { findRelevantEntries } from './knowledgeBaseUtils'
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Client } from "langsmith";

// Initialize LangSmith client
const client = new Client({
  apiUrl: "https://api.smith.langchain.com",
  apiKey: import.meta.env.VITE_LANGCHAIN_API_KEY,
});

// Initialize LangChain's ChatOpenAI with tracing
const langChainModel = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0,
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  configuration: {
    baseURL: "https://api.openai.com/v1"
  }
});

// Set tracing environment variables explicitly
if (typeof window !== 'undefined') {
  window.process = {
    ...window.process,
    env: {
      LANGCHAIN_TRACING_V2: "true",
      LANGCHAIN_API_KEY: import.meta.env.VITE_LANGCHAIN_API_KEY,
      LANGCHAIN_PROJECT: import.meta.env.VITE_LANGCHAIN_PROJECT
    }
  };
}

console.log('🔧 LangChain Model Configuration:', {
  hasApiKey: !!langChainModel.openAIApiKey,
  config: langChainModel.configuration,
  modelName: langChainModel.modelName,
  tracingConfig: window?.process?.env || 'Not Set'
});

// Create a prompt template for your ticket responses
const ticketPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are a professional customer service representative for a gym."],
  ["user", `Title: {title}
Customer Name: {memberName}
Customer Request: {description}
Agent Name: {agentName}
Agent Position: {agentPosition}
{knowledgeBaseContext}

Write a response that is:
1. Professional and courteous
2. Directly addresses the customer's request
3. Clear and concise
4. Helpful and solution-oriented
5. Start with "Hi {memberName}" if a name is provided
6. End with a professional signature using the agent's name and position
7. Incorporate relevant gym policies when applicable`]
]);

// Create the chain with explicit tracing options
const ticketChain = ticketPromptTemplate
  .pipe(langChainModel)
  .pipe(new StringOutputParser())
  .withConfig({
    callbacks: [{
      handleLLMStart: () => console.log("🔄 Starting LLM call with tracing..."),
      handleLLMEnd: () => console.log("✅ LLM call completed, trace should be sent"),
    }],
    tags: ["ticket-response"],
  });

console.log('🔗 LangChain Chain Setup:', {
  hasPromptTemplate: !!ticketPromptTemplate,
  hasModel: !!langChainModel,
  hasChain: !!ticketChain,
  tracingEnabled: !!langChainModel.tracing
});

// New function using LangChain (you can gradually migrate to this)
export const generateTicketResponseWithTracing = async (ticket) => {
  console.log('Starting generateTicketResponseWithTracing with config:', {
    modelConfig: {
      temperature: langChainModel.temperature,
      modelName: langChainModel.modelName,
      tracing: langChainModel.tracing,
      openAIApiKey: !!langChainModel.openAIApiKey // just log if it exists
    },
    hasTicketChain: !!ticketChain
  });

  console.log('🤖 Generating AI response for ticket:', {
    title: ticket.title,
    description: ticket.description
  });

  const relevantEntries = await findRelevantEntries(ticket.title + " " + ticket.description);
  
  const knowledgeBaseContext = relevantEntries.length > 0 
    ? `Relevant gym policies and information:\n${relevantEntries.map(entry => 
        `${entry.title}:\n${entry.content}`
      ).join('\n\n')}`
    : '';

  try {
    console.log('Invoking ticketChain with inputs:', {
      title: ticket.title,
      memberName: ticket.memberName,
      description: ticket.description?.substring(0, 100) + '...',
      agentName: ticket.agentName,
      agentPosition: ticket.agentPosition
    });

    const response = await ticketChain.invoke({
      title: ticket.title,
      memberName: ticket.memberName,
      description: ticket.description,
      agentName: ticket.agentName,
      agentPosition: ticket.agentPosition,
      knowledgeBaseContext
    });

    console.log('TicketChain response received:', { responseLength: response?.length });

    if (relevantEntries.length > 0) {
      const citations = '\n\n---\nSources:\n' + relevantEntries
        .map(entry => `• ${entry.title}`)
        .join('\n');
      return response + citations;
    }

    return response;
  } catch (error) {
    console.error('Detailed error in generateTicketResponseWithTracing:', {
      error,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};


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