/*
  # Fix Profiles RLS Policies

  1. Changes
    - Add policy to allow authenticated users to insert their own profile
    - Keep existing policies for select and update

  2. Security
    - Users can only create their own profile (id must match auth.uid())
    - Maintains existing RLS policies for other operations
*/

-- Allow users to create their own profile
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);