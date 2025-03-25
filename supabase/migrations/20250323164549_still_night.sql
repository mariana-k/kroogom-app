/*
  # Initial Schema Setup for Events Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, matches auth.users)
      - `username` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text)
      - `location` (text)
      - `bio` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `events`
      - `id` (uuid)
      - `title` (text)
      - `description` (text)
      - `location` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `image_url` (text)
      - `capacity` (int)
      - `organizer_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `event_attendees`
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references profiles)
      - `status` (enum: attending, waitlist, declined)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for event organizers
*/

-- Create custom types
CREATE TYPE attendance_status AS ENUM ('attending', 'waitlist', 'declined');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  location text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  image_url text,
  capacity int,
  organizer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT events_end_time_check CHECK (end_time > start_time),
  CONSTRAINT events_capacity_check CHECK (capacity > 0)
);

-- Create event attendees table
CREATE TABLE event_attendees (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'attending',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can update their events"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can delete their events"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id);

-- Event attendees policies
CREATE POLICY "Users can view event attendees"
  ON event_attendees FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage their attendance"
  ON event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their attendance status"
  ON event_attendees FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from events"
  ON event_attendees FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX events_start_time_idx ON events (start_time);
CREATE INDEX events_location_idx ON events (location);
CREATE INDEX event_attendees_status_idx ON event_attendees (status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();