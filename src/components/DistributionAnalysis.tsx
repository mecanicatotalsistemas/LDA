import React from 'react';
import { TrendingUp, Award, Info } from 'lucide-react';
import { AnalysisResults } from '../types';
import ExportButtons from './ExportButtons';

interface DistributionAnalysisProps {
  analysisResults: AnalysisResults | null;
  selectedDistribution: string;
  onDistributionChange: (distribution: string) => void;
  data?: any[];
}

const DistributionAnalysis: React.FC<DistributionAnalysisProps> = ({
  analysisResults,
  selectedDistribution,
  onDistributionChange,
  data = []
}) => {
  if (!analysisResults) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma Análise Disponível
        </h3>
        <p className="text-gray-600">
          Carregue dados e execute a análise na aba "Dados" para ver os resultados.
        </p>
      </div>
    );
  }

  const distributions = [
    { key: 'weibull2', name: 'Weibull 2 Parâmetros', description: 'Mais comum para análise de confiabilidade' },
    { key: 'weibull3', name: 'Weibull 3 Parâmetros', description: 'Com parâmetro de localização' },
    { key: 'exponential', name: 'Exponencial', description: 'Taxa de falha constante' },
    { key: 'lognormal', name: 'Lognormal', description: 'Para processos de degradação' },
    { key: 'normal', name: 'Normal', description: 'Distribuição gaussiana' }
  ];

  const currentDist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];

  return (
    <div className="space-y-6">
      {/* Export Buttons - Show after analysis */}
      {analysisResults && data.length > 0 && (
        <ExportButtons 
          data={data}
          analysisResults={analysisResults}
          selectedDistribution={selectedDistribution}
          equipmentName={analysisResults.equipmentName}
        />
      )}

      {/* Best Distribution Recommendation */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Award className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">
            Distribuição Recomendada
          </h3>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <p className="text-lg font-medium text-gray-900">
            {distributions.find(d => d.key === analysisResults.bestDistribution)?.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Baseado nos critérios AIC e BIC
          </p>
        </div>
      </div>

      {/* Distribution Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Selecionar Distribuição para Análise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distributions.map((dist) => {
            const distResult = analysisResults.distributions[dist.key as keyof typeof analysisResults.distributions];
            const isSelected = selectedDistribution === dist.key;
            const isRecommended = analysisResults.bestDistribution === dist.key;
            
            return (
              <button
                key={dist.key}
                onClick={() => onDistributionChange(dist.key)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{dist.name}</h4>
                  {isRecommended && (
                    <Award className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{dist.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">AIC:</span>
                    <span className="font-mono">{distResult.aic.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">BIC:</span>
                    <span className="font-mono">{distResult.bic.toFixed(2)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Distribution Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalhes da Distribuição: {distributions.find(d => d.key === selectedDistribution)?.name}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parameters */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Parâmetros Estimados</h4>
            <div className="space-y-2">
              {Object.entries(currentDist.parameters).map(([param, value]) => (
                <div key={param} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{param}:</span>
                  <span className="font-mono text-gray-900">{value.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reliability Metrics */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Métricas de Confiabilidade</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">MTTF:</span>
                <span className="font-mono text-gray-900">{currentDist.mttf.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">B10:</span>
                <span className="font-mono text-gray-900">{currentDist.b10.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">B50:</span>
                <span className="font-mono text-gray-900">{currentDist.b50.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">B90:</span>
                <span className="font-mono text-gray-900">{currentDist.b90.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Fit Statistics */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Estatísticas de Ajuste</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Log-Likelihood</div>
              <div className="text-lg font-bold text-blue-900">{currentDist.logLikelihood.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">AIC</div>
              <div className="text-lg font-bold text-green-900">{currentDist.aic.toFixed(2)}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">BIC</div>
              <div className="text-lg font-bold text-purple-900">{currentDist.bic.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Interpretação dos Resultados:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>MTTF:</strong> Tempo médio até a falha</li>
                <li>• <strong>B10/B50/B90:</strong> Tempo em que 10%/50%/90% dos itens falham</li>
                <li>• <strong>AIC/BIC:</strong> Critérios de seleção (menores valores = melhor ajuste)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionAnalysis;