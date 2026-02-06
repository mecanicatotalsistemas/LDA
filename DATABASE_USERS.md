# Sistema de Controle de Usuários

## Visão Geral

O sistema de controle de usuários foi implementado usando Supabase com Row Level Security (RLS) habilitado para garantir máxima segurança.

## Estrutura do Banco de Dados

### Tabela: `profiles`

Armazena informações detalhadas dos perfis de usuários.

#### Colunas:

| Campo | Tipo | Descrição | Padrão |
|-------|------|-----------|--------|
| `id` | uuid | ID único do usuário (referência para auth.users) | - |
| `email` | text | Email do usuário (único) | - |
| `full_name` | text | Nome completo do usuário | '' |
| `role` | text | Papel do usuário: admin, user, viewer | 'user' |
| `company` | text | Empresa/organização do usuário | '' |
| `phone` | text | Telefone de contato | '' |
| `avatar_url` | text | URL da foto de perfil | '' |
| `is_active` | boolean | Status ativo/inativo | true |
| `last_login` | timestamptz | Data e hora do último acesso | now() |
| `created_at` | timestamptz | Data de criação do registro | now() |
| `updated_at` | timestamptz | Data da última atualização | now() |

#### Restrições:

- `id` é chave primária e referência para `auth.users.id`
- `email` deve ser único
- `role` deve ser um dos valores: 'admin', 'user', 'viewer'
- Deleção em cascata quando usuário é removido do `auth.users`

## Segurança (Row Level Security)

O sistema implementa políticas de segurança rigorosas:

### Políticas para Usuários Comuns:

1. **Visualizar próprio perfil**: Usuários autenticados podem ver apenas seu próprio perfil
2. **Atualizar próprio perfil**: Usuários podem atualizar apenas seu próprio perfil

### Políticas para Administradores:

1. **Visualizar todos os perfis**: Admins podem ver todos os perfis de usuários
2. **Inserir novos perfis**: Admins podem criar novos usuários
3. **Atualizar qualquer perfil**: Admins podem modificar qualquer perfil
4. **Deletar perfis**: Admins podem remover usuários

## Funções e Triggers

### 1. `handle_new_user()`

Cria automaticamente um perfil quando um novo usuário se registra no sistema.

**Trigger**: `on_auth_user_created`
- Executa após inserção em `auth.users`
- Cria registro correspondente em `profiles`

### 2. `handle_updated_at()`

Atualiza automaticamente o campo `updated_at` quando um perfil é modificado.

**Trigger**: `on_profile_updated`
- Executa antes de atualização em `profiles`
- Define `updated_at` como hora atual

## Índices

Para otimizar performance, foram criados índices em:

- `email` - Busca rápida por email
- `role` - Filtragem por papel
- `is_active` - Filtragem por status
- `created_at` - Ordenação por data de criação

## Papéis de Usuário

### Admin
- Acesso total ao sistema
- Pode gerenciar todos os usuários
- Pode modificar configurações globais

### User
- Acesso padrão ao sistema
- Pode visualizar e editar apenas seu próprio perfil
- Pode usar todas as funcionalidades de análise

### Viewer
- Acesso somente leitura
- Pode visualizar dados mas não modificar
- Ideal para stakeholders e observadores

## Como Usar

### Consultar usuários (JavaScript):

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Buscar perfil do usuário atual
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .maybeSingle();

// Admin: Buscar todos os usuários
const { data: allProfiles } = await supabase
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false });
```

### Atualizar perfil:

```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({
    full_name: 'Novo Nome',
    phone: '(11) 99999-9999',
    updated_at: new Date().toISOString()
  })
  .eq('id', userId);
```

### Verificar se usuário é admin:

```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .maybeSingle();

const isAdmin = profile?.role === 'admin';
```

## Interface de Gerenciamento

A aplicação inclui uma interface completa de gerenciamento de usuários acessível pela aba "Usuários" que permite:

- Visualizar todos os usuários cadastrados
- Buscar por nome, email ou empresa
- Filtrar por papel (admin, user, viewer)
- Visualizar estatísticas de usuários
- Identificar status ativo/inativo
- Ver último acesso de cada usuário
- Editar informações de usuários
- Remover usuários do sistema

## Próximos Passos

Para integração completa com autenticação:

1. Implementar fluxo de registro de usuários
2. Adicionar autenticação com email/senha
3. Criar telas de login e recuperação de senha
4. Implementar gerenciamento de sessões
5. Adicionar upload de avatar
6. Criar logs de auditoria de ações

## Segurança

- Todas as operações são protegidas por RLS
- Senhas nunca são armazenadas em texto plano
- Tokens JWT são usados para autenticação
- Políticas garantem isolamento de dados
- Triggers automatizam processos críticos
