import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { toast } from 'react-hot-toast'
import { knowledgeBaseTool } from '../../../lib/knowledgeBaseUtils'
import { muscleBalanceAnalysis } from '../../../lib/workoutAnalysis'
import { dateTimeTool } from '../../../lib/utilityTools'
import { workoutEntryTool } from '../../../lib/workoutEntryTool'
import { classBookingTool } from '../../../lib/classBookingTool'
import { Client } from "langsmith"
import { supabase } from '../../../lib/supabaseClient'

// LangChain imports
import { ChatOpenAI } from "@langchain/openai"
import { AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents"
import { BufferMemory } from "langchain/memory"

// Add import at the top with other imports
import ThinkingSteps from './ThinkingSteps'

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

// Add this before the initializeAgent function
let addThinkingStepCallback = null;

// Modify the initializeAgent function
const initializeAgent = async () => {
  const executor = await initializeAgentExecutorWithOptions(
    [muscleBalanceAnalysis, dateTimeTool, workoutEntryTool, classBookingTool, knowledgeBaseTool],
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
        You can now log workouts when members tell you about their training sessions.
        You can help members view and book fitness classes.
        You can search the gym's knowledge base for facility-specific information.

        When to use the knowledge base tool:
        - When members ask about gym policies or rules
        - When they need information about specific services or amenities
        - When they ask about membership types or pricing
        - When they need facility-specific information
        - When they ask about operating hours or schedules
        - When they inquire about specific programs or services
        
        When to use the workout analysis tool:
        - When members ask about their workout balance or progress
        - When checking for potential overtraining
        - When evaluating muscle group coverage
        - When members mention pain or discomfort that might be related to imbalanced training
        
        When to use the datetime tool:
        - When members ask about current time or date
        - When they need to know what day of the week it is
        - When scheduling or timing related questions come up

        When to use the workout entry tool:
        - When members tell you about a workout they just completed
        - When they want to log their training session
        - When they describe exercises they performed
        
        When to use the class booking tool:
        - When members ask about available fitness classes
        - When members want to check class schedules
        - When members want to book a class
        - When members ask about class availability
        
        Class Booking Guidelines:
        1. When members ask about classes, first use list_classes to show available options
        2. Before booking, always check_availability to ensure there are spots
        3. Only proceed with book_class after confirming with the member
        4. Always provide class details (instructor, time, duration) before booking
        5. If a class is full, suggest alternative times/classes
        
        Injury Prevention Guidelines:
        - Tag any injury prevention advice you give with [INJURY_PREVENTION] at the start of that part of your response
        - Focus on preventive measures rather than treatment
        - If you notice patterns in their workout history that might lead to injury, proactively warn them

        Remember: Any advice you give that's related to injury prevention should be tagged with [INJURY_PREVENTION] 
        so it can be saved and displayed in their injury prevention corner.
        
        Always be friendly, clear, and safety-focused. Address members by their first name when appropriate.
        If you use the analysis tool, explain its findings in a helpful and encouraging way. Be very concise.`
      },
      callbacks: [{
        handleLLMStart: () => {
          console.log("🔄 Starting Jim AI interaction...");
          addThinkingStepCallback?.("Analyzing your request and deciding how to help...");
        },
        handleLLMEnd: () => {
          console.log("✅ Jim AI interaction completed");
          addThinkingStepCallback?.("Formulating my response...");
        },
        handleToolStart: (tool) => {
          console.log(`🛠️ Starting tool: ${tool.name}`);
          if (tool.name === "searchKnowledgeBase") {
            addThinkingStepCallback?.("Searching our gym's knowledge base...");
          } else {
            addThinkingStepCallback?.(`Using ${tool.name} to help with your request...`);
          }
        },
        handleToolEnd: (output) => {
          console.log("🛠️ Tool execution completed", { output });
          addThinkingStepCallback?.("Processing the results...");
        },
        handleAgentAction: (action) => {
          console.log("Agent action:", action);
          if (action.tool === "searchKnowledgeBase") {
            addThinkingStepCallback?.("Checking our gym's knowledge base for accurate information...");
          } else {
            addThinkingStepCallback?.(`I've decided to use my ${action.tool} tool to help you better...`);
          }
          // Add the finalizing step 2 seconds after the tool selection step
          setTimeout(() => {
            addThinkingStepCallback?.("Finalizing my response with all the information gathered...");
          }, 3000);
        },
        handleAgentEnd: () => {
          console.log("Agent ending");
        }
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

// Add this type definition above the AIAssistant component
const THINKING_STEP_STATUS = {
  PENDING: 'pending',
  VISIBLE: 'visible',
  COMPLETE: 'complete'
};

const AIAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  
  // Add new state for thinking steps
  const [thinkingSteps, setThinkingSteps] = useState([])
  const [activeStepIndex, setActiveStepIndex] = useState(-1)
  const stepCounterRef = useRef(0)  // Add this line to track step sequence

  // Modify the addThinkingStep function
  const addThinkingStep = (stepText) => {
    stepCounterRef.current += 1;  // Increment counter
    const newStep = {
      id: `${Date.now()}-${stepCounterRef.current}`,  // Combine timestamp with sequence number
      text: stepText,
      status: THINKING_STEP_STATUS.PENDING
    };
    
    setThinkingSteps(prev => [...prev, newStep]);
    setActiveStepIndex(prev => prev + 1);
    
    // Log for debugging
    console.log('Added thinking step:', newStep);
  };

  // Modify the clearThinkingSteps function
  const clearThinkingSteps = () => {
    setThinkingSteps([]);
    setActiveStepIndex(-1);
    stepCounterRef.current = 0;  // Reset counter when clearing steps
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Register the callback when component mounts
  useEffect(() => {
    addThinkingStepCallback = addThinkingStep;
    return () => {
      addThinkingStepCallback = null;
    };
  }, []);  // Empty dependency array since addThinkingStep is stable

  // Function to store injury prevention recommendations
  const storeInjuryPreventionRecommendation = async (recommendation) => {
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('injury_prevention_recommendations')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Get existing recommendations or initialize empty array
      const existingRecommendations = userData?.injury_prevention_recommendations || [];

      // Add new recommendation with timestamp
      const newRecommendation = {
        recommendation: recommendation.replace('[INJURY_PREVENTION]', '').trim(),
        created_at: new Date().toISOString(),
        source: 'jim_ai'
      };

      // Keep only the 3 most recent recommendations
      const updatedRecommendations = [newRecommendation, ...existingRecommendations].slice(0, 3);

      const { error: updateError } = await supabase
        .from('users')
        .update({ injury_prevention_recommendations: updatedRecommendations })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      console.log('Stored new injury prevention recommendation:', newRecommendation);
    } catch (error) {
      console.error('Error storing injury prevention recommendation:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    
    // Clear previous thinking steps
    clearThinkingSteps()
    
    // Add initial thinking step
    addThinkingStep("Analyzing your message...")
    
    // Add user message
    const userMessage = { role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    
    try {
      // Add user context
      const userContext = `\nMember Context:
- Name: ${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}
- Membership Status: Member
- Email: ${user?.email}
- User ID: ${user?.id}`

      if (!agentExecutor) {
        throw new Error('Agent executor not initialized');
      }

      // Execute the agent with just the input and user context
      const result = await agentExecutor.invoke({
        input: `${inputValue}\n\n${userContext}`
      });
      
      console.log('Agent result:', result);

      // Check for injury prevention recommendations in the response
      const injuryPreventionRegex = /\[INJURY_PREVENTION\](.*?)(?=\[INJURY_PREVENTION\]|$)/gs;
      const recommendations = result.output.match(injuryPreventionRegex);
      
      if (recommendations) {
        for (const recommendation of recommendations) {
          await storeInjuryPreventionRecommendation(recommendation);
        }
      }

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
      // Clear thinking steps when done
      clearThinkingSteps()
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
        
        {/* Add ThinkingSteps component here, before the typing indicator */}
        {thinkingSteps.length > 0 && (
          <ThinkingSteps 
            steps={thinkingSteps} 
            activeIndex={activeStepIndex} 
          />
        )}
        
        {/* Only show typing indicator when there are no thinking steps */}
        {isTyping && thinkingSteps.length === 0 && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 max-w-[80%] p-3 rounded-lg bg-white/5 text-gray-300">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
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