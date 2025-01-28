import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { toast } from 'react-hot-toast'
import { findRelevantEntries } from '../../../lib/knowledgeBaseUtils'
import { muscleBalanceAnalysis } from '../../../lib/workoutAnalysis'
import { dateTimeTool } from '../../../lib/utilityTools'
import { Client } from "langsmith"

// LangChain imports
import { ChatOpenAI } from "@langchain/openai"
import { AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents"
import { BufferMemory } from "langchain/memory"

// Initialize LangSmith client
const client = new Client({
  apiUrl: "https://api.smith.langchain.com",
  apiKey: import.meta.env.VITE_LANGCHAIN_API_KEY,
});

// Initialize LangChain Chat Model
const chatModel = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

// Initialize the agent executor
const initializeAgent = async () => {
  const executor = await initializeAgentExecutorWithOptions(
    [muscleBalanceAnalysis, dateTimeTool],
    chatModel,
    {
      agentType: "openai-functions",
      memory: new BufferMemory({
        returnMessages: true,
        memoryKey: "chat_history",
        outputKey: "output",
      }),
      agentArgs: {
        prefix: `You are an intelligent gym assistant named Jim that helps members with workout advice and analysis. 
        You have access to a workout analysis tool that can detect muscle imbalances and provide recommendations.
        You can also provide current date and time information when asked.
        
        When to use the workout analysis tool:
        - When members ask about their workout balance or progress
        - When checking for potential overtraining
        - When evaluating muscle group coverage
        - When members mention pain or discomfort that might be related to imbalanced training
        
        When to use the datetime tool:
        - When members ask about current time or date
        - When they need to know what day of the week it is
        - When scheduling or timing related questions come up
        
        Always be friendly, clear, and safety-focused. Address members by their first name when appropriate.
        If you use the analysis tool, explain its findings in a helpful and encouraging way.`
      },
      // Add tracing configuration
      callbacks: [{
        handleLLMStart: () => console.log("🔄 Starting Jim AI interaction..."),
        handleLLMEnd: () => console.log("✅ Jim AI interaction completed"),
        handleToolStart: (tool) => console.log(`🛠️ Starting tool: ${tool.name}`),
        handleToolEnd: (output) => console.log("🛠️ Tool execution completed"),
      }],
      tags: ["jim-ai", "gym-assistant"],
    }
  );
  return executor;
};

let agentExecutor = null;
initializeAgent().then(executor => {
  agentExecutor = executor;
});

const AIAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    
    // Add user message
    const userMessage = { role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    
    try {
      // Search knowledge base for relevant entries
      const relevantEntries = await findRelevantEntries(inputValue)
      
      // Format knowledge base entries as context
      const knowledgeBaseContext = relevantEntries.length > 0 
        ? "\nRelevant gym information:\n" + relevantEntries.map(entry => 
            `[${entry.title}]: ${entry.content}`
          ).join('\n\n')
        : ""

      // Add user context
      const userContext = `\nMember Context:
- Name: ${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}
- Membership Status: Member
- Email: ${user?.email}
- User ID: ${user?.id}`

      if (!agentExecutor) {
        throw new Error('Agent executor not initialized');
      }

      // Execute the agent with the input
      const result = await agentExecutor.invoke({
        input: `${inputValue}\n\n${userContext}\n\n${knowledgeBaseContext}`
      });
      
      console.log('Agent result:', result);

      const aiMessage = {
        role: 'assistant',
        content: result.output
      };
      
      console.log('AI Message formatted:', aiMessage);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error)
      toast.error('Sorry, I had trouble responding. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="w-96 border-l border-gray-800 flex flex-col h-screen bg-[#1a1b23]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Jim AI</h3>
            <p className="text-sm text-gray-400">Your personal fitness guide</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className={`flex-1 max-w-[80%] p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-indigo-500/20 text-white ml-auto'
                : 'bg-white/5 text-gray-300'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about workouts, injuries, or gym services..."
            className="flex-1 bg-white/5 border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export default AIAssistant 