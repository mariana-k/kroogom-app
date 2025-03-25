/*
  # Add notifications functionality

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (notification_type enum)
      - `title` (text)
      - `message` (text)
      - `event_id` (uuid, references events)
      - `sender_id` (uuid, references profiles, nullable)
      - `read` (boolean)
      - `created_at` (timestamp with time zone)

  2. Enums
    - `notification_type`
      - event_invite
      - event_update
      - event_reminder
      - event_cancelled
      - new_attendee

  3. Security
    - Enable RLS on notifications table
    - Add policies for notification access
*/

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'event_invite',
  'event_update',
  'event_reminder',
  'event_cancelled',
  'new_attendee'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to create event update notifications
CREATE OR REPLACE FUNCTION notify_event_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications if relevant fields changed
  IF (
    OLD.title != NEW.title OR
    OLD.description != NEW.description OR
    OLD.location != NEW.location OR
    OLD.start_time != NEW.start_time OR
    OLD.end_time != NEW.end_time
  ) THEN
    -- Insert notifications for all attendees
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      event_id,
      sender_id
    )
    SELECT 
      ea.user_id,
      'event_update'::notification_type,
      'Event Update',
      CASE
        WHEN OLD.location != NEW.location THEN 'The venue has been updated'
        WHEN OLD.start_time != NEW.start_time THEN 'The event time has changed'
        ELSE 'Event details have been updated'
      END,
      NEW.id,
      NEW.organizer_id
    FROM event_attendees ea
    WHERE ea.event_id = NEW.id
    AND ea.status = 'attending'
    AND ea.user_id != NEW.organizer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event updates
CREATE TRIGGER event_update_notification
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_update();

-- Create function to create new attendee notifications
CREATE OR REPLACE FUNCTION notify_new_attendee()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for attending status
  IF NEW.status = 'attending' THEN
    -- Get the event organizer
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      event_id,
      sender_id
    )
    SELECT 
      e.organizer_id,
      'new_attendee'::notification_type,
      'New Attendee',
      (SELECT username || ' joined your event' FROM profiles WHERE id = NEW.user_id),
      NEW.event_id,
      NEW.user_id
    FROM events e
    WHERE e.id = NEW.event_id
    AND e.organizer_id != NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new attendees
CREATE TRIGGER new_attendee_notification
  AFTER INSERT ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_attendee();

-- Create function to create event cancellation notifications
CREATE OR REPLACE FUNCTION notify_event_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all attendees
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    event_id,
    sender_id
  )
  SELECT 
    ea.user_id,
    'event_cancelled'::notification_type,
    'Event Cancelled',
    OLD.title || ' has been cancelled',
    OLD.id,
    OLD.organizer_id
  FROM event_attendees ea
  WHERE ea.event_id = OLD.id
  AND ea.status = 'attending'
  AND ea.user_id != OLD.organizer_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event cancellations
CREATE TRIGGER event_cancelled_notification
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_cancelled();