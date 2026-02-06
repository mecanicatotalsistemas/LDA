# Primeiros Passos - Sistema de Autenticação

## Início Rápido

### 1. Criar Primeiro Usuário Administrador

Como o sistema foi iniciado sem usuários, você precisará criar o primeiro administrador manualmente no banco de dados.

#### Opção A: Via Interface Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para seu projeto
3. Acesse "Authentication" > "Users"
4. Clique em "Add User"
5. Preencha:
   - Email: seu@email.com
   - Password: sua_senha_segura
   - Auto Confirm User: ✓ (marque)
6. Clique em "Create User"

7. Agora vá para "Table Editor" > "profiles"
8. Encontre o usuário criado
9. Edite o registro:
   - `role`: mude de "user" para "admin"
   - `full_name`: adicione seu nome
   - `is_active`: certifique-se que está "true"
10. Salve as alterações

#### Opção B: Via SQL Editor

1. No painel do Supabase, vá para "SQL Editor"
2. Execute o seguinte comando:

```sql
-- Primeiro, crie o usuário na tabela auth.users (se ainda não existir)
-- Isso normalmente é feito via interface ou API

-- Depois, atualize o perfil para admin
UPDATE profiles
SET
  role = 'admin',
  full_name = 'Seu Nome Completo',
  company = 'Sua Empresa',
  is_active = true
WHERE email = 'seu@email.com';
```

### 2. Fazer Primeiro Login

1. Acesse a aplicação
2. Será exibida a tela de login
3. Digite o email e senha do admin criado
4. Clique em "Entrar"
5. Você será redirecionado para o dashboard

### 3. Criar Novos Usuários

#### Via Interface (Recomendado):

**Opção 1: Cadastro Público**
1. Na tela de login, clique em "Cadastre-se aqui"
2. Preencha o formulário
3. Clique em "Criar Conta"
4. Novo usuário é criado com papel "user"
5. Como admin, você pode alterar o papel depois

**Opção 2: Como Administrador**
1. Faça login como admin
2. Vá para aba "Usuários"
3. Os usuários cadastrados aparecerão aqui
4. Você pode:
   - Alterar papel (Admin/User/Viewer)
   - Bloquear/Desbloquear
   - Excluir usuários

### 4. Testar Funcionalidades

#### Teste de Login:
1. Crie um usuário normal via cadastro
2. Faça logout do admin
3. Faça login com o novo usuário
4. Verifique que não tem acesso à aba "Usuários"

#### Teste de Bloqueio:
1. Faça login como admin
2. Vá para "Usuários"
3. Bloqueie um usuário de teste
4. Faça logout
5. Tente fazer login com usuário bloqueado
6. Deve exibir: "Usuário bloqueado. Contate o administrador."

#### Teste de Papéis:
1. Como admin, altere papel de um usuário para "viewer"
2. Faça login com esse usuário
3. Verifique acesso limitado

### 5. Configurar Variáveis de Ambiente

Certifique-se que o arquivo `.env` está configurado:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

**Onde encontrar essas chaves:**
1. Acesse seu projeto no Supabase
2. Vá para "Settings" > "API"
3. Copie:
   - Project URL → VITE_SUPABASE_URL
   - anon public → VITE_SUPABASE_ANON_KEY

### 6. Verificar Banco de Dados

Confirme que a migração foi aplicada corretamente:

1. Vá para "Table Editor" no Supabase
2. Verifique que existe a tabela "profiles"
3. Verifique as colunas:
   - id (uuid)
   - email (text)
   - full_name (text)
   - role (text)
   - company (text)
   - phone (text)
   - is_active (boolean)
   - last_login (timestamptz)
   - created_at (timestamptz)
   - updated_at (timestamptz)

### 7. Testar RLS (Row Level Security)

1. Vá para "Authentication" > "Policies"
2. Selecione tabela "profiles"
3. Verifique que existem políticas para:
   - Users can view own profile
   - Users can update own profile
   - Admins can view all profiles
   - Admins can insert profiles
   - Admins can update all profiles
   - Admins can delete profiles

## Problemas Comuns

### "Usuário bloqueado"
- Solução: Como admin, vá para "Usuários" e desbloqueie

### "Missing Supabase environment variables"
- Solução: Configure o arquivo .env com as chaves corretas

### Não consigo acessar "Usuários"
- Solução: Verifique que seu papel é "admin" no banco

### Perfil não é criado ao cadastrar
- Solução: Verifique que o trigger está ativo:

```sql
-- No SQL Editor do Supabase
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Se não existir, recrie:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Erro ao fazer login
- Verifique se o email está confirmado
- Verifique se o usuário está ativo (is_active = true)
- Verifique as credenciais

## Próximos Passos

Após configurar a autenticação:

1. **Convide sua equipe**: Compartilhe o link de cadastro
2. **Configure papéis**: Atribua papéis adequados a cada membro
3. **Teste permissões**: Verifique que cada papel tem acesso correto
4. **Configure email**: Para recuperação de senha (futuro)
5. **Monitore usuários**: Acompanhe último acesso e status

## Comandos Úteis

### Listar todos os admins:
```sql
SELECT * FROM profiles WHERE role = 'admin';
```

### Listar usuários bloqueados:
```sql
SELECT * FROM profiles WHERE is_active = false;
```

### Contar usuários por papel:
```sql
SELECT role, COUNT(*)
FROM profiles
GROUP BY role;
```

### Resetar senha de um usuário (SQL):
```sql
-- Nota: Melhor fazer via interface do Supabase
-- Auth > Users > três pontos > Send password recovery
```

### Ativar todos os usuários:
```sql
UPDATE profiles SET is_active = true;
```

## Dicas de Segurança

1. **Use senhas fortes** para contas de admin
2. **Limite número de admins** ao mínimo necessário
3. **Revise usuários** periodicamente
4. **Bloqueie contas inativas** por segurança
5. **Monitore tentativas de login** falhas
6. **Não compartilhe** credenciais de admin
7. **Use papéis apropriados** para cada usuário

## Suporte

Se encontrar problemas:

1. Verifique os logs do navegador (F12 > Console)
2. Verifique os logs do Supabase
3. Revise a documentação em AUTH_SYSTEM.md
4. Verifique DATABASE_USERS.md para estrutura do banco
