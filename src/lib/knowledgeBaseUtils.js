import { supabase } from './supabaseClient'

/**
 * Find relevant knowledge base entries based on semantic similarity to the query
 * @param {string} query - The search query to find relevant entries
 * @param {number} limit - Maximum number of entries to return (default: 3)
 * @param {number} similarityThreshold - Minimum similarity score to include (default: 0.5)
 * @returns {Promise<Array>} Array of relevant entries with similarity scores
 */
export async function findRelevantEntries(query, limit = 3, similarityThreshold = 0.5) {
    console.log('🔍 Searching knowledge base for:', query);
    
    try {
        // First, we need to get the embedding for our search query
        console.log('Generating embedding for search query...');
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: query,
                model: "text-embedding-3-small"
            })
        });

        const { data: [{ embedding }] } = await embeddingResponse.json();
        console.log('✅ Embedding generated successfully');

        // Now search for similar entries in the knowledge base
        console.log('Searching for similar entries...');
        const { data: entries, error } = await supabase
            .rpc('match_entries', {
                query_embedding: embedding,
                similarity_threshold: similarityThreshold,
                match_count: limit
            });

        if (error) {
            console.error('❌ Error finding relevant entries:', error);
            return [];
        }

        console.log('📚 Found relevant entries:', entries.map(entry => ({
            title: entry.title,
            similarity: entry.similarity
        })));

        return entries;
    } catch (error) {
        console.error('❌ Error in findRelevantEntries:', error);
        return [];
    }
} 