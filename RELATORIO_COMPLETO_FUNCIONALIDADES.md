# RELATÓRIO COMPLETO DE FUNCIONALIDADES
## Sistema de Análise de Confiabilidade LDA

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Autenticação e Controle de Acesso](#autenticação-e-controle-de-acesso)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Análises Disponíveis](#análises-disponíveis)
5. [Ferramentas Auxiliares](#ferramentas-auxiliares)
6. [Gerenciamento de Dados](#gerenciamento-de-dados)
7. [Integrações e Exportações](#integrações-e-exportações)
8. [Arquitetura Técnica](#arquitetura-técnica)

---

## 1. VISÃO GERAL

### 1.1 Propósito do Sistema
Sistema completo de análise de confiabilidade de equipamentos industriais, oferecendo análises estatísticas avançadas, modelos de distribuição, análise de degradação e ferramentas preditivas.

### 1.2 Tecnologias Principais
- **Frontend**: React 18.3.1 com TypeScript
- **UI Framework**: Tailwind CSS 3.4.1
- **Ícones**: Lucide React 0.344.0
- **Backend/Database**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Exportação**: jsPDF, html2canvas, XLSX, file-saver
- **Build Tool**: Vite 5.4.2

---

## 2. AUTENTICAÇÃO E CONTROLE DE ACESSO

### 2.1 Sistema de Login e Registro

#### **Login (Login.tsx)**
- Autenticação por email e senha
- Validação em tempo real
- Mensagens de erro amigáveis
- Redirecionamento automático após login
- Link para registro de novos usuários
- Interface responsiva e moderna

**Funcionalidades**:
```typescript
- signInWithPassword(email, password)
- Validação de campos obrigatórios
- Tratamento de erros (usuário não encontrado, senha incorreta, etc.)
- Loading state durante autenticação
```

#### **Registro (Register.tsx)**
- Criação de nova conta
- Campos obrigatórios:
  - Nome completo
  - Email
  - Senha (mínimo 6 caracteres)
  - Empresa
  - Telefone
- Criação automática de perfil no banco de dados
- Redirecionamento para login após sucesso

**Funcionalidades**:
```typescript
- signUp(email, password, metadata)
- Criação automática de perfil na tabela profiles
- Validação de formato de email
- Validação de força de senha
- Link para retornar ao login
```

### 2.2 Perfis de Usuário

#### **Três Níveis de Acesso**:

1. **Admin**
   - Acesso completo a todas funcionalidades
   - Gerenciamento de usuários
   - Visualização de todos os dados
   - Alteração de permissões
   - Bloqueio/desbloqueio de contas

2. **User (Usuário Padrão)**
   - Acesso a todas análises
   - Criação e salvamento de análises
   - Visualização do próprio histórico
   - Exportação de relatórios
   - Uso de todas ferramentas de cálculo

3. **Viewer (Visualizador)**
   - Visualização de análises
   - Acesso limitado
   - Não pode modificar dados
   - Apenas consulta

### 2.3 Contexto de Autenticação (AuthContext.tsx)

**Estado Global Gerenciado**:
```typescript
- user: User | null (dados do Supabase Auth)
- profile: UserProfile | null (dados completos do perfil)
- loading: boolean (estado de carregamento)
- isAdmin: boolean (verificação de admin)
```

**Funções Disponíveis**:
```typescript
- signIn(email, password): Promise<{success, error}>
- signUp(email, password, metadata): Promise<{success, error}>
- signOut(): Promise<void>
- loadProfile(): Promise<void>
```

**Segurança**:
- Verificação automática de usuário bloqueado (is_active = false)
- Logout automático se conta for desativada
- Sincronização de estado com Supabase
- Listeners para mudanças de autenticação

---

## 3. FUNCIONALIDADES PRINCIPAIS

### 3.1 Painel Principal (App.tsx)

#### **Interface Unificada com Abas**:

**Abas Disponíveis**:
1. 📜 **Histórico** - Análises salvas
2. 💾 **Dados** - Entrada de dados
3. 📊 **Distribuição** - Análise de distribuições
4. 📈 **Gráficos** - Visualizações
5. 📄 **Relatório** - Relatórios completos
6. 🧮 **Calculadora** - Cálculos sob demanda
7. 📉 **Degradação (DA)** - Análise de degradação
8. ⚠️ **Curva de Falha** - Probabilidade de falha
9. 📉 **Curva de Degradação** - Degradação ao longo do tempo
10. 👥 **Usuários** - Gerenciamento (apenas admin)
11. 💬 **LDAChat** - Assistente IA

#### **Funcionalidades Globais**:

**Nome do Equipamento**:
```typescript
- Campo de texto para identificar equipamento
- Usado em todas análises
- Salvo com cada análise
- Exibido em relatórios
- Exemplo: "Bomba Centrífuga 001", "Motor Elétrico A1"
```

**Botões de Ação**:
```typescript
- "Salvar Análise": Persiste análise no banco de dados
- "Nova Análise": Limpa dados e inicia nova análise
- Validação antes de salvar
- Confirmações de sucesso/erro
```

**Perfil do Usuário**:
```typescript
- Avatar com inicial do nome
- Nome completo
- Email
- Badge de "Administrador" (se aplicável)
- Botão de logout
```

---

## 4. ANÁLISES DISPONÍVEIS

### 4.1 Análise LDA (Life Data Analysis)

#### **Entrada de Dados (DataInput.tsx)**

**Métodos de Entrada**:

1. **Upload de CSV**
   - Formato: time, status, quantity
   - Headers: tempo, status (0=censurado, 1=falha), quantidade (opcional)
   - Parsing automático
   - Validação de formato
   - Detecção de delimitadores

2. **Entrada Manual**
   - Campo: Tempo de falha/censura
   - Dropdown: Status (Falha/Censurado)
   - Campo: Quantidade (opcional)
   - Botão adicionar
   - Edição inline
   - Remoção de entradas

3. **Template CSV**
   - Download de template exemplo
   - Instruções de preenchimento
   - Formato pré-definido

**Funcionalidades**:
```typescript
- Validação de dados (tempo > 0, status válido)
- Ordenação automática por tempo
- Estatísticas em tempo real (total, falhas, censurados)
- Botão "Analisar Dados"
- Loading state durante análise
- Tratamento de erros
```

#### **Análise de Distribuições (DistributionAnalysis.tsx)**

**Distribuições Suportadas**:

1. **Weibull 2 Parâmetros**
   - Parâmetros: η (eta - escala), β (beta - forma)
   - Mais versátil e comum
   - Adequada para mortalidade infantil, aleatória e desgaste

2. **Weibull 3 Parâmetros**
   - Parâmetros: η (escala), β (forma), γ (gamma - localização)
   - Para dados que não começam em zero
   - Maior flexibilidade

3. **Exponencial**
   - Parâmetro: λ (lambda - taxa de falha)
   - Taxa de falha constante
   - Falhas aleatórias

4. **Normal**
   - Parâmetros: μ (mu - média), σ (sigma - desvio padrão)
   - Distribuição simétrica
   - Adequada para processos gaussianos

5. **Lognormal**
   - Parâmetros: μ (média log), σ (desvio log)
   - Para dados assimétricos positivos
   - Comum em tempos de reparo

6. **Gamma**
   - Parâmetros: α (alfa - forma), β (beta - escala)
   - Flexível para diversos padrões
   - Adequada para processos de Poisson

**Seleção Automática**:
```typescript
- Cálculo de AIC (Akaike Information Criterion)
- Cálculo de BIC (Bayesian Information Criterion)
- Log-likelihood
- Ranking automático
- Recomendação da melhor distribuição
- Badge visual de "Recomendada"
```

**Para Cada Distribuição, Exibe**:
```typescript
- Nome da distribuição
- Parâmetros ajustados
- AIC, BIC, Log-Likelihood
- MTTF (Mean Time To Failure)
- B10 (10% de falha)
- B50 (50% de falha - vida mediana)
- B90 (90% de falha)
- Indicador de qualidade do ajuste
```

#### **Visualizações (Charts.tsx)**

**Gráficos Disponíveis**:

1. **PDF (Probability Density Function)**
   - Densidade de probabilidade
   - Mostra onde falhas são mais prováveis
   - Eixo X: Tempo
   - Eixo Y: Densidade f(t)

2. **CDF (Cumulative Distribution Function)**
   - Função de distribuição acumulada
   - Probabilidade de falha até tempo t
   - Curva S característica
   - F(t) = P(T ≤ t)

3. **Reliability Function**
   - Função de confiabilidade
   - R(t) = 1 - F(t)
   - Probabilidade de sobrevivência
   - Curva decrescente

4. **Hazard Rate (Taxa de Falha)**
   - λ(t) = f(t) / R(t)
   - Taxa instantânea de falha
   - Identifica fase da vida:
     - Decrescente: mortalidade infantil
     - Constante: vida útil
     - Crescente: desgaste

**Características dos Gráficos**:
```typescript
- Renderização com Canvas API
- Linhas suaves e anti-aliasing
- Grid de referência
- Múltiplas curvas (dados + modelo)
- Legendas interativas
- Escalas automáticas
- Cores diferenciadas por tipo
- Tooltips informativos
```

#### **Relatório Completo (Report.tsx)**

**Seções do Relatório**:

1. **Cabeçalho**
   - Nome do equipamento
   - Data e hora da análise
   - Distribuição utilizada
   - Logo da empresa (se disponível)

2. **Resumo Executivo**
   - MTTF
   - B10, B50, B90
   - Total de amostras
   - Número de falhas
   - Dados censurados

3. **Parâmetros da Distribuição**
   - Lista completa de parâmetros
   - Valores ajustados
   - Critérios de qualidade (AIC, BIC)

4. **Métricas de Confiabilidade**
   - Tabela com tempos específicos
   - R(t), F(t), λ(t), f(t) para cada tempo
   - Formatação clara
   - Valores em porcentagem e científicos

5. **Gráficos Integrados**
   - Todos os 4 gráficos principais
   - Alta qualidade para impressão
   - Legendas descritivas

6. **Interpretação e Recomendações**
   - Análise da fase de vida
   - Recomendações de manutenção
   - Intervalos ótimos
   - Estratégias preventivas

**Botões de Exportação**:
```typescript
- "Exportar PDF": Relatório completo em PDF
- "Exportar Excel": Dados tabulares em XLSX
- "Exportar PNG": Imagens dos gráficos
```

---

### 4.2 Calculadora de Confiabilidade (CalculatorTab.tsx)

**Função**: Permite cálculos sob demanda para tempos específicos

**Entradas**:
```typescript
1. Tempo (t): Tempo para calcular métricas
2. Tempo Condicional (T): Para R(T|t) - opcional
```

**Saídas Calculadas**:

1. **Confiabilidade R(t)**
   - Probabilidade de sobrevivência
   - Formato: percentual + decimal
   - Exemplo: 85.23% (0.852300)

2. **Probabilidade de Falha F(t)**
   - F(t) = 1 - R(t)
   - Formato: percentual + decimal
   - Exemplo: 14.77% (0.147700)

3. **Taxa de Falha λ(t)**
   - Taxa instantânea
   - Formato: notação científica
   - Unidade: falhas/unidade tempo
   - Exemplo: 2.345e-04

4. **Densidade f(t)**
   - Densidade de probabilidade
   - Formato: notação científica
   - Exemplo: 1.234e-03

5. **Confiabilidade Condicional R(T|t)** (opcional)
   - Probabilidade de sobreviver de t até T
   - Requer T > t
   - R(T|t) = R(T) / R(t)
   - Interpretação automática

**Interpretações Automáticas**:
```typescript
- R(t) > 90%: "Excelente confiabilidade"
- R(t) > 70%: "Boa confiabilidade"
- R(t) > 50%: "Confiabilidade moderada"
- R(t) ≤ 50%: "Baixa confiabilidade"
```

**Referência Rápida**:
```typescript
- Métricas da distribuição atual (MTTF, B10, B50, B90)
- Fórmulas principais
- Relações matemáticas
```

---

### 4.3 Análise de Degradação (DegradationAnalysis.tsx)

**Conceito**: Análise preditiva baseada em medições de degradação ao longo do tempo

**Aplicações**:
- Espessura de parede (corrosão)
- Vibração de máquinas
- Temperatura de rolamentos
- Desgaste de ferramentas
- Propriedades químicas
- Qualquer métrica que degrada

#### **Entrada de Dados de Degradação**

**Métodos**:

1. **Upload CSV**
   - Formato: time, value, status
   - time: tempo da medição
   - value: valor medido (ex: espessura, vibração)
   - status: 0=ativo, 1=falhado

2. **Entrada Manual**
   - Campo: Tempo
   - Campo: Valor Medido
   - Dropdown: Status (Ativo/Falhado)
   - Adição incremental

3. **Template CSV**
   - Download de exemplo
   - Instruções integradas

**Limite Crítico de Falha**:
```typescript
- Define o valor que constitui falha
- Exemplos:
  - Espessura mínima: 2.5 mm
  - Vibração máxima: 10 mm/s
  - Temperatura máxima: 120°C
- Usado para estimar tempo de falha
```

#### **Modelos de Degradação**

**4 Modelos Ajustados Automaticamente**:

1. **Modelo Linear**
   - Equação: y = a + b*t
   - Degradação constante
   - Parâmetros: a (intercepto), b (taxa)

2. **Modelo Exponencial**
   - Equação: y = a * exp(b*t)
   - Degradação acelerada
   - Parâmetros: a (inicial), b (taxa)

3. **Modelo Logarítmico**
   - Equação: y = a + b*ln(t)
   - Degradação desacelerando
   - Parâmetros: a, b

4. **Modelo de Potência**
   - Equação: y = a * t^b
   - Degradação flexível
   - Parâmetros: a, b

**Seleção Automática**:
```typescript
- Cálculo de R² (coeficiente de determinação)
- Modelo com maior R² é selecionado
- R² > 0.95: Excelente ajuste
- R² > 0.85: Bom ajuste
- R² > 0.70: Ajuste aceitável
- R² < 0.70: Aviso de baixa qualidade
```

#### **Resultados da Análise de Degradação**

**Métricas Calculadas**:
```typescript
1. Tempo Estimado de Falha
   - Quando o valor atingirá o limite crítico
   - Baseado no melhor modelo
   - Exemplo: 1847.23 horas

2. Taxa de Degradação
   - Velocidade de degradação
   - Unidades/tempo
   - Tendência (crescente/decrescente)

3. Valor Atual
   - Último valor medido
   - Estado atual do equipamento

4. Distância até Falha
   - Diferença entre valor atual e limite
   - Margem de segurança

5. Confiabilidade por Degradação
   - R(t) baseado em degradação
   - Diferente da análise LDA tradicional
```

#### **Visualizações de Degradação (DegradationCharts.tsx)**

**Gráficos**:

1. **Gráfico de Degradação**
   - Pontos de medição (scatter)
   - Curva do modelo ajustado
   - Linha do limite crítico
   - Projeção futura
   - Zona de falha destacada

2. **Confiabilidade por Degradação**
   - R(t) ao longo do tempo
   - Baseado no modelo de degradação
   - Probabilidade de ainda não ter falhado

3. **Comparação de Modelos**
   - Todos os 4 modelos sobrepostos
   - R² de cada modelo
   - Identificação do melhor

#### **Relatório de Degradação (DegradationReport.tsx)**

**Conteúdo**:
```typescript
1. Informações do Equipamento
   - Nome
   - Data da análise
   - Limite crítico definido

2. Resumo da Análise
   - Modelo selecionado
   - Parâmetros ajustados
   - R² (qualidade)
   - Tempo estimado de falha

3. Estatísticas dos Dados
   - Total de medições
   - Valor inicial
   - Valor atual
   - Taxa de degradação
   - Tempo decorrido

4. Tabela de Medições
   - Todas medições
   - Tempo, valor, status
   - Formatação clara

5. Gráficos Integrados
   - Degradação principal
   - Confiabilidade
   - Comparação de modelos

6. Recomendações
   - Quando intervir
   - Margem de segurança
   - Frequência de monitoramento
```

**Exportações**:
```typescript
- PDF completo
- Excel com dados
- Imagens PNG dos gráficos
```

---

### 4.4 Curva de Falha (FailureProbabilityChart.tsx)

**Função**: Visualização interativa da probabilidade de falha ao longo do tempo

**Características**:
```typescript
- Entrada de parâmetros Weibull (η, β)
- Gráfico de F(t) em tempo real
- Visualização de diferentes cenários
- Comparação de parâmetros
- Simulação de "what-if"
```

**Controles Interativos**:
```typescript
- Slider para η (escala): 100-5000
- Slider para β (forma): 0.5-5.0
- Atualização em tempo real
- Preview visual das mudanças
```

**Informações Exibidas**:
```typescript
- Curva F(t) completa
- Pontos notáveis (B10, B50, B90)
- MTTF
- Interpretação do comportamento
- Grid de referência
```

---

### 4.5 Curva de Degradação (DegradationCurveChart.tsx)

**Função**: Simulador visual de degradação com diferentes modelos

**Modelos Interativos**:
```typescript
1. Linear: y = a + bt
2. Exponencial: y = ae^(bt)
3. Logarítmico: y = a + b*ln(t)
4. Potência: y = at^b
```

**Controles**:
```typescript
- Seleção de modelo (dropdown)
- Ajuste de parâmetros (sliders)
- Limite crítico configurável
- Range de tempo ajustável
```

**Visualização**:
```typescript
- Curva de degradação
- Linha de limite crítico
- Ponto de interseção (falha estimada)
- Zona de segurança (verde)
- Zona de alerta (amarela)
- Zona crítica (vermelha)
```

**Cálculos em Tempo Real**:
```typescript
- Tempo estimado de falha
- Taxa de degradação atual
- Margem de segurança
- Tempo restante estimado
```

---

## 5. FERRAMENTAS AUXILIARES

### 5.1 LDAChat - Assistente IA (LDAChat.tsx)

**Conceito**: Chatbot inteligente para responder perguntas sobre análises

**Capacidades**:

#### **Perguntas sobre Confiabilidade**
```typescript
Exemplos de perguntas aceitas:
- "Qual a confiabilidade em 100 horas?"
- "Confiabilidade em 500h"
- "R(1000)"

Resposta inclui:
- Valor percentual
- Valor decimal
- Interpretação qualitativa
- Contexto do resultado
```

#### **Perguntas sobre Probabilidade de Falha**
```typescript
Exemplos:
- "Probabilidade de falha em 200 horas?"
- "F(500)"
- "Chance de falhar em 300h"

Resposta inclui:
- Percentual de falha
- Valor exato
- Interpretação
```

#### **Perguntas sobre Taxa de Falha**
```typescript
Exemplos:
- "Taxa de falha em 150 horas?"
- "λ(200)"
- "Lambda em 500h"

Resposta inclui:
- Valor em notação científica
- Unidade (falhas/hora)
- Interpretação (alta/baixa)
```

#### **Cálculos Inversos**
```typescript
Exemplos:
- "Tempo para 10% de falha?"
- "Quando atingir 50% de falha?"
- "Tempo para 25% falhar"

Usa busca binária para encontrar t onde F(t) = target
```

#### **Métricas Específicas**
```typescript
Perguntas sobre:
- B10, B50, B90
- MTTF
- Parâmetros da distribuição
- AIC, BIC

Respostas formatadas e explicadas
```

#### **Perguntas sobre Degradação**
```typescript
Exemplos:
- "Quando vai falhar por degradação?"
- "Qual o modelo de degradação?"
- "Taxa de degradação atual"

Requer análise de degradação ativa
Integração com DegradationResults
```

#### **Explicações Conceituais**
```typescript
Perguntas tipo:
- "Explique confiabilidade"
- "O que significa taxa de falha?"
- "O que é MTTF?"

Respostas educacionais detalhadas
Fórmulas e relações matemáticas
Aplicações práticas
```

#### **Resumo de Análise**
```typescript
Comando: "Resumo" ou "Sumário"

Retorna:
- Equipamento analisado
- Distribuição usada
- MTTF, B10, B50, B90
- Total de amostras
- Falhas e censurados
```

**Características do Chat**:
```typescript
- Interface de chat moderna
- Histórico de conversas
- Typing indicators (bot digitando)
- Timestamps em mensagens
- Scroll automático
- Perguntas rápidas sugeridas
- Suporte a múltiplas perguntas
- Context-aware (sabe qual análise está ativa)
```

**Perguntas Rápidas Predefinidas**:
```typescript
- "Qual a confiabilidade em 100 horas?"
- "Probabilidade de falha em 200 horas?"
- "Qual o B50?"
- "Quando vai falhar por degradação?"
- "Resumo da análise"
```

---

### 5.2 Gerenciamento de Usuários (UserManagement.tsx)

**Acesso**: Apenas administradores

**Funcionalidades**:

#### **Listagem de Usuários**
```typescript
Exibe para cada usuário:
- Avatar (inicial do nome)
- Nome completo
- Email
- Empresa
- Telefone
- Papel (Admin/User/Viewer)
- Status (Ativo/Bloqueado)
- Data de último login
- Data de criação
```

#### **Pesquisa e Filtros**
```typescript
Busca por:
- Nome
- Email
- Empresa

Filtros:
- Todos
- Apenas Admins
- Apenas Users
- Apenas Viewers
- Ativos
- Bloqueados
```

#### **Ações sobre Usuários**

1. **Alterar Papel**
   ```typescript
   - Dropdown para selecionar novo papel
   - Admin → User → Viewer
   - Confirmação de mudança
   - Não pode alterar próprio papel
   - Atualização instantânea na UI
   ```

2. **Bloquear/Desbloquear**
   ```typescript
   - Toggle de status is_active
   - Usuário bloqueado não pode fazer login
   - Logout automático se bloqueado
   - Não pode bloquear própria conta
   - Ícones: Lock/Unlock
   ```

3. **Visualizar Detalhes**
   ```typescript
   - Modal com informações completas
   - Histórico de atividades
   - Análises criadas
   - Última atividade
   ```

4. **Deletar Usuário** (se implementado)
   ```typescript
   - Confirmação obrigatória
   - Remove da auth.users
   - Remove de profiles
   - Cascade para análises (se configurado)
   ```

#### **Estatísticas**
```typescript
- Total de usuários
- Ativos vs Bloqueados
- Admins, Users, Viewers
- Novos usuários (último mês)
- Atividade recente
```

#### **Segurança**
```typescript
- RPC functions com SECURITY DEFINER
- Bypass controlado de RLS
- Apenas admins podem acessar
- Logs de ações administrativas
- Validações no backend
```

---

### 5.3 Histórico de Análises (AnalysisHistory.tsx)

**Função**: Gerenciar todas as análises salvas pelo usuário

**Visualização**:
```typescript
Cards organizados mostrando:
- Título da análise
- Nome do equipamento
- Data e hora de criação
- Tipo de análise (LDA ou Degradação)
- Preview dos dados
- Distribuição/modelo usado
```

**Funcionalidades**:

1. **Carregar Análise**
   ```typescript
   - Clique no card para abrir
   - Restaura todos os dados originais
   - Recalcula métricas (dados sempre frescos)
   - Navega para aba apropriada
   - Feedback visual de loading
   ```

2. **Deletar Análise**
   ```typescript
   - Botão de exclusão
   - Confirmação obrigatória
   - Remoção do banco de dados
   - Atualização da lista
   - Ação irreversível
   ```

3. **Pesquisa**
   ```typescript
   - Busca por título
   - Busca por equipamento
   - Busca por data
   - Resultados em tempo real
   ```

4. **Filtros**
   ```typescript
   - Por tipo (LDA/Degradação)
   - Por período (hoje, semana, mês, todos)
   - Por equipamento
   ```

5. **Ordenação**
   ```typescript
   - Mais recentes primeiro (padrão)
   - Mais antigos primeiro
   - Por nome (A-Z)
   - Por tipo
   ```

**Armazenamento**:
```typescript
Tabela: analyses

Campos salvos:
- id: UUID
- user_id: UUID (FK para profiles)
- title: string
- analysis_type: 'distribution' | 'degradation'
- input_data: JSONB (dados originais)
- results: JSONB (resultados calculados)
- created_at: timestamp
- updated_at: timestamp
```

**RLS (Row Level Security)**:
```typescript
- Usuários só veem próprias análises
- Admins podem ver todas
- Insert: apenas próprio user_id
- Update/Delete: apenas próprias análises
```

---

## 6. GERENCIAMENTO DE DADOS

### 6.1 Salvamento de Análises

#### **Análise LDA (Distribution)**
```typescript
Função: saveDistributionAnalysis()

Dados salvos:
{
  title: string,
  analysis_type: 'distribution',
  input_data: {
    data: DataPoint[],
    selectedDistribution: string,
    equipmentName: string
  },
  results: AnalysisResults
}
```

#### **Análise de Degradação**
```typescript
Função: saveDegradationAnalysisDetailed()

Dados salvos:
{
  title: string,
  analysis_type: 'degradation',
  input_data: {
    equipmentName: string,
    failureLimit: number,
    data: DegradationPoint[]
  },
  results: DegradationResults
}
```

### 6.2 Carregamento de Análises

**Processo**:
```typescript
1. Buscar análise no banco
2. Extrair input_data
3. Restaurar estado da aplicação
4. Recalcular resultados (dados sempre atualizados)
5. Navegar para aba apropriada
```

**Vantagens do Recálculo**:
```typescript
- Sempre usa lógica de cálculo mais recente
- Correções de bugs aplicadas automaticamente
- Melhores algoritmos beneficiam análises antigas
- Garante consistência
```

---

## 7. INTEGRAÇÕES E EXPORTAÇÕES

### 7.1 Exportação para PDF

**Biblioteca**: jsPDF + html2canvas

**Processo**:
```typescript
1. Captura da tela (html2canvas)
2. Conversão para imagem
3. Criação de documento PDF
4. Adição de cabeçalho/rodapé
5. Formatação profissional
6. Download automático
```

**Características**:
```typescript
- Tamanho A4
- Orientação Portrait ou Landscape
- Margens ajustadas
- Logo da empresa (se disponível)
- Informações de cabeçalho
- Numeração de páginas
- Data e hora
- Assinatura digital (opcional)
```

### 7.2 Exportação para Excel

**Biblioteca**: XLSX (SheetJS)

**Conteúdo**:

1. **Aba: Dados Originais**
   ```typescript
   - Tempo
   - Status
   - Quantidade (se aplicável)
   - Valor (se degradação)
   ```

2. **Aba: Resultados**
   ```typescript
   - Distribuição/Modelo
   - Parâmetros
   - MTTF, B10, B50, B90
   - AIC, BIC, R²
   ```

3. **Aba: Métricas**
   ```typescript
   Tabela com tempos específicos:
   - Tempo | R(t) | F(t) | λ(t) | f(t)
   - 50, 100, 200, 500, 1000, 2000, 5000
   ```

4. **Aba: Informações**
   ```typescript
   - Nome do equipamento
   - Data da análise
   - Usuário
   - Versão do software
   ```

**Formatação**:
```typescript
- Headers em negrito
- Cores alternadas nas linhas
- Larguras de coluna automáticas
- Números formatados (decimais, porcentagens)
- Bordas em tabelas
```

### 7.3 Exportação de Imagens (PNG)

**Biblioteca**: html2canvas

**Tipos de Imagens**:
```typescript
1. Gráficos individuais
   - PDF, CDF, Reliability, Hazard
   - Alta resolução (2x)
   - Fundo branco
   - Tamanho: 1200x800px

2. Relatório completo
   - Captura de tela
   - Scroll automático
   - Múltiplas páginas se necessário

3. Curvas de degradação
   - Modelos sobrepostos
   - Legendas claras
```

---

## 8. ARQUITETURA TÉCNICA

### 8.1 Estrutura de Pastas

```
/src
  /components          # Componentes React
    - Login.tsx
    - Register.tsx
    - Header.tsx
    - Footer.tsx
    - DataInput.tsx
    - DistributionAnalysis.tsx
    - Charts.tsx
    - Report.tsx
    - CalculatorTab.tsx
    - DegradationAnalysis.tsx
    - DegradationCharts.tsx
    - DegradationReport.tsx
    - DegradationCurveChart.tsx
    - FailureProbabilityChart.tsx
    - LDAChat.tsx
    - UserManagement.tsx
    - AnalysisHistory.tsx
    - ExportButtons.tsx

  /contexts            # Context API
    - AuthContext.tsx  # Estado global de autenticação

  /lib                 # Integrações externas
    - supabase.ts      # Cliente Supabase

  /types               # TypeScript types
    - index.ts         # Todas as interfaces e types

  /utils               # Funções utilitárias
    - calculations.ts          # Cálculos LDA
    - degradationCalculations.ts  # Cálculos de degradação
    - analysisStorage.ts       # Salvar/carregar análises
    - exportUtils.ts           # Exportações (PDF, Excel)

  - App.tsx            # Componente principal
  - main.tsx           # Entry point
  - index.css          # Estilos globais

/supabase
  /migrations          # Migrações do banco de dados
    - [timestamp]_create_users_profiles.sql
    - [timestamp]_create_analyses_table.sql
    - [timestamp]_add_admin_functions.sql
    - etc.

/public
  - LOGO.jpg          # Logo da aplicação
```

### 8.2 Banco de Dados Supabase

#### **Tabelas**

1. **auth.users** (Supabase Auth)
   ```sql
   - id: UUID (PK)
   - email: string
   - encrypted_password: string
   - email_confirmed_at: timestamp
   - created_at: timestamp
   - updated_at: timestamp
   ```

2. **profiles**
   ```sql
   - id: UUID (PK, FK → auth.users.id)
   - email: string
   - full_name: string
   - role: enum ('admin', 'user', 'viewer')
   - company: string
   - phone: string
   - is_active: boolean (default: false)
   - last_login: timestamp
   - created_at: timestamp
   - updated_at: timestamp
   ```

3. **analyses**
   ```sql
   - id: UUID (PK)
   - user_id: UUID (FK → profiles.id)
   - title: string
   - analysis_type: enum ('distribution', 'degradation')
   - input_data: JSONB
   - results: JSONB
   - created_at: timestamp
   - updated_at: timestamp
   ```

#### **RLS Policies**

```sql
profiles:
- Users can view own profile
- Users can update own profile
- Users can insert own profile

analyses:
- Users can view own analyses
- Users can insert own analyses
- Users can update own analyses
- Users can delete own analyses
```

#### **Functions**

```sql
get_all_profiles()
  - Retorna todos os perfis
  - SECURITY DEFINER
  - Apenas para admins

update_user_role(target_user_id, new_role)
  - Atualiza papel de usuário
  - SECURITY DEFINER

update_user_status(target_user_id, new_status)
  - Ativa/desativa usuário
  - SECURITY DEFINER

delete_user_profile(target_user_id)
  - Deleta usuário completamente
  - SECURITY DEFINER
  - Cascade para auth.users
```

### 8.3 Fluxo de Dados

#### **Autenticação**
```
1. User preenche login
2. Supabase Auth valida
3. Retorna session + user
4. AuthContext carrega profile
5. Verifica is_active
6. Atualiza last_login
7. Disponibiliza para toda aplicação
```

#### **Análise LDA**
```
1. Upload CSV ou entrada manual
2. Validação de dados
3. performDistributionAnalysis()
4. Ajuste de 6 distribuições
5. Cálculo de métricas (AIC, BIC, MTTF, etc)
6. Seleção automática da melhor
7. Geração de curvas (PDF, CDF, R(t), λ(t))
8. Exibição em charts
9. Geração de relatório
10. Opção de salvar
```

#### **Análise de Degradação**
```
1. Upload CSV ou entrada manual
2. Definir limite crítico
3. performDegradationAnalysis()
4. Ajuste de 4 modelos (Linear, Exp, Log, Power)
5. Cálculo de R² para cada
6. Seleção do melhor modelo
7. Estimativa de tempo de falha
8. Curvas de degradação
9. Confiabilidade por degradação
10. Relatório detalhado
11. Opção de salvar
```

#### **LDAChat**
```
1. Usuário digita pergunta
2. Parsing da pergunta (regex patterns)
3. Identificação de intent
4. Extração de parâmetros (tempo, percentual)
5. Cálculos necessários
6. Formatação da resposta
7. Exibição no chat
8. Atualização do histórico
```

### 8.4 Algoritmos de Cálculo

#### **Ajuste de Distribuições (calculations.ts)**

**Método**: Maximum Likelihood Estimation (MLE)

1. **Weibull 2P**
   ```typescript
   Parâmetros: η (eta), β (beta)
   PDF: f(t) = (β/η) * (t/η)^(β-1) * exp(-(t/η)^β)
   CDF: F(t) = 1 - exp(-(t/η)^β)
   R(t): R(t) = exp(-(t/η)^β)
   λ(t): λ(t) = (β/η) * (t/η)^(β-1)
   ```

2. **Exponencial**
   ```typescript
   Parâmetro: λ (lambda)
   PDF: f(t) = λ * exp(-λt)
   CDF: F(t) = 1 - exp(-λt)
   R(t): R(t) = exp(-λt)
   λ(t): λ (constante)
   ```

3. **Normal**
   ```typescript
   Parâmetros: μ (mu), σ (sigma)
   PDF: f(t) = (1/σ√(2π)) * exp(-((t-μ)²)/(2σ²))
   CDF: F(t) = Φ((t-μ)/σ)  [função erro]
   ```

**Critérios de Seleção**:
```typescript
AIC = 2k - 2ln(L)
  k = número de parâmetros
  L = likelihood

BIC = k*ln(n) - 2ln(L)
  n = tamanho da amostra

Menor AIC/BIC = melhor ajuste
```

#### **Ajuste de Degradação (degradationCalculations.ts)**

**Método**: Regressão por Mínimos Quadrados

1. **Linear**: y = a + bt
   ```typescript
   Minimizar: Σ(yi - (a + bti))²
   ```

2. **Exponencial**: y = ae^(bt)
   ```typescript
   Linearizar: ln(y) = ln(a) + bt
   Minimizar: Σ(ln(yi) - (ln(a) + bti))²
   ```

3. **Logarítmico**: y = a + b*ln(t)
   ```typescript
   Minimizar: Σ(yi - (a + b*ln(ti)))²
   ```

4. **Potência**: y = at^b
   ```typescript
   Linearizar: ln(y) = ln(a) + b*ln(t)
   Minimizar: Σ(ln(yi) - (ln(a) + b*ln(ti)))²
   ```

**R² (Coeficiente de Determinação)**:
```typescript
R² = 1 - (SS_res / SS_tot)
SS_res = Σ(yi - ŷi)²  [soma dos quadrados residuais]
SS_tot = Σ(yi - ȳ)²   [soma dos quadrados totais]
```

**Estimativa de Tempo de Falha**:
```typescript
Para modelo y = f(t):
Resolver: f(t) = limite_critico
Método: Newton-Raphson ou busca binária
```

### 8.5 Tipos TypeScript (types/index.ts)

```typescript
// Ponto de dados LDA
interface DataPoint {
  time: number;
  status: 0 | 1;  // 0=censurado, 1=falha
  quantity?: number;
}

// Ponto de dados de degradação
interface DegradationPoint {
  time: number;
  value: number;
  status: 0 | 1;
}

// Resultado de distribuição
interface DistributionResult {
  name: string;
  parameters: Record<string, number>;
  mttf: number;
  b10: number;
  b50: number;
  b90: number;
  aic: number;
  bic: number;
  logLikelihood: number;
  reliability: (t: number) => number;
  failure: (t: number) => number;
  hazard: (t: number) => number;
  pdf: (t: number) => number;
}

// Resultados completos de análise LDA
interface AnalysisResults {
  distributions: {
    weibull2: DistributionResult;
    weibull3: DistributionResult;
    exponential: DistributionResult;
    normal: DistributionResult;
    lognormal: DistributionResult;
    gamma: DistributionResult;
  };
  dataStats: {
    totalSamples: number;
    failures: number;
    censored: number;
    meanTime: number;
  };
  equipmentName?: string;
}

// Modelo de degradação
interface DegradationModel {
  name: string;
  type: 'linear' | 'exponential' | 'logarithmic' | 'power';
  parameters: Record<string, number>;
  rSquared: number;
  predict: (t: number) => number;
}

// Resultados de análise de degradação
interface DegradationResults {
  models: {
    linear: DegradationModel;
    exponential: DegradationModel;
    logarithmic: DegradationModel;
    power: DegradationModel;
  };
  bestModel: string;
  estimatedFailureTime: number;
  failureLimit: number;
  dataStats: {
    totalPoints: number;
    currentValue: number;
    degradationRate: number;
    timeElapsed: number;
  };
}

// Perfil de usuário
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'viewer';
  company: string;
  phone: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

// Análise salva
interface SavedAnalysis {
  id: string;
  user_id: string;
  title: string;
  analysis_type: 'distribution' | 'degradation';
  input_data: any;
  results: any;
  created_at: string;
  updated_at: string;
}
```

---

## 9. FUNCIONALIDADES ESPECIAIS

### 9.1 Responsividade

```typescript
- Design mobile-first
- Breakpoints: sm, md, lg, xl
- Grid responsivo
- Tabelas com scroll horizontal em mobile
- Modais adaptáveis
- Touch-friendly (botões grandes)
- Menu hamburger em mobile (se aplicável)
```

### 9.2 Acessibilidade

```typescript
- Labels em todos inputs
- Contraste adequado (WCAG AA)
- Focus visible
- Keyboard navigation
- ARIA labels onde necessário
- Tooltips explicativos
- Mensagens de erro claras
```

### 9.3 Performance

```typescript
- Lazy loading de componentes
- Memoização com useMemo/useCallback
- Debounce em pesquisas
- Paginação em listas grandes
- Virtual scrolling (se necessário)
- Compressão de imagens
- Code splitting por rota
```

### 9.4 Segurança

```typescript
- Autenticação obrigatória
- RLS em todas tabelas
- HTTPS only
- Validação no backend
- Sanitização de inputs
- CORS configurado
- Rate limiting (Supabase)
- Senhas hasheadas (bcrypt)
- Tokens JWT seguros
```

---

## 10. RESUMO DE FUNCIONALIDADES POR ABA

### 📜 Aba: Histórico
- Listar análises salvas
- Pesquisar análises
- Filtrar por tipo/data
- Carregar análise anterior
- Deletar análises
- Pré-visualização

### 💾 Aba: Dados
- Upload CSV
- Entrada manual
- Template CSV
- Validação de dados
- Estatísticas em tempo real
- Botão de análise
- Tratamento de erros

### 📊 Aba: Distribuição
- 6 distribuições disponíveis
- Parâmetros de cada uma
- Métricas (AIC, BIC, MTTF, B10, B50, B90)
- Seleção automática da melhor
- Comparação visual
- Recomendações

### 📈 Aba: Gráficos
- PDF (densidade)
- CDF (acumulada)
- Reliability
- Hazard rate
- Renderização canvas
- Legendas interativas
- Exportação de imagens

### 📄 Aba: Relatório
- Relatório completo
- Seções estruturadas
- Tabelas formatadas
- Gráficos integrados
- Interpretações
- Recomendações
- Exportação PDF/Excel

### 🧮 Aba: Calculadora
- Cálculo para tempo específico
- R(t), F(t), λ(t), f(t)
- Confiabilidade condicional
- Interpretações automáticas
- Referência rápida

### 📉 Aba: Degradação (DA)
- Upload/entrada de degradação
- 4 modelos de degradação
- Seleção automática
- Limite crítico
- Tempo estimado de falha
- Gráficos de degradação
- Relatório de degradação
- Exportações

### ⚠️ Aba: Curva de Falha
- Simulador interativo
- Parâmetros ajustáveis
- Visualização F(t)
- Cenários what-if

### 📉 Aba: Curva de Degradação
- Simulador de degradação
- 4 modelos interativos
- Parâmetros ajustáveis
- Previsão visual
- Zonas de segurança

### 👥 Aba: Usuários (Admin)
- Listar usuários
- Pesquisar/filtrar
- Alterar papéis
- Bloquear/desbloquear
- Visualizar detalhes
- Estatísticas

### 💬 Aba: LDAChat
- Chat interativo
- Perguntas em linguagem natural
- Cálculos sob demanda
- Explicações conceituais
- Perguntas rápidas
- Histórico de conversas
- Suporte a degradação

---

## 11. DOCUMENTAÇÃO ADICIONAL

### 11.1 Arquivos de Documentação Existentes

1. **README.md**
   - Visão geral do projeto
   - Instruções de instalação
   - Como executar
   - Tecnologias usadas

2. **AUTH_SYSTEM.md**
   - Documentação do sistema de autenticação
   - Fluxos de login/registro
   - Gerenciamento de sessões
   - Políticas RLS

3. **DATABASE_STRUCTURE.md**
   - Estrutura do banco
   - Tabelas e relacionamentos
   - Migrações
   - Functions e triggers

4. **DATABASE_USERS.md**
   - Gerenciamento de usuários
   - Papéis e permissões
   - Operações CRUD

5. **PRIMEIROS_PASSOS.md**
   - Guia de início rápido
   - Primeiro acesso
   - Tutorial básico

6. **CREATE_ADMIN_USER.sql**
   - Script para criar admin
   - Usuário inicial do sistema

7. **ADMIN_AUGUSTO_CONFIRMACAO.md**
   - Confirmação de admin criado

---

## 12. FÓRMULAS E REFERÊNCIAS TÉCNICAS

### 12.1 Fórmulas de Confiabilidade

```
Confiabilidade: R(t) = P(T > t)
Probabilidade de Falha: F(t) = 1 - R(t) = P(T ≤ t)
Densidade de Falha: f(t) = dF(t)/dt = -dR(t)/dt
Taxa de Falha: λ(t) = f(t) / R(t)

Relação: R(t) = exp(-∫₀ᵗ λ(τ) dτ)

MTTF = ∫₀^∞ R(t) dt

B10 = t onde F(t) = 0.10
B50 = t onde F(t) = 0.50 (mediana)
B90 = t onde F(t) = 0.90

Confiabilidade Condicional:
R(T|t) = R(T) / R(t) para T > t
```

### 12.2 Fórmulas de Distribuições

**Weibull 2P**:
```
f(t) = (β/η) * (t/η)^(β-1) * exp(-(t/η)^β)
F(t) = 1 - exp(-(t/η)^β)
R(t) = exp(-(t/η)^β)
λ(t) = (β/η) * (t/η)^(β-1)

MTTF = η * Γ(1 + 1/β)
```

**Exponencial**:
```
f(t) = λ * exp(-λt)
F(t) = 1 - exp(-λt)
R(t) = exp(-λt)
λ(t) = λ (constante)

MTTF = 1/λ
```

**Normal**:
```
f(t) = (1/(σ√(2π))) * exp(-((t-μ)²)/(2σ²))
F(t) = Φ((t-μ)/σ)
```

**Lognormal**:
```
f(t) = (1/(tσ√(2π))) * exp(-((ln(t)-μ)²)/(2σ²))
```

### 12.3 Critérios de Informação

```
AIC (Akaike Information Criterion):
AIC = 2k - 2ln(L)
  k = número de parâmetros
  L = maximum likelihood

BIC (Bayesian Information Criterion):
BIC = k*ln(n) - 2ln(L)
  n = tamanho da amostra

Menor valor = melhor ajuste
```

### 12.4 Regressão

```
R² (Coeficiente de Determinação):
R² = 1 - (SS_res / SS_tot)

SS_res = Σ(yi - ŷi)²  [soma resíduos²]
SS_tot = Σ(yi - ȳ)²   [soma total²]

0 ≤ R² ≤ 1
R² = 1: ajuste perfeito
R² = 0: modelo não explica variância
```

---

## 13. CASOS DE USO

### Caso 1: Análise de Bomba Centrífuga
```
1. Login como user
2. Criar nova análise
3. Nomear: "Bomba Centrífuga BC-001"
4. Upload CSV com tempos de falha
5. Análise automática
6. Weibull 2P selecionada (β=2.3)
7. MTTF = 8547 horas
8. B10 = 3200 horas
9. Recomendação: manutenção a cada 3000h
10. Salvar análise
11. Exportar PDF para equipe
```

### Caso 2: Degradação de Espessura de Parede
```
1. Login como user
2. Aba: Degradação (DA)
3. Nomear: "Tubulação Setor A"
4. Upload CSV: tempo, espessura_mm
5. Limite crítico: 2.5 mm
6. Análise: modelo linear selecionado
7. Taxa: -0.15 mm/ano
8. Tempo estimado falha: 4.2 anos
9. Atual: 3.13 mm
10. Recomendação: inspeção anual
11. Salvar análise
12. Exportar relatório
```

### Caso 3: Chat Interativo
```
1. Login como user
2. Executar análise LDA
3. Aba: LDAChat
4. Perguntar: "Qual a confiabilidade em 1000 horas?"
5. Resposta: "R(1000) = 92.34%"
6. Perguntar: "Tempo para 10% de falha?"
7. Resposta: "B10 = 2847 horas"
8. Perguntar: "Resumo"
9. Resposta completa com todas métricas
```

### Caso 4: Gerenciamento de Usuários (Admin)
```
1. Login como admin
2. Aba: Usuários
3. Visualizar lista completa
4. Pesquisar usuário "João Silva"
5. Alterar papel: User → Viewer
6. Resultado: João agora tem acesso limitado
7. Usuário "Maria" está inativo
8. Bloquear acesso temporariamente
9. Maria tenta login: "Conta bloqueada"
```

---

## 14. MANUTENÇÃO E SUPORTE

### 14.1 Logs e Debugging

```typescript
- Console.log em desenvolvimento
- Mensagens de erro amigáveis ao usuário
- Tratamento de exceções em todas funções críticas
- Logs de ações administrativas
- Timestamp em todas operações
```

### 14.2 Testes

```typescript
Tipos de testes necessários:
- Unit tests (cálculos matemáticos)
- Integration tests (API Supabase)
- E2E tests (fluxos completos)
- Testes de carga
- Testes de segurança
```

### 14.3 Versionamento

```typescript
Estratégia Git:
- Branch main: produção
- Branch develop: desenvolvimento
- Feature branches: novas funcionalidades
- Commits semânticos
- Tags para releases
```

---

## 15. ROADMAP FUTURO (Possíveis Melhorias)

### 15.1 Funcionalidades Potenciais

```
1. Suporte a mais distribuições (Gamma 3P, Gumbel, etc)
2. Análise de sistemas (série, paralelo, k-out-of-n)
3. Simulação Monte Carlo
4. Integração com CMMS (Computerized Maintenance Management System)
5. API REST para integração externa
6. App mobile nativo (React Native)
7. Notificações push
8. Agendamento de análises recorrentes
9. Dashboard executivo
10. Comparação de múltiplos equipamentos
11. Machine Learning para previsões
12. OCR para leitura de planilhas físicas
```

### 15.2 Melhorias de UI/UX

```
1. Tema dark mode
2. Customização de cores
3. Templates de relatório personalizáveis
4. Arrastar e soltar arquivos
5. Edição inline de dados
6. Undo/Redo
7. Atalhos de teclado
8. Tutoriais interativos
9. Tour guiado para novos usuários
10. Feedback haptic em mobile
```

---

## CONCLUSÃO

Este sistema é uma plataforma completa e profissional para análise de confiabilidade de equipamentos industriais, combinando:

✅ **Análises estatísticas robustas** (6 distribuições, 4 modelos de degradação)
✅ **Interface moderna e intuitiva** (React + Tailwind)
✅ **Segurança enterprise** (Supabase Auth + RLS)
✅ **Exportações profissionais** (PDF, Excel, PNG)
✅ **IA integrada** (LDAChat para perguntas)
✅ **Gestão completa** (usuários, histórico, permissões)
✅ **Escalabilidade** (arquitetura moderna, cloud-ready)

**Total de funcionalidades**: 50+
**Linhas de código**: ~10.000+
**Componentes React**: 20+
**Distribuições suportadas**: 6
**Modelos de degradação**: 4
**Tipos de exportação**: 3 (PDF, Excel, PNG)
**Níveis de acesso**: 3 (Admin, User, Viewer)

---

**Documento gerado em**: 06/03/2026
**Versão**: 1.0
**Autor**: Sistema LDA
**Status**: Completo e em produção
