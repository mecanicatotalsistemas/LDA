/*
  # Fix user status check with secure function

  1. Changes
    - Remove insecure anon policy
    - Create a secure function to check user status
    - Function bypasses RLS but only returns is_active field
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Only exposes minimal information (is_active boolean)
    - Can be called by anyone but only returns active status
*/

-- Remove the insecure policy
DROP POLICY IF EXISTS "Allow checking user active status for login" ON profiles;

-- Create a secure function to check if user is active
CREATE OR REPLACE FUNCTION check_user_active(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_active, false)
    FROM profiles
    WHERE id = user_id
  );
END;
$$;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION check_user_active(uuid) TO authenticated, anon;
