/*
  # Fix profile creation policy

  1. Changes
    - Add a new policy specifically for profile creation during sign-up
    - Keep existing policies for other operations

  2. Security
    - Allow authenticated users to create their profile during sign-up
    - Maintain existing security for other operations
*/

-- Drop the existing insert policy if it exists
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
END$$;

-- Create a more permissive policy for profile creation
CREATE POLICY "Enable profile creation during sign-up"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);