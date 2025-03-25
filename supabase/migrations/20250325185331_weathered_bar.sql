/*
  # Add Categories to Events

  1. Changes
    - Add categories array field to events table
    - Add predefined categories enum type
    - Update existing events with default category

  2. Security
    - Maintain existing RLS policies
*/

-- Create event category enum type
CREATE TYPE event_category AS ENUM (
  'tech',
  'business',
  'arts',
  'sports',
  'music',
  'food',
  'education',
  'social',
  'charity',
  'other'
);

-- Add categories array to events table
ALTER TABLE events 
ADD COLUMN categories event_category[] NOT NULL DEFAULT ARRAY['other']::event_category[];

-- Add index for category search
CREATE INDEX events_categories_idx ON events USING GIN (categories);