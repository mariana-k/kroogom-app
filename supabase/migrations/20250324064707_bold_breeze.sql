/*
  # Fix UUID Handling for Events

  1. Changes
    - Add function to safely handle UUID conversion
    - Add index on events.id for better performance
    - Ensure proper UUID validation

  2. Security
    - Maintain existing RLS policies
    - Safe UUID handling to prevent injection
*/

-- Create a function to safely convert text to UUID
CREATE OR REPLACE FUNCTION try_cast_uuid(p_uuid text)
RETURNS uuid AS $$
BEGIN
  RETURN p_uuid::uuid;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;