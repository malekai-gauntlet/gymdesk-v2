import { supabase } from './supabaseClient';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Parse workout text using LLM
export const parseWorkoutText = async (text) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a fitness tracking assistant. Parse the following workout description and extract the information in a JSON format with the following fields: exercise, weight, sets, reps, bodyweight (if mentioned), notes (any additional comments). Return null for any fields not mentioned. Clean up the formatting of the field info in your extraction as applicable (e.g. Capitalize first letters, spelled out numbers should be converted to numbers, add punctuation to notes when applicable).Return only the JSON object without any markdown formatting."
      }, {
        role: "user",
        content: text
      }],
      temperature: 0.7,
    });

    // Parse the response
    const parsedData = JSON.parse(completion.choices[0].message.content);
    
    // Clean up the data
    return {
      exercise: parsedData.exercise || '',
      weight: parsedData.weight || null,
      sets: parsedData.sets ? parseInt(parsedData.sets) : null,
      reps: parsedData.reps ? parseInt(parsedData.reps) : null,
      bodyweight: parsedData.bodyweight ? parseFloat(parsedData.bodyweight) : null,
      notes: parsedData.notes || '',
      muscle_groups: detectMuscleGroups(text)
    };
  } catch (error) {
    console.error('Error parsing workout text:', error);
    return {
      exercise: '',
      weight: null,
      sets: null,
      reps: null,
      bodyweight: null,
      notes: '',
      muscle_groups: []
    };
  }
};

// Shared muscle group detection logic
export const detectMuscleGroups = (text) => {
  const muscleGroups = new Set();
  
  // Common variations and misspellings
  const muscleGroupMap = {
    'chest': ['chest', 'pec', 'bench'],
    'back': ['back', 'lat', 'row', 'pull'],
    'shoulders': ['shoulder', 'delt', 'press', 'ohp'],
    'legs': ['leg', 'quad', 'squat', 'calf', 'calves'],
    'biceps': ['bicep', 'curl', 'bi'],
    'triceps': ['tricep', 'extension', 'tri'],
    'core': ['core', 'ab', 'abs', 'plank'],
    'glutes': ['glute', 'hip', 'bridge']
  };

  // Convert text to lowercase for matching
  const lowerText = text.toLowerCase();

  // Check for each muscle group and its variations
  Object.entries(muscleGroupMap).forEach(([group, variations]) => {
    if (variations.some(term => lowerText.includes(term))) {
      muscleGroups.add(group);
    }
  });

  return Array.from(muscleGroups);
};

// Shared workout entry creation logic
export const createWorkoutEntry = async (userId, text) => {
  try {
    // Parse the workout text into structured data using LLM
    const workoutData = await parseWorkoutText(text);
    
    // Create the entry with parsed data
    const { data, error } = await supabase
      .from('workout_history')
      .insert([{
        user_id: userId,
        exercise: workoutData.exercise,
        weight: workoutData.weight,
        sets: workoutData.sets,
        reps: workoutData.reps,
        bodyweight: workoutData.bodyweight,
        notes: workoutData.notes,
        muscle_groups: workoutData.muscle_groups,
        date: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating workout entry:', error);
    throw error;
  }
}; 