/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing profiles policies
    - Create new policies with correct permissions for profile creation
    - Ensure authenticated users can create their own profile
    - Fix type casting issues in policy checks

  2. Security
    - Maintain RLS enabled on profiles table
    - Allow public read access to all profiles
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

-- Recreate profiles policies with correct permissions
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