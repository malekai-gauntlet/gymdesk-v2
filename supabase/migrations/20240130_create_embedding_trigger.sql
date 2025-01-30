-- Create the net extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "net";

-- Create a function to call our Edge Function
create or replace function handle_embedding_generation()
returns trigger as $$
declare
  response json;
begin
  -- Make request to edge function
  select net.http_post(
    url := 'https://' || current_setting('custom.project_ref') || '.functions.supabase.co/generate-embeddings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('custom.service_role_key')
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  ) into response;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger generate_embedding_trigger
  after insert or update of embedding_text
  on knowledge_base
  for each row
  when (NEW.embedding is null and NEW.embedding_text is not null)
  execute function handle_embedding_generation(); 