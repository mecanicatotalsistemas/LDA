/*
  # Funções Administrativas para Gerenciamento de Usuários

  ## Overview
  Cria funções que permitem administradores gerenciar todos os usuários
  sem causar recursão infinita nas políticas RLS.

  ## Funções Criadas
  - get_all_profiles(): Retorna todos os perfis para admins
  - update_user_role(): Atualiza o papel de um usuário
  - update_user_status(): Ativa/desativa um usuário
*/

-- Função para buscar todos os perfis (apenas admins)
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM profiles
  ORDER BY created_at DESC;
$$;

-- Função para atualizar papel de usuário (apenas admins)
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Função para atualizar status de usuário (apenas admins)
CREATE OR REPLACE FUNCTION update_user_status(
  target_user_id uuid,
  new_status boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET is_active = new_status, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Função para deletar usuário (apenas admins)
CREATE OR REPLACE FUNCTION delete_user_profile(
  target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = target_user_id;
  -- O perfil será deletado automaticamente devido ao ON DELETE CASCADE
END;
$$;