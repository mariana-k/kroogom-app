/*
  # Add Comments Feature

  1. New Tables
    - `event_comments`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `event_comments` table
    - Add policies for:
      - Anyone can read comments
      - Authenticated users can create comments
      - Users can update/delete their own comments
*/

-- Create event comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'event_comments_event_id_idx'
  ) THEN
    CREATE INDEX event_comments_event_id_idx ON event_comments(event_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'event_comments_user_id_idx'
  ) THEN
    CREATE INDEX event_comments_user_id_idx ON event_comments(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'event_comments_created_at_idx'
  ) THEN
    CREATE INDEX event_comments_created_at_idx ON event_comments(created_at DESC);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read comments" ON event_comments;
  DROP POLICY IF EXISTS "Authenticated users can create comments" ON event_comments;
  DROP POLICY IF EXISTS "Users can update their own comments" ON event_comments;
  DROP POLICY IF EXISTS "Users can delete their own comments" ON event_comments;
END $$;

-- Create policies
CREATE POLICY "Anyone can read comments"
  ON event_comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON event_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON event_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON event_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_event_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_event_comments_updated_at
      BEFORE UPDATE ON event_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;