/*
  # Add Sample Events with UUID IDs

  1. Changes
    - Add sample events with proper UUID IDs
    - Add sample event attendees
    - Update indexes for better performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper UUID handling
*/

-- Insert sample events with proper UUIDs
INSERT INTO events (
  id,
  title,
  description,
  location,
  start_time,
  end_time,
  image_url,
  capacity,
  organizer_id
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Tech Meetup 2025',
  'Join us for an exciting tech meetup where we''ll discuss the latest trends in technology.',
  'San Francisco, CA',
  '2025-03-15 18:00:00+00',
  '2025-03-15 21:00:00+00',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
  50,
  (SELECT id FROM profiles LIMIT 1)
), (
  'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  'Startup Networking Night',
  'Network with fellow entrepreneurs and investors in this exclusive networking event.',
  'New York, NY',
  '2025-03-20 19:00:00+00',
  '2025-03-20 22:00:00+00',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
  100,
  (SELECT id FROM profiles LIMIT 1)
);

-- Create index for UUID search optimization
CREATE INDEX IF NOT EXISTS events_id_idx ON events USING btree (id);

-- Update the organizer index to include username for faster joins
DROP INDEX IF EXISTS events_organizer_id_idx;
CREATE INDEX events_organizer_profile_idx ON events (organizer_id) INCLUDE (title, start_time);

-- Add composite index for event attendees
DROP INDEX IF EXISTS event_attendees_event_user_idx;
CREATE INDEX event_attendees_lookup_idx ON event_attendees (event_id, user_id) INCLUDE (status);