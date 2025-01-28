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
      handleLLMNewToken: (token) => {
        console.log("New token:", token);
        // We'll use this callback to stream tokens to the UI
        if (window.streamCallback) {
          window.streamCallback(token);
        }
      },
    }],
    tags: ["ticket-response"],
  });

export const generateTicketResponseWithTracing = async (ticket, onToken) => {
  try {
    // Set up streaming callback
    window.streamCallback = onToken;
    
    const relevantEntries = await findRelevantEntries(ticket.title + " " + ticket.description);
    
    const knowledgeBaseContext = relevantEntries.length > 0 
      ? `Relevant gym policies and information:\n${relevantEntries.map(entry => 
          `${entry.title}:\n${entry.content}`
        ).join('\n\n')}`
      : '';

    const response = await ticketChain.invoke({
      title: ticket.title,
      memberName: ticket.memberName,
      description: ticket.description,
      agentName: ticket.agentName,
      agentPosition: ticket.agentPosition,
      knowledgeBaseContext
    });

    // Clean up streaming callback
    window.streamCallback = null;

    if (relevantEntries.length > 0) {
      const citations = '\n\n---\nSources:\n' + relevantEntries
        .map(entry => `• ${entry.title}`)
        .join('\n');
      return response + citations;
    }

    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    window.streamCallback = null; // Clean up on error
    throw error;
  }
};

export default langChainModel 