/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing profiles policies
    - Recreate policies with simplified conditions
    - Remove explicit type casting

  2. Security
    - Maintain RLS enabled on profiles table
    - Allow public read access
    - Allow authenticated users to create their own profile
    - Allow users to update their own profile
*/

-- Drop existing profiles policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
END$$;

-- Recreate profiles policies with simplified conditions
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);