/*
  # Sistema Completo de Análises - Todas as Tabelas

  ## Visão Geral
  Esta migração cria um sistema completo para armazenar todas as análises
  realizadas pelos usuários na ferramenta LDA Tool, incluindo análises de
  distribuição, degradação, curvas de falha e configurações personalizadas.

  ## Tabelas Criadas/Atualizadas

  ### 1. `analyses` (já existe - garantir estrutura)
  Tabela principal para análises de distribuição de vida
  - Armazena dados de entrada e resultados
  - Tipos: 'distribution', 'degradation', 'calculator'

  ### 2. `degradation_analyses`
  Análises de degradação ao longo do tempo
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `title` (text) - Nome da análise
  - `equipment_name` (text) - Nome do equipamento
  - `failure_limit` (numeric) - Limite crítico de falha
  - `data_points` (jsonb) - Array de {time, value, status}
  - `models` (jsonb) - Modelos ajustados (linear, exponencial, etc)
  - `best_model` (text) - Melhor modelo identificado
  - `estimated_failure_time` (numeric) - Tempo estimado de falha
  - `r_squared` (numeric) - Qualidade do ajuste
  - `notes` (text) - Observações do usuário
  - `created_at`, `updated_at`

  ### 3. `failure_probability_curves`
  Curvas de probabilidade de falha configuradas pelo usuário
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `title` (text) - Nome da curva
  - `equipment_type` (text) - Tipo de equipamento
  - `curve_parameters` (jsonb) - Parâmetros da curva (lambda, beta, etc)
  - `time_range` (jsonb) - {min, max, unit}
  - `curve_data` (jsonb) - Pontos calculados da curva
  - `notes` (text)
  - `created_at`, `updated_at`

  ### 4. `equipment_configurations`
  Configurações de equipamentos para análises rápidas
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `equipment_name` (text) - Nome do equipamento
  - `equipment_type` (text) - Tipo (bomba, motor, válvula, etc)
  - `default_failure_limit` (numeric) - Limite padrão
  - `default_parameters` (jsonb) - Parâmetros padrão
  - `last_analysis_id` (uuid) - Última análise realizada
  - `created_at`, `updated_at`

  ## Segurança RLS
  Todas as tabelas têm RLS habilitado com políticas que permitem:
  - SELECT: Usuários visualizam apenas seus próprios dados
  - INSERT: Usuários criam apenas para si mesmos
  - UPDATE: Usuários atualizam apenas seus próprios dados
  - DELETE: Usuários deletam apenas seus próprios dados

  ## Índices
  Índices criados para otimizar consultas por:
  - user_id (todas as tabelas)
  - created_at (ordenação cronológica)
  - equipment_name (busca por equipamento)
  - analysis_type (filtros por tipo)
*/

-- ============================================
-- 1. GARANTIR TABELA ANALYSES (já deve existir)
-- ============================================

-- Adicionar campo equipment_name se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'equipment_name'
  ) THEN
    ALTER TABLE analyses ADD COLUMN equipment_name text DEFAULT '';
  END IF;
END $$;

-- ============================================
-- 2. TABELA DE ANÁLISES DE DEGRADAÇÃO
-- ============================================

CREATE TABLE IF NOT EXISTS degradation_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  equipment_name text NOT NULL DEFAULT '',
  failure_limit numeric NOT NULL,
  data_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  models jsonb NOT NULL DEFAULT '{}'::jsonb,
  best_model text,
  estimated_failure_time numeric,
  r_squared numeric,
  projected_data jsonb DEFAULT '[]'::jsonb,
  data_stats jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE degradation_analyses ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_degradation_analyses_user_id ON degradation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_degradation_analyses_created_at ON degradation_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_degradation_analyses_equipment ON degradation_analyses(equipment_name);

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own degradation analyses" ON degradation_analyses;
CREATE POLICY "Users can view own degradation analyses"
  ON degradation_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own degradation analyses" ON degradation_analyses;
CREATE POLICY "Users can create own degradation analyses"
  ON degradation_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own degradation analyses" ON degradation_analyses;
CREATE POLICY "Users can update own degradation analyses"
  ON degradation_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own degradation analyses" ON degradation_analyses;
CREATE POLICY "Users can delete own degradation analyses"
  ON degradation_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_degradation_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_degradation_analyses_updated_at ON degradation_analyses;
CREATE TRIGGER set_degradation_analyses_updated_at
  BEFORE UPDATE ON degradation_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_degradation_analyses_updated_at();

-- ============================================
-- 3. TABELA DE CURVAS DE PROBABILIDADE DE FALHA
-- ============================================

CREATE TABLE IF NOT EXISTS failure_probability_curves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  equipment_type text NOT NULL DEFAULT '',
  curve_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  time_range jsonb NOT NULL DEFAULT '{"min": 0, "max": 100, "unit": "hours"}'::jsonb,
  curve_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE failure_probability_curves ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_failure_curves_user_id ON failure_probability_curves(user_id);
CREATE INDEX IF NOT EXISTS idx_failure_curves_created_at ON failure_probability_curves(created_at DESC);

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own failure curves" ON failure_probability_curves;
CREATE POLICY "Users can view own failure curves"
  ON failure_probability_curves
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own failure curves" ON failure_probability_curves;
CREATE POLICY "Users can create own failure curves"
  ON failure_probability_curves
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own failure curves" ON failure_probability_curves;
CREATE POLICY "Users can update own failure curves"
  ON failure_probability_curves
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own failure curves" ON failure_probability_curves;
CREATE POLICY "Users can delete own failure curves"
  ON failure_probability_curves
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_failure_curves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_failure_curves_updated_at ON failure_probability_curves;
CREATE TRIGGER set_failure_curves_updated_at
  BEFORE UPDATE ON failure_probability_curves
  FOR EACH ROW
  EXECUTE FUNCTION update_failure_curves_updated_at();

-- ============================================
-- 4. TABELA DE CONFIGURAÇÕES DE EQUIPAMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS equipment_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  equipment_type text NOT NULL DEFAULT '',
  default_failure_limit numeric,
  default_parameters jsonb DEFAULT '{}'::jsonb,
  last_analysis_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, equipment_name)
);

-- Enable RLS
ALTER TABLE equipment_configurations ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_equipment_configs_user_id ON equipment_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_configs_name ON equipment_configurations(equipment_name);

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own equipment configs" ON equipment_configurations;
CREATE POLICY "Users can view own equipment configs"
  ON equipment_configurations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own equipment configs" ON equipment_configurations;
CREATE POLICY "Users can create own equipment configs"
  ON equipment_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own equipment configs" ON equipment_configurations;
CREATE POLICY "Users can update own equipment configs"
  ON equipment_configurations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own equipment configs" ON equipment_configurations;
CREATE POLICY "Users can delete own equipment configs"
  ON equipment_configurations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_equipment_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_equipment_configs_updated_at ON equipment_configurations;
CREATE TRIGGER set_equipment_configs_updated_at
  BEFORE UPDATE ON equipment_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_configs_updated_at();