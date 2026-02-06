-- ============================================================
-- CRIAR USUÁRIO ADMINISTRADOR
-- Email: augusto@mecanicatotalbrasil.com.br
-- ============================================================

-- INSTRUÇÕES:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard
-- 2. Vá para seu projeto
-- 3. Clique em "SQL Editor" no menu lateral
-- 4. Cole este script e execute

-- ============================================================
-- PASSO 1: Verificar se o usuário já existe
-- ============================================================

SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'augusto@mecanicatotalbrasil.com.br';

-- Se retornou algum resultado, o usuário já existe.
-- Anote o ID e pule para o PASSO 3.
-- Se não retornou nada, continue para o PASSO 2.

-- ============================================================
-- PASSO 2: Criar o usuário no Supabase Auth
-- ============================================================

-- IMPORTANTE: Não é possível criar usuários com senha via SQL
-- por questões de segurança. Use uma destas opções:

-- OPÇÃO A - Via Interface do Supabase (RECOMENDADO):
-- 1. Vá para "Authentication" > "Users"
-- 2. Clique em "Add User" (ou "Invite User")
-- 3. Preencha:
--    - Email: augusto@mecanicatotalbrasil.com.br
--    - Password: crie uma senha temporária forte (ex: Admin123!Temp)
--    - Auto Confirm User: ✓ (marque esta opção)
-- 4. Clique em "Create User" ou "Send Invitation"
-- 5. Anote o ID do usuário criado

-- OPÇÃO B - Enviar link de cadastro:
-- Compartilhe o link da aplicação para que Augusto se cadastre:
-- URL: [sua-url-da-aplicacao]
-- Ele deverá clicar em "Cadastre-se aqui" e criar sua conta

-- ============================================================
-- PASSO 3: Atualizar perfil para Administrador
-- ============================================================

-- Execute este comando DEPOIS de criar o usuário:
UPDATE profiles
SET
  role = 'admin',
  full_name = 'Augusto',
  company = 'Mecânica Total Brasil',
  is_active = true,
  updated_at = now()
WHERE email = 'augusto@mecanicatotalbrasil.com.br';

-- Verificar se a atualização funcionou:
SELECT
  email,
  full_name,
  role,
  company,
  is_active,
  created_at
FROM profiles
WHERE email = 'augusto@mecanicatotalbrasil.com.br';

-- O resultado deve mostrar:
-- - role: admin
-- - full_name: Augusto
-- - company: Mecânica Total Brasil
-- - is_active: true

-- ============================================================
-- PASSO 4: (OPCIONAL) Se o perfil não existir ainda
-- ============================================================

-- Se o comando UPDATE acima não atualizou nenhuma linha,
-- significa que o perfil ainda não foi criado.
-- Isso pode acontecer se o trigger não funcionou.
-- Neste caso, crie o perfil manualmente:

-- Primeiro, pegue o ID do usuário:
SELECT id FROM auth.users WHERE email = 'augusto@mecanicatotalbrasil.com.br';

-- Depois, insira o perfil (substitua 'USER_ID_AQUI' pelo ID obtido):
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  company,
  phone,
  is_active,
  last_login,
  created_at,
  updated_at
) VALUES (
  'USER_ID_AQUI'::uuid,  -- Substitua pelo ID real
  'augusto@mecanicatotalbrasil.com.br',
  'Augusto',
  'admin',
  'Mecânica Total Brasil',
  '',
  true,
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Augusto',
  company = 'Mecânica Total Brasil',
  is_active = true,
  updated_at = now();

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

-- Execute esta query para confirmar que tudo está correto:
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.company,
  p.is_active,
  au.created_at as auth_created_at,
  p.last_login
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.email = 'augusto@mecanicatotalbrasil.com.br';

-- ✓ Deve retornar 1 linha
-- ✓ role deve ser 'admin'
-- ✓ is_active deve ser true
-- ✓ auth_created_at não deve ser NULL

-- ============================================================
-- INFORMAÇÕES DE LOGIN
-- ============================================================

-- Após completar os passos acima, Augusto poderá fazer login com:
-- Email: augusto@mecanicatotalbrasil.com.br
-- Senha: (a senha definida no PASSO 2)

-- Como administrador, Augusto terá acesso a:
-- ✓ Todas as funcionalidades de análise
-- ✓ Gerenciamento completo de usuários
-- ✓ Bloquear/desbloquear usuários
-- ✓ Alterar papéis de usuários
-- ✓ Excluir usuários
-- ✓ Ver estatísticas de usuários

-- ============================================================
-- ALTERAÇÃO DE SENHA (OPCIONAL)
-- ============================================================

-- Se quiser enviar um email de redefinição de senha:
-- 1. Vá para "Authentication" > "Users" no painel do Supabase
-- 2. Encontre o usuário augusto@mecanicatotalbrasil.com.br
-- 3. Clique nos três pontos (...)
-- 4. Selecione "Send password recovery"
-- 5. Um email será enviado para Augusto redefinir a senha

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
