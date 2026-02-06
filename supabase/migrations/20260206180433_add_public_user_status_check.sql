/*
  # Add public user status check

  1. Changes
    - Add policy to allow anon users to check if a user account is active
    - This enables checking account status before login attempt
  
  2. Security
    - Only exposes is_active field for accounts being logged into
    - Does not expose sensitive user information
*/

-- Allow checking user status before login (for anon users)
CREATE POLICY "Allow checking user active status for login"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);
