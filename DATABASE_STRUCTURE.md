# Estrutura do Banco de Dados - LDA Tool

## Visão Geral

Sistema completo de persistência de dados para armazenar todas as análises e configurações dos usuários.

## Tabelas Criadas

### 1. `profiles`
Tabela de perfis de usuários (já existente)
- Armazena informações do usuário: nome, email, empresa, telefone
- Roles: admin, user, viewer
- Status ativo/inativo

### 2. `analyses`
Tabela principal para análises de distribuição de vida
- **Campos principais:**
  - `id`: UUID único
  - `user_id`: Referência ao usuário
  - `title`: Nome da análise
  - `analysis_type`: Tipo (distribution, degradation, calculator)
  - `equipment_name`: Nome do equipamento
  - `input_data`: Dados de entrada (JSON)
  - `results_data`: Resultados calculados (JSON)
  - `notes`: Observações do usuário
  - `created_at`, `updated_at`: Timestamps

### 3. `degradation_analyses`
Análises específicas de degradação
- **Campos principais:**
  - `id`: UUID único
  - `user_id`: Referência ao usuário
  - `title`: Nome da análise
  - `equipment_name`: Nome do equipamento
  - `failure_limit`: Limite crítico de falha
  - `data_points`: Array de medições {time, value, status}
  - `models`: Modelos ajustados (linear, exponencial, logarítmico, potência)
  - `best_model`: Melhor modelo identificado
  - `estimated_failure_time`: Tempo estimado de falha
  - `r_squared`: Qualidade do ajuste (R²)
  - `projected_data`: Dados projetados
  - `data_stats`: Estatísticas dos dados
  - `notes`: Observações
  - `created_at`, `updated_at`: Timestamps

### 4. `failure_probability_curves`
Curvas de probabilidade de falha personalizadas
- **Campos principais:**
  - `id`: UUID único
  - `user_id`: Referência ao usuário
  - `title`: Nome da curva
  - `equipment_type`: Tipo de equipamento
  - `curve_parameters`: Parâmetros da curva (lambda, beta, etc)
  - `time_range`: Intervalo de tempo {min, max, unit}
  - `curve_data`: Pontos calculados da curva
  - `notes`: Observações
  - `created_at`, `updated_at`: Timestamps

### 5. `equipment_configurations`
Configurações de equipamentos para análises rápidas
- **Campos principais:**
  - `id`: UUID único
  - `user_id`: Referência ao usuário
  - `equipment_name`: Nome do equipamento (único por usuário)
  - `equipment_type`: Tipo do equipamento
  - `default_failure_limit`: Limite padrão de falha
  - `default_parameters`: Parâmetros padrão (JSON)
  - `last_analysis_id`: Última análise realizada
  - `created_at`, `updated_at`: Timestamps

## Segurança (RLS - Row Level Security)

Todas as tabelas possuem RLS habilitado com políticas que garantem:

### Políticas de Segurança
- **SELECT**: Usuários visualizam apenas seus próprios dados
- **INSERT**: Usuários criam apenas para si mesmos
- **UPDATE**: Usuários atualizam apenas seus próprios dados
- **DELETE**: Usuários deletam apenas seus próprios dados

### Exemplo de Política RLS
```sql
CREATE POLICY "Users can view own analyses"
  ON analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

## Índices para Performance

### analyses
- `idx_analyses_user_id`: Busca rápida por usuário
- `idx_analyses_created_at`: Ordenação cronológica
- `idx_analyses_type`: Filtro por tipo de análise

### degradation_analyses
- `idx_degradation_analyses_user_id`: Busca por usuário
- `idx_degradation_analyses_created_at`: Ordenação cronológica
- `idx_degradation_analyses_equipment`: Busca por equipamento

### failure_probability_curves
- `idx_failure_curves_user_id`: Busca por usuário
- `idx_failure_curves_created_at`: Ordenação cronológica

### equipment_configurations
- `idx_equipment_configs_user_id`: Busca por usuário
- `idx_equipment_configs_name`: Busca por nome de equipamento
- Constraint UNIQUE em (user_id, equipment_name)

## Triggers Automáticos

Todas as tabelas possuem triggers para atualização automática do campo `updated_at`:

```sql
CREATE TRIGGER set_[table]_updated_at
  BEFORE UPDATE ON [table]
  FOR EACH ROW
  EXECUTE FUNCTION update_[table]_updated_at();
```

## Funcionalidades Implementadas

### 1. Salvamento Automático
- Análises de distribuição podem ser salvas com um clique
- Análises de degradação possuem botão "Salvar Análise"
- Título gerado automaticamente com nome do equipamento e data

### 2. Histórico Completo
- Aba "Histórico" como primeira aba da aplicação
- Visualização unificada de todos os tipos de análises
- Filtros por tipo: Todas, Distribuição, Degradação
- Contadores de análises por tipo

### 3. Gerenciamento de Análises
- Carregar análises anteriores
- Excluir análises não desejadas
- Visualização de metadados (data, equipamento, tipo)
- Ordenação cronológica (mais recentes primeiro)

### 4. Dados Persistentes
- Todas as entradas de dados são salvas
- Resultados completos armazenados
- Parâmetros de cálculo preservados
- Possibilidade de adicionar notas

## Fluxo de Uso

1. **Login do Usuário**
   - Sistema autentica via Supabase Auth
   - Perfil carregado da tabela `profiles`

2. **Visualização do Histórico**
   - Ao fazer login, usuário vê aba "Histórico"
   - Lista todas as análises salvas anteriormente
   - Filtros disponíveis por tipo

3. **Realização de Nova Análise**
   - Usuário realiza análise (distribuição ou degradação)
   - Botão "Salvar Análise" aparece após cálculos
   - Dados salvos na tabela apropriada

4. **Recuperação de Análise**
   - Usuário clica em "Carregar análise" no histórico
   - Todos os dados são restaurados
   - Análise pode ser revisada ou continuada

## API de Storage (analysisStorage.ts)

### Funções Disponíveis

#### Análises de Distribuição
- `saveDistributionAnalysis()`: Salva análise completa
- `loadAnalyses()`: Carrega todas as análises
- `updateAnalysis()`: Atualiza análise existente
- `deleteAnalysis()`: Remove análise

#### Análises de Degradação
- `saveDegradationAnalysisDetailed()`: Salva análise de degradação
- `loadDegradationAnalyses()`: Carrega análises de degradação
- `deleteDegradationAnalysis()`: Remove análise de degradação

#### Configurações de Equipamentos
- `saveEquipmentConfiguration()`: Salva configuração de equipamento
- `loadEquipmentConfigurations()`: Carrega configurações

## Benefícios

1. **Segurança**: RLS garante isolamento completo entre usuários
2. **Performance**: Índices otimizados para consultas rápidas
3. **Escalabilidade**: Estrutura preparada para crescimento
4. **Rastreabilidade**: Timestamps em todas as operações
5. **Flexibilidade**: JSON permite extensões futuras
6. **Integridade**: Foreign keys garantem consistência

## Próximas Melhorias Possíveis

- [ ] Compartilhamento de análises entre usuários
- [ ] Versionamento de análises
- [ ] Tags e categorias para organização
- [ ] Backup automático
- [ ] Exportação em lote
- [ ] Comparação entre análises
