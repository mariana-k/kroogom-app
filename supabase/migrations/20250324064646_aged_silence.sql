/*
  # Fix Event Relationships and Queries

  1. Changes
    - Add explicit foreign key references for event relationships
    - Add indexes for better query performance
    - Ensure proper relationship constraints

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Add explicit foreign key reference for organizer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'events_organizer_id_fkey'
  ) THEN
    ALTER TABLE events
    DROP CONSTRAINT events_organizer_id_fkey;
  END IF;
END$$;

ALTER TABLE events
ADD CONSTRAINT events_organizer_id_fkey
  FOREIGN KEY (organizer_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS events_organizer_id_idx ON events (organizer_id);
CREATE INDEX IF NOT EXISTS event_attendees_event_user_idx ON event_attendees (event_id, user_id);