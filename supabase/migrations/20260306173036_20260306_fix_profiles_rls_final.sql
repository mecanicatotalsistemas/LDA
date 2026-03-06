/*
  # Correção Final das Políticas RLS do Profiles

  ## Problema
  As políticas de admin estão causando recursão infinita porque consultam
  a própria tabela profiles dentro da política.

  ## Solução
  Remover as políticas de admin problemáticas e manter apenas as políticas
  simples de usuários. Admins podem usar funções específicas fora do RLS.
*/

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Criar políticas simples sem recursão
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política INSERT para novos usuários
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);