/*
  # Fix Profile Creation RLS Policies

  1. Changes
    - Drop existing profile policies
    - Create new policies that allow:
      - Public read access to all profiles
      - Profile creation during sign-up
      - Profile updates by owners
    
  2. Security
    - Maintains RLS protection while allowing necessary operations
    - Ensures users can only update their own profiles
    - Allows initial profile creation during sign-up
*/

-- Drop existing profiles policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Enable profile creation during sign-up" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
END$$;

-- Create new policies with correct permissions
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Enable profile creation during sign-up"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);