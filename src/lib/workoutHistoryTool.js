import { supabase } from './supabaseClient'
import { DynamicStructuredTool } from 'langchain/tools'
import { z } from "zod"

// Helper function to get date range
async function getDateRange(range) {
    const endDate = new Date()
    let startDate = new Date()
    
    if (range.includes('-')) {
        // Handle specific date (e.g., "2025-01-18")
        startDate = new Date(range)
        startDate.setHours(0, 0, 0, 0)
        endDate.setTime(startDate.getTime())
        endDate.setHours(23, 59, 59, 999)
        return { startDate, endDate }
    }
    
    switch(range) {
        case 'today':
            startDate.setHours(0,0,0,0)
            endDate.setHours(23,59,59,999)
            break
        case 'week':
            startDate.setDate(startDate.getDate() - 7)
            startDate.setHours(0,0,0,0)
            endDate.setHours(23,59,59,999)
            break
        case 'month':
            startDate.setMonth(startDate.getMonth() - 1)
            startDate.setHours(0,0,0,0)
            endDate.setHours(23,59,59,999)
            break
        default:
            startDate.setDate(startDate.getDate() - 30)
            startDate.setHours(0,0,0,0)
            endDate.setHours(23,59,59,999)
    }
    
    return { startDate, endDate }
}

// Get workout history for a user within a date range
async function getWorkoutHistory(userId, dateRange = 'month') {
    try {
        let query = supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId)

        // Simple date handling
        if (dateRange.includes('-')) {
            // For specific dates (e.g. "2025-01-18"), use direct equality
            query = query.eq('date::date', dateRange)
        } else {
            // For relative dates, use simple date math
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (dateRange === 'today') {
                query = query.eq('date::date', today.toISOString().split('T')[0])
            } else if (dateRange === 'week') {
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                query = query.gte('date::date', weekAgo.toISOString().split('T')[0])
            } else {
                // Default to last 30 days
                const monthAgo = new Date(today)
                monthAgo.setDate(monthAgo.getDate() - 30)
                query = query.gte('date::date', monthAgo.toISOString().split('T')[0])
            }
        }

        const { data: workouts, error } = await query.order('date', { ascending: false })

        if (error) throw error

        return {
            success: true,
            workouts: workouts.map(w => ({
                date: new Date(w.date).toLocaleDateString(),
                exercise: w.exercise,
                sets: w.sets,
                reps: w.reps,
                weight: w.weight,
                notes: w.notes,
                category: w.exercise_category,
                muscle_groups: w.muscle_groups
            }))
        }
    } catch (error) {
        console.error('Error getting workout history:', error)
        return {
            success: false,
            error: 'Failed to retrieve workout history'
        }
    }
}

// Get statistics for a specific exercise
async function getExerciseStats(userId, exercise, dateRange = 'month') {
    try {
        let query = supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId)
            .ilike('exercise', `%${exercise}%`)

        // Simple date handling
        if (dateRange.includes('-')) {
            query = query.eq('date::date', dateRange)
        } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (dateRange === 'today') {
                query = query.eq('date::date', today.toISOString().split('T')[0])
            } else if (dateRange === 'week') {
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                query = query.gte('date::date', weekAgo.toISOString().split('T')[0])
            } else {
                const monthAgo = new Date(today)
                monthAgo.setDate(monthAgo.getDate() - 30)
                query = query.gte('date::date', monthAgo.toISOString().split('T')[0])
            }
        }

        const { data: workouts, error } = await query.order('date', { ascending: false })

        if (error) throw error

        // Calculate stats
        let totalSets = 0
        let totalReps = 0
        let maxWeight = 0
        
        workouts.forEach(w => {
            totalSets += w.sets || 0
            totalReps += (w.sets || 0) * (w.reps || 0)
            maxWeight = Math.max(maxWeight, parseFloat(w.weight) || 0)
        })

        return {
            success: true,
            stats: {
                exercise,
                period: dateRange,
                workoutCount: workouts.length,
                totalSets,
                totalReps,
                maxWeight,
                lastWorkout: workouts[0]?.date ? new Date(workouts[0].date).toLocaleDateString() : 'N/A'
            }
        }
    } catch (error) {
        console.error('Error getting exercise stats:', error)
        return {
            success: false,
            error: 'Failed to retrieve exercise statistics'
        }
    }
}

// Get workout summary for a period
async function getWorkoutSummary(userId, dateRange = 'month') {
    try {
        let query = supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId)

        // Simple date handling
        if (dateRange.includes('-')) {
            query = query.eq('date::date', dateRange)
        } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (dateRange === 'today') {
                query = query.eq('date::date', today.toISOString().split('T')[0])
            } else if (dateRange === 'week') {
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                query = query.gte('date::date', weekAgo.toISOString().split('T')[0])
            } else {
                const monthAgo = new Date(today)
                monthAgo.setDate(monthAgo.getDate() - 30)
                query = query.gte('date::date', monthAgo.toISOString().split('T')[0])
            }
        }

        const { data: workouts, error } = await query.order('date', { ascending: false })

        if (error) throw error

        // Get unique workout days
        const uniqueDays = new Set(workouts.map(w => w.date.split('T')[0]))
        
        // Group by category
        const categorySummary = {}
        const muscleGroupSummary = {}
        
        workouts.forEach(w => {
            // Count by category
            if (w.exercise_category) {
                categorySummary[w.exercise_category] = (categorySummary[w.exercise_category] || 0) + 1
            }
            
            // Count by muscle groups
            if (w.muscle_groups) {
                w.muscle_groups.forEach(mg => {
                    muscleGroupSummary[mg] = (muscleGroupSummary[mg] || 0) + 1
                })
            }
        })

        return {
            success: true,
            summary: {
                period: dateRange,
                totalDays: uniqueDays.size,  // Number of unique workout days
                totalExercises: workouts.length, // Total number of exercises
                categorySummary,
                muscleGroupSummary,
                firstWorkout: workouts[workouts.length - 1]?.date ? 
                    new Date(workouts[workouts.length - 1].date).toLocaleDateString() : 'N/A',
                lastWorkout: workouts[0]?.date ? 
                    new Date(workouts[0].date).toLocaleDateString() : 'N/A'
            }
        }
    } catch (error) {
        console.error('Error getting workout summary:', error)
        return {
            success: false,
            error: 'Failed to retrieve workout summary'
        }
    }
}

export const workoutHistoryTool = new DynamicStructuredTool({
    name: "workoutHistory",
    description: "Tool for querying and analyzing user workout history",
    schema: z.object({
        action: z.enum(["show_history", "exercise_stats", "summary"]),
        date_range: z.string().describe("Date range ('today', 'week', 'month') or specific date (YYYY-MM-DD)"),
        exercise: z.string().optional().describe("Specific exercise to get stats for"),
        user_id: z.string().describe("User ID to query workout history for")
    }),
    func: async ({ action, date_range = 'month', exercise, user_id }) => {
        try {
            let result
            
            switch (action) {
                case "show_history":
                    result = await getWorkoutHistory(user_id, date_range)
                    break
                case "exercise_stats":
                    if (!exercise) throw new Error("Exercise name is required for stats")
                    result = await getExerciseStats(user_id, exercise, date_range)
                    break
                case "summary":
                    result = await getWorkoutSummary(user_id, date_range)
                    break
                default:
                    throw new Error(`Unknown action: ${action}`)
            }
            
            return JSON.stringify({
                name: "workoutHistory",
                action,
                ...result
            })
        } catch (error) {
            console.error('Workout history tool error:', error)
            return JSON.stringify({
                name: "workoutHistory",
                action,
                success: false,
                error: error.message || 'An error occurred in the workout history tool'
            })
        }
    }
}) 