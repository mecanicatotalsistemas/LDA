/*
  # Apply Analyses Table Migration

  This migration ensures the analyses table exists with all necessary structures.
  This is a re-application to ensure the table is properly created.

  ## Tables Created
  - `analyses` - Stores user analysis history with input data and results

  ## Security
  - RLS enabled with policies for authenticated users
  - Users can only access their own analyses
*/

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  analysis_type text NOT NULL CHECK (analysis_type IN ('degradation', 'distribution', 'calculator')),
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  results_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(analysis_type);

-- RLS Policies

-- SELECT: Users can view their own analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
CREATE POLICY "Users can view own analyses"
  ON analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can create new analyses
DROP POLICY IF EXISTS "Users can create own analyses" ON analyses;
CREATE POLICY "Users can create own analyses"
  ON analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own analyses
DROP POLICY IF EXISTS "Users can update own analyses" ON analyses;
CREATE POLICY "Users can update own analyses"
  ON analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own analyses
DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;
CREATE POLICY "Users can delete own analyses"
  ON analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
DROP TRIGGER IF EXISTS set_analyses_updated_at ON analyses;
CREATE TRIGGER set_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_analyses_updated_at();