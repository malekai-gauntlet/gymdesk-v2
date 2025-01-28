import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";

/**
 * Tool for getting current date and time information
 */
export const dateTimeTool = new DynamicStructuredTool({
  name: "getCurrentDateTime",
  description: "Get the current date, time, or both. Useful for questions about current time, date, day of week, etc.",
  schema: z.object({
    format: z.enum(['date', 'time', 'both', 'day'])
      .describe("What format to return the datetime in: 'date' for current date, 'time' for current time, 'both' for date and time, 'day' for day of week")
  }),
  func: async ({ format }) => {
    const now = new Date();
    
    switch (format) {
      case 'date':
        return now.toLocaleDateString();
      case 'time':
        return now.toLocaleTimeString();
      case 'day':
        return now.toLocaleDateString('en-US', { weekday: 'long' });
      case 'both':
      default:
        return now.toLocaleString();
    }
  }
}); 