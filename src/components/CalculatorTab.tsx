import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { AnalysisResults } from '../types';

interface CalculatorTabProps {
  analysisResults: AnalysisResults | null;
  selectedDistribution: string;
}

const CalculatorTab: React.FC<CalculatorTabProps> = ({
  analysisResults,
  selectedDistribution
}) => {
  const [timeInput, setTimeInput] = useState<string>('');
  const [conditionTime, setConditionTime] = useState<string>('');

  const calculations = useMemo(() => {
    if (!analysisResults || !timeInput) return null;

    const t = parseFloat(timeInput);
    if (isNaN(t) || t <= 0) return null;

    const dist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];
    
    const reliability = dist.reliability(t);
    const failure = dist.failure(t);
    const hazard = dist.hazard(t);
    const pdf = dist.pdf(t);

    // Conditional reliability R(T|t) if condition time is provided
    let conditionalReliability = null;
    if (conditionTime) {
      const T = parseFloat(conditionTime);
      if (!isNaN(T) && T > t) {
        conditionalReliability = dist.reliability(T) / dist.reliability(t);
      }
    }

    return {
      time: t,
      reliability,
      failure,
      hazard,
      pdf,
      conditionalReliability,
      conditionTime: conditionTime ? parseFloat(conditionTime) : null
    };
  }, [analysisResults, selectedDistribution, timeInput, conditionTime]);

  if (!analysisResults) {
    return (
      <div className="text-center py-12">
        <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Calculadora Não Disponível
        </h3>
        <p className="text-gray-600">
          Execute a análise para usar a calculadora de confiabilidade.
        </p>
      </div>
    );
  }

  const currentDist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];

  return (
    <div className="space-y-6">
      {/* Distribution Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">
            Calculadora de Confiabilidade
          </h3>
        </div>
        <p className="text-blue-800">
          Distribuição: <strong>{currentDist.name}</strong>
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Parâmetros de Entrada
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempo (t) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1000"
              min="0"
              step="any"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tempo para calcular R(t), F(t), λ(t)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempo Condicional (T) <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="number"
              value={conditionTime}
              onChange={(e) => setConditionTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1500"
              min="0"
              step="any"
            />
            <p className="text-xs text-gray-500 mt-1">
              Para calcular R(T|t) - deve ser maior que t
            </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {calculations && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Resultados para t = {calculations.time}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium mb-1">
                Confiabilidade R(t)
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {(calculations.reliability * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {calculations.reliability.toFixed(6)}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 font-medium mb-1">
                Probabilidade de Falha F(t)
              </div>
              <div className="text-2xl font-bold text-red-900">
                {(calculations.failure * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-red-700 mt-1">
                {calculations.failure.toFixed(6)}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium mb-1">
                Taxa de Falha λ(t)
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {calculations.hazard.toExponential(3)}
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                falhas/unidade tempo
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium mb-1">
                Densidade f(t)
              </div>
              <div className="text-2xl font-bold text-green-900">
                {calculations.pdf.toExponential(3)}
              </div>
              <div className="text-xs text-green-700 mt-1">
                densidade de probabilidade
              </div>
            </div>
          </div>

          {/* Conditional Reliability */}
          {calculations.conditionalReliability !== null && calculations.conditionTime && (
            <div className="border-t border-gray-200 pt-4">
              <h5 className="font-medium text-gray-900 mb-3">
                Confiabilidade Condicional
              </h5>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium mb-1">
                  R({calculations.conditionTime}|{calculations.time})
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {(calculations.conditionalReliability * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  Probabilidade de sobreviver até {calculations.conditionTime}, dado que sobreviveu até {calculations.time}
                </div>
              </div>
            </div>
          )}

          {/* Interpretation */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h5 className="font-medium text-gray-900 mb-3">Interpretação</h5>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="text-sm text-gray-700 space-y-2">
                <li>
                  • <strong>R(t) = {(calculations.reliability * 100).toFixed(1)}%:</strong> 
                  {calculations.reliability > 0.9 ? ' Excelente confiabilidade' : 
                   calculations.reliability > 0.7 ? ' Boa confiabilidade' : 
                   calculations.reliability > 0.5 ? ' Confiabilidade moderada' : 
                   ' Baixa confiabilidade'} no tempo {calculations.time}
                </li>
                <li>
                  • <strong>F(t) = {(calculations.failure * 100).toFixed(1)}%:</strong> 
                  Probabilidade de falha acumulada até o tempo {calculations.time}
                </li>
                <li>
                  • <strong>λ(t):</strong> Taxa instantânea de falha no tempo {calculations.time}
                  {calculations.hazard > 0.001 ? ' (relativamente alta)' : ' (relativamente baixa)'}
                </li>
                {calculations.conditionalReliability !== null && (
                  <li>
                    • <strong>Confiabilidade Condicional:</strong> 
                    {calculations.conditionalReliability > 0.8 ? ' Alta probabilidade' : 
                     calculations.conditionalReliability > 0.5 ? ' Probabilidade moderada' : 
                     ' Baixa probabilidade'} de sobreviver mais {calculations.conditionTime! - calculations.time} unidades de tempo
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Referência Rápida</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Métricas da Distribuição Atual:</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• MTTF: {currentDist.mttf.toFixed(2)}</li>
              <li>• B10: {currentDist.b10.toFixed(2)}</li>
              <li>• B50: {currentDist.b50.toFixed(2)}</li>
              <li>• B90: {currentDist.b90.toFixed(2)}</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Fórmulas:</h5>
            <ul className="space-y-1 text-gray-600 font-mono text-xs">
              <li>• R(t) = Confiabilidade</li>
              <li>• F(t) = 1 - R(t)</li>
              <li>• λ(t) = f(t) / R(t)</li>
              <li>• R(T|t) = R(T) / R(t)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorTab;