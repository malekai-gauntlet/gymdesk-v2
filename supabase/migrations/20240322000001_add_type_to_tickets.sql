-- Add type column to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS type text;

-- Update existing tickets to have a default type
UPDATE tickets SET type = 'standard' WHERE type IS NULL;

-- Add comment to the column
COMMENT ON COLUMN tickets.type IS 'The type of ticket (e.g., standard, ai)';

-- Create an index on the type column for better query performance
CREATE INDEX IF NOT EXISTS tickets_type_idx ON tickets(type); 