// scripts/generate-embeddings.js

import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

// Initialize OpenAI and Supabase clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function generateEmbeddings() {
  try {
    // Fetch all entries that don't have embeddings yet
    const { data: entries, error } = await supabase
      .from('knowledge_base')
      .select('id, embedding_text')
      .is('embedding', null)

    if (error) throw error

    console.log(`Generating embeddings for ${entries.length} entries...`)

    // Process entries in batches to avoid rate limits
    for (const entry of entries) {
      try {
        // Generate embedding using OpenAI
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: entry.embedding_text,
          encoding_format: "float"
        })

        // Update the entry with the embedding
        const { error: updateError } = await supabase
          .from('knowledge_base')
          .update({
            embedding: response.data[0].embedding,
            updated_at: new Date()
          })
          .eq('id', entry.id)

        if (updateError) throw updateError

        console.log(`Generated embedding for entry ${entry.id}`)
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing entry ${entry.id}:`, error)
      }
    }

    console.log('Finished generating embeddings!')
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
generateEmbeddings()