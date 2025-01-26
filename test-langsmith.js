import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Please respond to the user's request only based on the given context."],
  ["user", "Question: {question}\nContext: {context}"],
]);

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
const outputParser = new StringOutputParser();

const chain = prompt.pipe(model).pipe(outputParser);

async function main() {
  const question = "Can you summarize this morning's meetings?";
  const context = "During this morning's meeting, we solved all world conflict.";
  
  try {
    const result = await chain.invoke({ 
      question: question, 
      context: context 
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 