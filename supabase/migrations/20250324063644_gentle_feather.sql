/*
  # Fix Profile Creation During Sign Up

  1. Changes
    - Drop existing profile policies
    - Create new policy to allow profile creation during sign-up
    - Keep other policies unchanged

  2. Security
    - Allow profile creation during sign-up
    - Maintain existing security for other operations
*/

-- Drop existing profiles policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Enable profile creation during sign-up" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
END$$;

-- Create new policies with correct permissions
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow profile creation without auth check
CREATE POLICY "Enable profile creation during sign-up"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);