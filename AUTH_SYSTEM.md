# Sistema de Autenticação e Gerenciamento de Usuários

## Visão Geral

Sistema completo de autenticação integrado com Supabase, incluindo cadastro, login e gerenciamento avançado de usuários com controle de acesso baseado em papéis (RBAC).

## Funcionalidades Implementadas

### 1. Autenticação

#### Login (src/components/Login.tsx)
- Interface moderna e responsiva
- Validação de campos obrigatórios
- Verificação de usuário bloqueado
- Mensagens de erro claras
- Redirecionamento automático após login

#### Cadastro (src/components/Register.tsx)
- Formulário completo com validação
- Campos:
  - Nome completo (obrigatório)
  - Email (obrigatório)
  - Empresa (opcional)
  - Telefone (opcional)
  - Senha (mínimo 6 caracteres)
  - Confirmação de senha
- Validação em tempo real
- Mensagem de sucesso e redirecionamento automático

### 2. Gerenciamento de Usuários (src/components/UserManagement.tsx)

#### Funcionalidades para Administradores:

**Visualização de Usuários:**
- Lista em cards com informações completas
- Busca por nome, email ou empresa
- Filtro por papel (Admin/User/Viewer)
- Indicadores visuais de status (ativo/bloqueado)

**Bloqueio/Desbloqueio:**
- Botão para bloquear/desbloquear usuários
- Proteção: admin não pode bloquear própria conta
- Usuários bloqueados não conseguem fazer login
- Atualização em tempo real

**Alteração de Papéis:**
- Dropdown para mudar papel do usuário
- Opções: Admin, User, Viewer
- Proteção: admin não pode alterar próprio papel
- Atualização imediata no banco

**Exclusão de Usuários:**
- Botão para excluir usuários
- Confirmação antes de excluir
- Proteção: admin não pode excluir própria conta
- Remoção permanente do banco

**Estatísticas:**
- Total de usuários
- Número de administradores
- Usuários ativos
- Usuários bloqueados

### 3. Controle de Acesso

#### Papéis de Usuário:

**Admin:**
- Acesso total ao sistema
- Pode gerenciar todos os usuários
- Pode bloquear/desbloquear contas
- Pode alterar papéis
- Pode excluir usuários

**User:**
- Acesso completo às funcionalidades de análise
- Pode ver apenas seu próprio perfil
- Não pode acessar gerenciamento de usuários

**Viewer:**
- Acesso somente leitura
- Não pode modificar dados
- Ideal para stakeholders

### 4. Segurança

#### Proteções Implementadas:

1. **Row Level Security (RLS)** habilitado no banco
2. **Validação de bloqueio** no login
3. **Tokens JWT** para autenticação
4. **Proteção contra auto-bloqueio** de admins
5. **Confirmação antes de exclusão** de usuários
6. **Senhas criptografadas** pelo Supabase Auth

## Estrutura de Arquivos

```
src/
├── lib/
│   └── supabase.ts                    # Cliente Supabase configurado
├── contexts/
│   └── AuthContext.tsx                # Contexto de autenticação global
├── components/
│   ├── Login.tsx                      # Página de login
│   ├── Register.tsx                   # Página de cadastro
│   └── UserManagement.tsx             # Gerenciamento de usuários
└── App.tsx                            # Integração da autenticação
```

## Fluxo de Autenticação

### Primeiro Acesso:

1. Usuário acessa a aplicação
2. É redirecionado para tela de login
3. Clica em "Cadastre-se aqui"
4. Preenche formulário de cadastro
5. Conta é criada como "user" (papel padrão)
6. Redirecionado para login
7. Faz login e acessa o sistema

### Login Subsequente:

1. Usuário acessa a aplicação
2. Preenche email e senha
3. Sistema verifica se está bloqueado
4. Se ativo, autentica e redireciona
5. Se bloqueado, exibe mensagem de erro

### Sessão Ativa:

1. Aplicação verifica sessão automaticamente
2. Carrega perfil do usuário
3. Atualiza último acesso
4. Libera acesso ao sistema

### Logout:

1. Usuário clica em "Sair"
2. Sessão é encerrada
3. Dados são limpos
4. Redirecionado para login

## Gerenciamento de Usuários

### Como Administrador:

#### Para Bloquear um Usuário:
1. Acesse a aba "Usuários"
2. Localize o usuário
3. Clique em "Bloquear"
4. Usuário não poderá mais fazer login

#### Para Desbloquear:
1. Encontre o usuário bloqueado (card vermelho)
2. Clique em "Desbloquear"
3. Usuário poderá fazer login novamente

#### Para Alterar Papel:
1. Use o dropdown "Papel" no card do usuário
2. Selecione novo papel
3. Alteração é imediata

#### Para Excluir Usuário:
1. Clique no ícone de lixeira
2. Confirme a exclusão
3. Usuário é removido permanentemente

## Banco de Dados

### Tabela: profiles

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text DEFAULT 'user',
  company text DEFAULT '',
  phone text DEFAULT '',
  is_active boolean DEFAULT true,
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Políticas RLS:

- Usuários podem ver apenas seu próprio perfil
- Admins podem ver todos os perfis
- Admins podem inserir, atualizar e deletar qualquer perfil
- Usuários podem atualizar apenas seu próprio perfil

## Variáveis de Ambiente

Certifique-se de configurar no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## Como Usar

### Para Desenvolvedores:

#### Usar o contexto de autenticação em qualquer componente:

```typescript
import { useAuth } from '../contexts/AuthContext';

function MeuComponente() {
  const { user, profile, isAdmin, signOut } = useAuth();

  if (!user) {
    return <p>Não autenticado</p>;
  }

  return (
    <div>
      <p>Olá, {profile?.full_name}</p>
      {isAdmin && <p>Você é administrador!</p>}
      <button onClick={signOut}>Sair</button>
    </div>
  );
}
```

#### Verificar papel do usuário:

```typescript
if (profile?.role === 'admin') {
  // Exibir opções de admin
}

if (isAdmin) {
  // Forma simplificada
}
```

#### Realizar operações no banco:

```typescript
import { supabase } from '../lib/supabase';

// Buscar dados
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('is_active', true);

// Atualizar dados
const { error } = await supabase
  .from('profiles')
  .update({ full_name: 'Novo Nome' })
  .eq('id', userId);
```

## Melhorias Futuras

### Sugestões de Implementação:

1. **Recuperação de senha** via email
2. **Autenticação de dois fatores (2FA)**
3. **Upload de avatar** do usuário
4. **Logs de auditoria** de ações administrativas
5. **Permissões granulares** por funcionalidade
6. **Notificações por email** ao criar/bloquear conta
7. **Sessões múltiplas** gerenciáveis
8. **Exportação de relatórios** de usuários
9. **Filtros avançados** e ordenação
10. **Paginação** para muitos usuários

## Suporte

Para problemas relacionados à autenticação:

1. Verifique se as variáveis de ambiente estão configuradas
2. Confirme que o banco de dados está acessível
3. Verifique os logs do console do navegador
4. Revise as políticas RLS no Supabase
5. Confirme que o trigger de criação de perfil está ativo

## Segurança - Boas Práticas

1. **Nunca exponha** a service role key no frontend
2. **Sempre use** RLS para proteger dados
3. **Valide entrada** do usuário tanto no frontend quanto backend
4. **Use HTTPS** em produção
5. **Implemente rate limiting** para prevenir ataques
6. **Monitore** tentativas de login falhas
7. **Revogue sessões** antigas periodicamente
8. **Atualize dependências** regularmente
