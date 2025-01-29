import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { createWorkoutEntry } from './workoutUtils';

// Create a custom event for workout updates
export const WORKOUT_ADDED_EVENT = 'workoutAdded';
export const workoutEventEmitter = new EventTarget();

/**
 * Tool for creating workout entries from natural language descriptions
 */
export const workoutEntryTool = new DynamicStructuredTool({
  name: "createWorkoutEntry",
  description: "Creates a new workout entry from a natural language description. Use this when a user describes their workout and you want to log it. The description should include exercise name, weight (if applicable), sets, reps, and any notes.",
  schema: z.object({
    userId: z.string().uuid().describe("The UUID of the user creating the workout entry"),
    workoutDescription: z.string().describe("The natural language description of the workout, including exercise name, weight, sets, reps, and any notes")
  }),
  func: async ({ userId, workoutDescription }) => {
    try {
      // Create the workout entry with parsed data
      const entry = await createWorkoutEntry(userId, workoutDescription);
      
      // Emit event with the new workout data
      const event = new CustomEvent(WORKOUT_ADDED_EVENT, { 
        detail: {
          id: entry.id,
          date: new Date(entry.date).toLocaleDateString(),
          exercise: entry.exercise,
          weight: entry.weight || '',
          sets: entry.sets?.toString() || '',
          reps: entry.reps?.toString() || '',
          bodyweight: entry.bodyweight?.toString() || '',
          notes: entry.notes || '',
          muscle_groups: entry.muscle_groups || []
        }
      });
      workoutEventEmitter.dispatchEvent(event);
      
      // Prepare a friendly confirmation message
      const details = [];
      if (entry.exercise) details.push(`Exercise: ${entry.exercise}`);
      if (entry.weight) details.push(`Weight: ${entry.weight}`);
      if (entry.sets) details.push(`Sets: ${entry.sets}`);
      if (entry.reps) details.push(`Reps: ${entry.reps}`);
      if (entry.bodyweight) details.push(`Bodyweight: ${entry.bodyweight}`);
      if (entry.notes) details.push(`Notes: ${entry.notes}`);
      if (entry.muscle_groups?.length > 0) details.push(`Muscle Groups: ${entry.muscle_groups.join(', ')}`);
      
      return JSON.stringify({
        success: true,
        message: `Workout logged successfully!\n${details.join('\n')}`,
        entry: entry
      });
    } catch (error) {
      console.error('Error in workout entry tool:', error);
      return JSON.stringify({
        success: false,
        message: "Sorry, I couldn't log your workout. Please try again with exercise name, sets, and reps clearly stated.",
        error: error.message
      });
    }
  }
}); 