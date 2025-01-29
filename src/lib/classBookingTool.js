import { supabase } from './supabaseClient'
import { DynamicStructuredTool } from 'langchain/tools'
import { z } from "zod"

async function findClassByName(className) {
    try {
        const { data: classes, error } = await supabase
            .from('classes')
            .select('*')
            .ilike('name', `%${className}%`)
            .gt('schedule', new Date().toISOString());  // Only future classes

        if (error) throw error;

        if (!classes || classes.length === 0) {
            return {
                success: false,
                error: 'No matching classes found'
            };
        }

        return {
            success: true,
            class: classes[0]  // Return the first matching class
        };
    } catch (error) {
        console.error('Error finding class:', error);
        return {
            success: false,
            error: 'Failed to find class'
        };
    }
}

export const classBookingTool = new DynamicStructuredTool({
    name: "classBooking",
    description: "Tool for viewing available classes and managing class bookings",
    schema: z.object({
        action: z.enum(["list_classes", "book_class", "check_availability"]),
        class_id: z.string().optional().describe("UUID of the class (required for booking)"),
        date: z.string().optional().describe("Date to filter classes (YYYY-MM-DD format)"),
        class_name: z.string().optional().describe("Name of the class to find")
    }),
    func: async ({ action, class_id, date, class_name }) => {
        try {
            let result;
            
            // If class_name is provided but no class_id, try to find the class first
            if (class_name && !class_id && (action === 'book_class' || action === 'check_availability')) {
                const findResult = await findClassByName(class_name);
                if (findResult.success) {
                    class_id = findResult.class.id;
                } else {
                    return JSON.stringify({
                        name: "classBooking",
                        action: action,
                        success: false,
                        error: findResult.error
                    });
                }
            }

            switch (action) {
                case "list_classes":
                    result = await listAvailableClasses(date);
                    break;
                case "book_class":
                    if (!class_id) throw new Error("class_id is required for booking");
                    result = await bookClass(class_id);
                    break;
                case "check_availability":
                    if (!class_id) throw new Error("class_id is required for checking availability");
                    result = await checkClassAvailability(class_id);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
            
            // Format the response with the tool name
            return JSON.stringify({
                name: "classBooking",
                action: action,
                ...result
            });
        } catch (error) {
            console.error('Class booking tool error:', error);
            return JSON.stringify({
                name: "classBooking",
                action: action,
                success: false,
                error: error.message || 'An error occurred in the class booking tool'
            });
        }
    }
});

async function listAvailableClasses(date) {
    try {
        let query = supabase
            .from('classes')
            .select(`
                *,
                class_bookings:class_bookings(count)
            `)
            .gt('schedule', new Date().toISOString());  // Only future classes

        // Add date filter if provided
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            query = query
                .gte('schedule', startDate.toISOString())
                .lt('schedule', endDate.toISOString());
        }

        const { data: classes, error } = await query;

        if (error) throw error;

        return {
            success: true,
            classes: classes.map(c => ({
                id: c.id,
                name: c.name,
                instructor: c.instructor,
                schedule: new Date(c.schedule).toLocaleString(),
                duration: c.duration,
                capacity: c.capacity,
                available_spots: c.capacity - c.class_bookings[0].count,
                description: c.description
            }))
        };
    } catch (error) {
        console.error('Error listing classes:', error);
        return {
            success: false,
            error: 'Failed to list available classes'
        };
    }
}

async function checkClassAvailability(classId) {
    try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(classId)) {
            return {
                success: false,
                error: 'Invalid class ID format'
            };
        }

        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select(`
                *,
                class_bookings:class_bookings(count)
            `)
            .eq('id', classId)
            .single();

        if (classError) throw classError;

        const bookedSpots = classData.class_bookings[0].count;
        const availableSpots = classData.capacity - bookedSpots;

        return {
            success: true,
            class_name: classData.name,
            available_spots: availableSpots,
            is_available: availableSpots > 0,
            schedule: new Date(classData.schedule).toLocaleString()
        };
    } catch (error) {
        console.error('Error checking class availability:', error);
        return {
            success: false,
            error: 'Failed to check class availability'
        };
    }
}

async function bookClass(classId) {
    try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(classId)) {
            return {
                success: false,
                error: 'Invalid class ID format'
            };
        }

        // First check availability
        const availability = await checkClassAvailability(classId);
        if (!availability.success) {
            return {
                success: false,
                error: availability.error
            };
        }
        if (!availability.is_available) {
            return {
                success: false,
                error: 'Class is fully booked'
            };
        }

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error('Error getting user:', userError);
            return {
                success: false,
                error: 'Failed to get user information'
            };
        }
        if (!user || !user.id) {
            return {
                success: false,
                error: 'User not authenticated'
            };
        }

        // Check if user already booked this class
        const { data: existingBooking, error: checkError } = await supabase
            .from('class_bookings')
            .select('id')
            .eq('class_id', classId)
            .eq('user_id', user.id)
            .single();

        if (existingBooking) {
            return {
                success: false,
                error: 'You have already booked this class'
            };
        }

        // Create the booking
        const { data: booking, error: bookingError } = await supabase
            .from('class_bookings')
            .insert({
                class_id: classId,
                user_id: user.id,
                status: 'confirmed'
            })
            .select()
            .single();

        if (bookingError) {
            console.error('Booking error:', bookingError);
            throw bookingError;
        }

        return {
            success: true,
            message: `Successfully booked ${availability.class_name} for ${availability.schedule}`,
            booking_id: booking.id
        };
    } catch (error) {
        console.error('Error booking class:', error);
        return {
            success: false,
            error: error.message || 'Failed to book class'
        };
    }
} 