import { supabase } from './supabaseClient';

/**
 * Analyzes muscle balance from workout history
 * @param {string} userId - The user's ID
 * @param {number} daysToAnalyze - Number of days of history to analyze (default: 30)
 * @returns {Object} Analysis results including muscle group frequencies, push/pull ratio, warnings, and recommendations
 */
export const muscleBalanceAnalysis = async (userId, daysToAnalyze = 30) => {
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

    return analysis;
  } catch (error) {
    console.error('Error in muscle balance analysis:', error);
    throw error;
  }
}; 