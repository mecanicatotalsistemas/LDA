/*
  # Funções Administrativas para Novo Banco

  ## Funções Criadas
  - get_all_profiles(): Retorna todos os perfis para admins
  - update_user_role(): Atualiza papel de usuário
  - update_user_status(): Ativa/desativa usuário
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

-- Função para atualizar papel de usuário
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

-- Função para atualizar status de usuário
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