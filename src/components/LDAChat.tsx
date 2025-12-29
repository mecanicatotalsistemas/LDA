import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Calculator, HelpCircle, Zap } from 'lucide-react';
import { AnalysisResults, DegradationResults } from '../types';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface LDAChatProps {
  analysisResults: AnalysisResults | null;
  selectedDistribution: string;
  degradationResults?: DegradationResults | null;
}

const LDAChat: React.FC<LDAChatProps> = ({
  analysisResults,
  selectedDistribution,
  degradationResults = null
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (analysisResults) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `🤖 Olá! Sou o LDAChat, seu assistente de análise de confiabilidade.\n\n📊 Análise carregada com sucesso!\n• Distribuição: ${analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions].name}\n• MTTF: ${analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions].mttf.toFixed(2)} horas\n• Total de amostras: ${analysisResults.dataStats.totalSamples}\n\n❓ Pergunte-me sobre:\n• Confiabilidade em X horas\n• Probabilidade de falha\n• Taxa de falha\n• Tempos B10, B50, B90\n• Explicações técnicas`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [analysisResults, selectedDistribution]);

  const extractTimeFromQuestion = (question: string): number | null => {
    // Regex patterns to extract time values
    const patterns = [
      /(\d+(?:\.\d+)?)\s*h(?:oras?)?/i,
      /(\d+(?:\.\d+)?)\s*horas?/i,
      /em\s+(\d+(?:\.\d+)?)/i,
      /após\s+(\d+(?:\.\d+)?)/i,
      /com\s+(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)/
    ];

    for (const pattern of patterns) {
      const match = question.match(pattern);
      if (match) {
        const time = parseFloat(match[1]);
        if (!isNaN(time) && time > 0) {
          return time;
        }
      }
    }
    return null;
  };

  const extractPercentageFromQuestion = (question: string): number | null => {
    const patterns = [
      /(\d+(?:\.\d+)?)\s*%/i,
      /(\d+(?:\.\d+)?)\s*por\s*cento/i
    ];

    for (const pattern of patterns) {
      const match = question.match(pattern);
      if (match) {
        const percentage = parseFloat(match[1]);
        if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
          return percentage / 100;
        }
      }
    }
    return null;
  };

  const calculateTimeForFailureProbability = (targetF: number): number => {
    if (!analysisResults) return 0;
    
    const dist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];
    
    // Binary search to find time where F(t) = targetF
    let low = 0.1;
    let high = dist.mttf * 10;
    let iterations = 0;
    const maxIterations = 100;
    const tolerance = 0.0001;

    while (iterations < maxIterations && (high - low) > tolerance) {
      const mid = (low + high) / 2;
      const currentF = dist.failure(mid);
      
      if (Math.abs(currentF - targetF) < tolerance) {
        return mid;
      }
      
      if (currentF < targetF) {
        low = mid;
      } else {
        high = mid;
      }
      iterations++;
    }
    
    return (low + high) / 2;
  };

  const processQuestion = (question: string): string => {
    if (!analysisResults) {
      return "❌ Nenhuma análise disponível. Execute a análise LDA primeiro.";
    }

    const dist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];
    const lowerQuestion = question.toLowerCase();

    // Reliability questions
    if (lowerQuestion.includes('confiabilidade') || lowerQuestion.includes('r(t)')) {
      const time = extractTimeFromQuestion(question);
      if (time !== null) {
        const reliability = dist.reliability(time);
        return `🎯 **Confiabilidade em ${time} horas:**\n\nR(${time}) = ${(reliability * 100).toFixed(2)}%\n\n📊 Isso significa que há ${(reliability * 100).toFixed(1)}% de probabilidade do equipamento funcionar sem falhas até ${time} horas.\n\n🔢 Valor exato: ${reliability.toFixed(6)}`;
      } else {
        return "❓ Para calcular a confiabilidade, preciso saber o tempo. Exemplo: 'Qual a confiabilidade em 100 horas?'";
      }
    }

    // Failure probability questions
    if (lowerQuestion.includes('probabilidade de falha') || lowerQuestion.includes('f(t)') || lowerQuestion.includes('falha')) {
      const time = extractTimeFromQuestion(question);
      if (time !== null) {
        const failure = dist.failure(time);
        return `📉 **Probabilidade de Falha em ${time} horas:**\n\nF(${time}) = ${(failure * 100).toFixed(2)}%\n\n⚠️ Isso significa que há ${(failure * 100).toFixed(1)}% de probabilidade do equipamento falhar até ${time} horas.\n\n🔢 Valor exato: ${failure.toFixed(6)}`;
      } else {
        return "❓ Para calcular a probabilidade de falha, preciso saber o tempo. Exemplo: 'Qual a probabilidade de falha em 200 horas?'";
      }
    }

    // Hazard rate questions
    if (lowerQuestion.includes('taxa de falha') || lowerQuestion.includes('λ(t)') || lowerQuestion.includes('lambda')) {
      const time = extractTimeFromQuestion(question);
      if (time !== null) {
        const hazard = dist.hazard(time);
        return `⚡ **Taxa de Falha em ${time} horas:**\n\nλ(${time}) = ${hazard.toExponential(4)} falhas/hora\n\n📈 Esta é a taxa instantânea de falha no tempo ${time}h. Quanto maior, maior o risco de falha naquele momento.\n\n🔢 Valor exato: ${hazard}`;
      } else {
        return "❓ Para calcular a taxa de falha, preciso saber o tempo. Exemplo: 'Qual a taxa de falha em 150 horas?'";
      }
    }

    // Time for specific failure probability
    if (lowerQuestion.includes('tempo para') && (lowerQuestion.includes('falha') || lowerQuestion.includes('%'))) {
      const percentage = extractPercentageFromQuestion(question);
      if (percentage !== null) {
        const time = calculateTimeForFailureProbability(percentage);
        return `⏰ **Tempo para ${(percentage * 100)}% de Falha:**\n\nT = ${time.toFixed(2)} horas\n\n📅 Em ${time.toFixed(1)} horas, espera-se que ${(percentage * 100)}% dos equipamentos tenham falhado.\n\n🎯 Confiabilidade neste tempo: ${((1 - percentage) * 100).toFixed(1)}%`;
      }
    }

    // B10, B50, B90 questions
    if (lowerQuestion.includes('b10') || lowerQuestion.includes('b 10')) {
      return `📊 **B10 (10% de Falha):**\n\nB10 = ${dist.b10.toFixed(2)} horas\n\n📈 Este é o tempo em que 10% dos equipamentos terão falhado.\n\n✅ 90% ainda estarão funcionando neste tempo.`;
    }

    if (lowerQuestion.includes('b50') || lowerQuestion.includes('b 50')) {
      return `📊 **B50 (50% de Falha):**\n\nB50 = ${dist.b50.toFixed(2)} horas\n\n⚖️ Este é o tempo mediano - metade dos equipamentos terá falhado.\n\n📈 Também conhecido como vida mediana.`;
    }

    if (lowerQuestion.includes('b90') || lowerQuestion.includes('b 90')) {
      return `📊 **B90 (90% de Falha):**\n\nB90 = ${dist.b90.toFixed(2)} horas\n\n📉 Este é o tempo em que 90% dos equipamentos terão falhado.\n\n⚠️ Apenas 10% ainda estarão funcionando.`;
    }

    if (lowerQuestion.includes('degradação') || lowerQuestion.includes('degradacao')) {
      if (!degradationResults) {
        return "❌ Nenhuma análise de degradação disponível. Execute a análise DA primeiro na aba 'Degradação (DA)'.";
      }
      
      if (lowerQuestion.includes('tempo') && (lowerQuestion.includes('falha') || lowerQuestion.includes('falhar'))) {
        const estimatedTime = degradationResults.estimatedFailureTime;
        if (isFinite(estimatedTime)) {
          return `⏰ **Tempo Estimado de Falha por Degradação:**\n\nT_falha = ${estimatedTime.toFixed(2)} unidades\n\n📊 **Modelo usado:** ${degradationResults.models[degradationResults.bestModel as keyof typeof degradationResults.models].name}\n📈 **Qualidade do ajuste:** R² = ${(degradationResults.models[degradationResults.bestModel as keyof typeof degradationResults.models].rSquared * 100).toFixed(1)}%\n\n⚠️ **Limite crítico:** ${degradationResults.failureLimit}\n\n🔧 **Recomendação:** Planeje manutenção preventiva antes deste tempo.`;
        } else {
          return `❌ **Tempo de falha não determinado**\n\nO modelo de degradação não conseguiu calcular um tempo específico de falha com base nos dados fornecidos.\n\n🔍 **Possíveis causas:**\n• Dados insuficientes\n• Modelo inadequado\n• Limite de falha muito alto/baixo\n\n💡 **Sugestão:** Revise os dados e o limite crítico.`;
        }
      }
      
      if (lowerQuestion.includes('modelo') || lowerQuestion.includes('ajuste')) {
        const bestModel = degradationResults.models[degradationResults.bestModel as keyof typeof degradationResults.models];
        const paramText = Object.entries(bestModel.parameters)
          .map(([param, value]) => `• ${param}: ${value.toFixed(4)}`)
          .join('\n');
        
        return `📈 **Modelo de Degradação Selecionado:**\n\n🔧 **Tipo:** ${bestModel.name}\n📊 **Qualidade (R²):** ${(bestModel.rSquared * 100).toFixed(1)}%\n\n📋 **Parâmetros:**\n${paramText}\n\n📈 **Taxa de degradação:** ${degradationResults.dataStats.degradationRate.toFixed(3)} unidades/tempo\n📊 **Valor atual:** ${degradationResults.dataStats.currentValue.toFixed(2)}`;
      }
      
      return `🧬 **Análise de Degradação Disponível:**\n\n📊 **Modelo:** ${degradationResults.models[degradationResults.bestModel as keyof typeof degradationResults.models].name}\n⏰ **Tempo estimado de falha:** ${isFinite(degradationResults.estimatedFailureTime) ? degradationResults.estimatedFailureTime.toFixed(2) + ' unidades' : 'Não determinado'}\n📈 **Qualidade do ajuste:** R² = ${(degradationResults.models[degradationResults.bestModel as keyof typeof degradationResults.models].rSquared * 100).toFixed(1)}%\n\n❓ **Pergunte sobre:**\n• "Quando vai falhar por degradação?"\n• "Qual o modelo de degradação?"\n• "Como está a taxa de degradação?"`;
    }

    // MTTF questions
    if (lowerQuestion.includes('mttf') || lowerQuestion.includes('tempo médio')) {
      return `⏱️ **MTTF (Tempo Médio até Falha):**\n\nMTTF = ${dist.mttf.toFixed(2)} horas\n\n📊 Este é o tempo médio esperado até a primeira falha.\n\n🎯 Para a distribuição ${dist.name}, este valor representa a expectativa matemática do tempo de vida.`;
    }

    // Distribution and parameters
    if (lowerQuestion.includes('distribuição') || lowerQuestion.includes('parâmetros')) {
      const paramText = Object.entries(dist.parameters)
        .map(([param, value]) => `• ${param}: ${value.toFixed(4)}`)
        .join('\n');
      
      return `📈 **Distribuição e Parâmetros:**\n\n🔧 Distribuição: ${dist.name}\n\n📊 Parâmetros ajustados:\n${paramText}\n\n📋 Qualidade do ajuste:\n• AIC: ${dist.aic.toFixed(2)}\n• BIC: ${dist.bic.toFixed(2)}\n• Log-Likelihood: ${dist.logLikelihood.toFixed(4)}`;
    }

    // Explanations
    if (lowerQuestion.includes('explique') || lowerQuestion.includes('o que significa')) {
      if (lowerQuestion.includes('confiabilidade')) {
        return `📚 **O que é Confiabilidade?**\n\n🎯 A confiabilidade R(t) é a probabilidade de um item funcionar sem falhas durante um período de tempo t, sob condições específicas.\n\n📊 **Interpretação:**\n• R(t) = 1.0 (100%): Certeza de funcionamento\n• R(t) = 0.5 (50%): 50% de chance de funcionar\n• R(t) = 0.0 (0%): Certeza de falha\n\n⚡ **No seu caso:**\nCom a distribuição ${dist.name}, a confiabilidade diminui ao longo do tempo conforme a curva característica desta distribuição.`;
      }
      
      if (lowerQuestion.includes('taxa de falha')) {
        return `📚 **O que é Taxa de Falha λ(t)?**\n\n⚡ A taxa de falha é a probabilidade instantânea de falha no tempo t, dado que o item sobreviveu até t.\n\n📊 **Interpretação:**\n• λ(t) constante: Taxa não muda (Exponencial)\n• λ(t) crescente: Desgaste/envelhecimento\n• λ(t) decrescente: Mortalidade infantil\n\n🔧 **No seu equipamento:**\nCom ${dist.name}, a taxa de falha ${dist.parameters.beta ? (dist.parameters.beta > 1 ? 'aumenta' : dist.parameters.beta < 1 ? 'diminui' : 'é constante') : 'varia'} ao longo do tempo.`;
      }
      
      return `📚 **Conceitos de Confiabilidade:**\n\n🎯 **R(t)**: Probabilidade de sobrevivência até tempo t\n📉 **F(t)**: Probabilidade de falha até tempo t\n⚡ **λ(t)**: Taxa instantânea de falha\n📊 **f(t)**: Densidade de probabilidade de falha\n\n🔗 **Relações:**\n• F(t) = 1 - R(t)\n• λ(t) = f(t) / R(t)\n• R(t) = exp(-∫λ(τ)dτ)`;
    }

    // Summary questions
    if (lowerQuestion.includes('resumo') || lowerQuestion.includes('sumário')) {
      return `📋 **Resumo da Análise:**\n\n🏭 **Equipamento:** ${analysisResults.equipmentName || 'Não especificado'}\n📊 **Distribuição:** ${dist.name}\n⏱️ **MTTF:** ${dist.mttf.toFixed(2)} horas\n\n📈 **Métricas Principais:**\n• B10: ${dist.b10.toFixed(2)}h\n• B50: ${dist.b50.toFixed(2)}h\n• B90: ${dist.b90.toFixed(2)}h\n\n📊 **Dados:**\n• Total: ${analysisResults.dataStats.totalSamples} amostras\n• Falhas: ${analysisResults.dataStats.failures}\n• Censurados: ${analysisResults.dataStats.censored}`;
    }

    // Default response with suggestions
    return `🤔 **Não entendi sua pergunta.**\n\n💡 **Experimente perguntar:**\n\n🎯 **Cálculos:**\n• "Qual a confiabilidade em 100 horas?"\n• "Probabilidade de falha em 200 horas?"\n• "Taxa de falha em 150 horas?"\n• "Tempo para 10% de falha?"\n\n📊 **Métricas:**\n• "Qual o B10?" / "B50?" / "B90?"\n• "Qual o MTTF?"\n• "Quais os parâmetros?"\n\n📚 **Explicações:**\n• "Explique confiabilidade"\n• "O que significa taxa de falha?"\n• "Resumo da análise"`;
    return `🤔 **Não entendi sua pergunta.**\n\n💡 **Experimente perguntar:**\n\n🎯 **Cálculos LDA:**\n• "Qual a confiabilidade em 100 horas?"\n• "Probabilidade de falha em 200 horas?"\n• "Taxa de falha em 150 horas?"\n• "Tempo para 10% de falha?"\n\n🧬 **Degradação (DA):**\n• "Quando vai falhar por degradação?"\n• "Qual o modelo de degradação?"\n• "Como está a taxa de degradação?"\n\n📊 **Métricas:**\n• "Qual o B10?" / "B50?" / "B90?"\n• "Qual o MTTF?"\n• "Quais os parâmetros?"\n\n📚 **Explicações:**\n• "Explique confiabilidade"\n• "O que significa taxa de falha?"\n• "Resumo da análise"`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !analysisResults) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = processQuestion(userMessage.content);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Qual a confiabilidade em 100 horas?",
    "Probabilidade de falha em 200 horas?",
    "Qual o B50?",
    "Quando vai falhar por degradação?",
    "Resumo da análise"
  ];

  if (!analysisResults) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          LDAChat Não Disponível
        </h3>
        <p className="text-gray-600">
          Execute a análise LDA para ativar o chat interativo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">LDAChat</h3>
            <p className="text-blue-100 text-sm">
              Assistente de Análise de Confiabilidade
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && (
                  <Bot className="w-4 h-4 mt-1 text-blue-600" />
                )}
                {message.type === 'user' && (
                  <User className="w-4 h-4 mt-1 text-white" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-1 opacity-70`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center space-x-2 mb-2">
          <HelpCircle className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Perguntas Rápidas:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputValue(question)}
              className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre confiabilidade, falha, taxa de falha..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LDAChat;