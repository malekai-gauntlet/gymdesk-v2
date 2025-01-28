import { supabase } from './supabaseClient';
import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";

const workoutAnalysisSchema = z.object({
  userId: z.string().describe("The user's ID to analyze workout history for"),
  daysToAnalyze: z.number().optional().default(30).describe("Number of days of history to analyze")
});

/**
 * Tool for analyzing muscle balance from workout history
 */
export const muscleBalanceAnalysis = new DynamicStructuredTool({
  name: "muscleBalanceAnalysis",
  description: "Analyzes workout history to check muscle balance and identify potential issues. Requires the user's UUID, not their email.",
  schema: z.object({
    userId: z.string().uuid().describe("The UUID of the user whose workouts to analyze (not their email)"),
    daysToAnalyze: z.number().describe("Number of days of workout history to analyze")
  }),
  func: async ({ userId, daysToAnalyze }) => {
    console.log('Workout Analysis Tool called with:', { userId, daysToAnalyze });
    try {
      // Fetch workout data for the specified time period
      const { data: workoutData, error } = await supabase
        .from('workout_history')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Initialize analysis object
      const analysis = {
        muscleGroups: {},
        pushPullRatio: 0,
        warnings: [],
        recommendations: []
      };

      // Calculate muscle group frequencies
      workoutData.forEach(workout => {
        workout.muscle_groups?.forEach(muscle => {
          if (!analysis.muscleGroups[muscle]) {
            analysis.muscleGroups[muscle] = {
              count: 0,
              lastWorkout: null
            };
          }
          analysis.muscleGroups[muscle].count++;
          if (!analysis.muscleGroups[muscle].lastWorkout || 
              new Date(workout.date) > new Date(analysis.muscleGroups[muscle].lastWorkout)) {
            analysis.muscleGroups[muscle].lastWorkout = workout.date;
          }
        });
      });

      // Calculate push/pull ratio
      const pushCount = (analysis.muscleGroups['chest']?.count || 0) + 
                       (analysis.muscleGroups['triceps']?.count || 0) + 
                       (analysis.muscleGroups['shoulders']?.count || 0);
      const pullCount = (analysis.muscleGroups['back']?.count || 0) + 
                       (analysis.muscleGroups['biceps']?.count || 0);
      
      analysis.pushPullRatio = pullCount / (pushCount || 1);

      // Generate warnings for imbalances
      if (analysis.pushPullRatio > 2) {
        analysis.warnings.push("Significant imbalance detected: Pull exercises greatly exceed push exercises");
      }
      if (analysis.pushPullRatio < 0.5) {
        analysis.warnings.push("Significant imbalance detected: Push exercises greatly exceed pull exercises");
      }

      // Check for neglected muscle groups
      const muscleGroups = ['legs', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'core'];
      muscleGroups.forEach(muscle => {
        if (!analysis.muscleGroups[muscle] || analysis.muscleGroups[muscle].count === 0) {
          analysis.warnings.push(`${muscle} appears to be neglected in your training`);
        }
      });

      // Generate recommendations based on analysis
      if (analysis.warnings.length > 0) {
        if (analysis.pushPullRatio > 2) {
          analysis.recommendations.push("Consider incorporating more push exercises (chest, shoulders, triceps) to balance your training");
        }
        if (analysis.pushPullRatio < 0.5) {
          analysis.recommendations.push("Consider incorporating more pull exercises (back, biceps) to balance your training");
        }
        
        // Add recommendations for neglected muscle groups
        muscleGroups.forEach(muscle => {
          if (!analysis.muscleGroups[muscle] || analysis.muscleGroups[muscle].count === 0) {
            analysis.recommendations.push(`Add ${muscle} exercises to your routine for balanced development`);
          }
        });
      }

      const result = JSON.stringify(analysis);
      console.log('Analysis result:', result);
      return result;
    } catch (error) {
      console.error('Error in workout analysis:', error);
      throw error;
    }
  }
}); 