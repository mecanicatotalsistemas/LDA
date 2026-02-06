/*
  # Create Analyses Storage System

  ## Overview
  This migration creates a system for storing user analyses, including all input data,
  calculated results, and metadata. Each analysis is associated with a specific user
  and includes complete information for reproducing the calculations.

  ## New Tables
  
  ### `analyses`
  Stores complete analysis records for each user
  - `id` (uuid, primary key) - Unique identifier for the analysis
  - `user_id` (uuid, foreign key) - References auth.users, the owner of the analysis
  - `title` (text) - User-defined name for the analysis
  - `analysis_type` (text) - Type: 'degradation', 'distribution', or 'calculator'
  - `input_data` (jsonb) - All input parameters (distances, costs, failures, etc)
  - `results_data` (jsonb) - All calculated results and metrics
  - `notes` (text, nullable) - Optional user notes about the analysis
  - `created_at` (timestamptz) - When the analysis was created
  - `updated_at` (timestamptz) - When the analysis was last modified

  ## Security
  - Enable RLS on `analyses` table
  - Users can only view their own analyses (SELECT)
  - Users can create new analyses (INSERT)
  - Users can update their own analyses (UPDATE)
  - Users can delete their own analyses (DELETE)

  ## Indexes
  - Index on user_id for fast lookup of user's analyses
  - Index on created_at for chronological sorting
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
CREATE POLICY "Users can view own analyses"
  ON analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can create new analyses
CREATE POLICY "Users can create own analyses"
  ON analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own analyses
CREATE POLICY "Users can update own analyses"
  ON analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own analyses
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
CREATE TRIGGER set_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_analyses_updated_at();