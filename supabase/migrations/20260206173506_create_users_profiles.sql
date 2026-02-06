/*
  # Criar sistema de controle de usuários

  1. Nova Tabela
    - `profiles`
      - `id` (uuid, primary key, referência para auth.users)
      - `email` (text, email do usuário)
      - `full_name` (text, nome completo)
      - `role` (text, papel do usuário: admin, user, viewer)
      - `company` (text, empresa/organização)
      - `phone` (text, telefone de contato)
      - `avatar_url` (text, URL da foto de perfil)
      - `is_active` (boolean, status ativo/inativo)
      - `last_login` (timestamptz, último acesso)
      - `created_at` (timestamptz, data de criação)
      - `updated_at` (timestamptz, última atualização)

  2. Segurança
    - Habilitar RLS na tabela `profiles`
    - Políticas para usuários autenticados lerem seu próprio perfil
    - Políticas para usuários atualizarem seu próprio perfil
    - Políticas para admins visualizarem todos os perfis
    - Políticas para admins gerenciarem usuários

  3. Funções
    - Trigger para criar perfil automaticamente quando usuário se registra
    - Trigger para atualizar timestamp de updated_at
*/

-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  company text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean DEFAULT true,
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem inserir novos perfis
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem deletar perfis
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_updated'
  ) THEN
    CREATE TRIGGER on_profile_updated
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
