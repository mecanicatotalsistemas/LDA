import React, { useState } from 'react';
import { ArrowLeft, FileText, TrendingDown, Target, Activity, Zap } from 'lucide-react';
import { DegradationResults, DegradationPoint } from '../types';

interface DegradationChartsProps {
  results: DegradationResults;
  data: DegradationPoint[];
  onBack: () => void;
  onViewReport: () => void;
}

const DegradationCharts: React.FC<DegradationChartsProps> = ({
  results,
  data,
  onBack,
  onViewReport
}) => {
  const [selectedModel, setSelectedModel] = useState(results.bestModel);

  const currentModel = results.models[selectedModel as keyof typeof results.models];

  // Chart dimensions
  const width = 700;
  const height = 400;
  const margin = { top: 30, right: 30, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Degradation Chart
  const DegradationChart = () => {
    const allTimes = [...data.map(d => d.time), ...results.projectedData.map(d => d.time)];
    const allValues = [...data.map(d => d.value), ...results.projectedData.map(d => d.value)];
    
    const maxTime = Math.max(...allTimes);
    const maxValue = Math.max(...allValues, results.failureLimit * 1.1);
    const minValue = Math.min(...allValues, 0);
    
    const xScale = (x: number) => (x / maxTime) * chartWidth;
    const yScale = (y: number) => chartHeight - ((y - minValue) / (maxValue - minValue)) * chartHeight;

    // Generate grid lines
    const xGridLines = Array.from({ length: 6 }, (_, i) => {
      const value = (i * maxTime) / 5;
      return { x: margin.left + xScale(value), value, label: `${value.toFixed(0)}` };
    });

    const yGridLines = Array.from({ length: 6 }, (_, i) => {
      const value = minValue + (i * (maxValue - minValue)) / 5;
      return { y: margin.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight, value, label: value.toFixed(2) };
    });

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Evolução da Degradação</h4>
          </div>
        </div>
        
        <div className="flex justify-center">
          <svg width={width} height={height}>
            {/* Background */}
            <rect 
              x={margin.left} 
              y={margin.top} 
              width={chartWidth} 
              height={chartHeight} 
              fill="#f8fafc"
              rx="8"
            />

            {/* Grid lines */}
            <g stroke="#e5e7eb" strokeWidth="1" opacity="0.5">
              {xGridLines.map((gridLine, i) => (
                <line key={`v-${i}`} x1={gridLine.x} y1={margin.top} x2={gridLine.x} y2={margin.top + chartHeight} />
              ))}
              {yGridLines.map((gridLine, i) => (
                <line key={`h-${i}`} x1={margin.left} y1={gridLine.y} x2={margin.left + chartWidth} y2={gridLine.y} />
              ))}
            </g>
            
            {/* Grid labels */}
            <g className="text-xs fill-gray-600">
              {xGridLines.map((gridLine, i) => (
                <text key={`x-label-${i}`} x={gridLine.x} y={height - 35} textAnchor="middle">
                  {gridLine.label}
                </text>
              ))}
              {yGridLines.map((gridLine, i) => (
                <text key={`y-label-${i}`} x={margin.left - 10} y={gridLine.y + 5} textAnchor="end">
                  {gridLine.label}
                </text>
              ))}
            </g>
            
            {/* Axes */}
            <g stroke="#374151" strokeWidth="2">
              <line x1={margin.left} y1={margin.top + chartHeight} x2={margin.left + chartWidth} y2={margin.top + chartHeight} />
              <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} />
            </g>

            {/* Failure limit line */}
            <line
              x1={margin.left}
              y1={margin.top + yScale(results.failureLimit)}
              x2={margin.left + chartWidth}
              y2={margin.top + yScale(results.failureLimit)}
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x={margin.left + chartWidth - 10}
              y={margin.top + yScale(results.failureLimit) - 5}
              textAnchor="end"
              className="text-sm font-medium fill-red-600"
            >
              Limite de Falha
            </text>

            {/* Historical data points */}
            {data.map((point, i) => (
              <circle
                key={i}
                cx={margin.left + xScale(point.time)}
                cy={margin.top + yScale(point.value)}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
            ))}

            {/* Projected curve */}
            <path
              d={results.projectedData
                .map((point, i) => `${i === 0 ? 'M' : 'L'} ${margin.left + xScale(point.time)} ${margin.top + yScale(point.value)}`)
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
            />

            {/* Estimated failure point */}
            {isFinite(results.estimatedFailureTime) && (
              <circle
                cx={margin.left + xScale(results.estimatedFailureTime)}
                cy={margin.top + yScale(results.failureLimit)}
                r="6"
                fill="#dc2626"
                stroke="white"
                strokeWidth="2"
              />
            )}
            
            {/* Axis labels */}
            <text
              x={margin.left + chartWidth / 2}
              y={height - 20}
              textAnchor="middle"
              className="text-sm font-medium fill-gray-700"
            >
              Tempo
            </text>
            <text
              x={25}
              y={margin.top + chartHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 25, ${margin.top + chartHeight / 2})`}
              className="text-sm font-medium fill-gray-700"
            >
              Valor da Degradação
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Dados Históricos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-yellow-500"></div>
            <span>Projeção ({currentModel.name})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-red-500 border-dashed border-t-2"></div>
            <span>Limite de Falha</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Falha Estimada</span>
          </div>
        </div>
      </div>
    );
  };

  // Reliability Chart (if life distribution is available)
  const ReliabilityChart = () => {
    if (!results.lifeDistribution) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Distribuição de vida não disponível</p>
          </div>
        </div>
      );
    }

    const dist = results.lifeDistribution;
    const maxTime = results.estimatedFailureTime * 2;
    const timePoints = Array.from({ length: 100 }, (_, i) => (i + 1) * maxTime / 100);
    const reliabilityData = timePoints.map(t => ({ x: t, y: dist.reliability(t) }));

    const xScale = (x: number) => (x / maxTime) * chartWidth;
    const yScale = (y: number) => chartHeight - (y * chartHeight);

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="text-xl font-bold text-gray-900">Confiabilidade R(t)</h4>
        </div>
        
        <div className="flex justify-center">
          <svg width={width} height={height}>
            <rect 
              x={margin.left} 
              y={margin.top} 
              width={chartWidth} 
              height={chartHeight} 
              fill="#f8fafc"
              rx="8"
            />

            {/* Grid and axes similar to degradation chart */}
            <g stroke="#e5e7eb" strokeWidth="1" opacity="0.5">
              {Array.from({ length: 6 }, (_, i) => (
                <line key={i} x1={margin.left + (i * chartWidth) / 5} y1={margin.top} x2={margin.left + (i * chartWidth) / 5} y2={margin.top + chartHeight} />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <line key={i} x1={margin.left} y1={margin.top + (i * chartHeight) / 5} x2={margin.left + chartWidth} y2={margin.top + (i * chartHeight) / 5} />
              ))}
            </g>
            
            <g stroke="#374151" strokeWidth="2">
              <line x1={margin.left} y1={margin.top + chartHeight} x2={margin.left + chartWidth} y2={margin.top + chartHeight} />
              <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} />
            </g>

            <path
              d={reliabilityData
                .map((point, i) => `${i === 0 ? 'M' : 'L'} ${margin.left + xScale(point.x)} ${margin.top + yScale(point.y)}`)
                .join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
            />

            <text x={margin.left + chartWidth / 2} y={height - 20} textAnchor="middle" className="text-sm font-medium fill-gray-700">
              Tempo
            </text>
            <text x={25} y={margin.top + chartHeight / 2} textAnchor="middle" transform={`rotate(-90, 25, ${margin.top + chartHeight / 2})`} className="text-sm font-medium fill-gray-700">
              Confiabilidade
            </text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar aos Dados</span>
        </button>
        
        <button
          onClick={onViewReport}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Ver Relatório</span>
        </button>
      </div>

      {/* Model Selection */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-orange-900 mb-4">Seleção do Modelo de Degradação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(results.models).map(([key, model]) => {
            const isSelected = selectedModel === key;
            const isRecommended = results.bestModel === key;
            
            return (
              <button
                key={key}
                onClick={() => setSelectedModel(key)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{model.name}</h4>
                  {isRecommended && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="Melhor Ajuste"></div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  R² = {(model.rSquared * 100).toFixed(1)}%
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Modelo Selecionado:</span>
              <div className="font-bold text-gray-900">{currentModel.name}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Qualidade do Ajuste:</span>
              <div className="font-bold text-orange-600">R² = {(currentModel.rSquared * 100).toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Tempo Estimado de Falha:</span>
              <div className="font-bold text-red-600">
                {isFinite(results.estimatedFailureTime) 
                  ? `${results.estimatedFailureTime.toFixed(1)} unidades`
                  : 'Não determinado'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <DegradationChart />
        <ReliabilityChart />
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Activity className="w-6 h-6 text-green-600" />
          <span>Resumo da Análise</span>
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total de Medições</div>
            <div className="text-2xl font-bold text-blue-900">{results.dataStats.totalMeasurements}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Período Analisado</div>
            <div className="text-2xl font-bold text-orange-900">{results.dataStats.timeSpan.toFixed(1)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Taxa de Degradação</div>
            <div className="text-2xl font-bold text-red-900">{results.dataStats.degradationRate.toFixed(3)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Valor Atual</div>
            <div className="text-2xl font-bold text-green-900">{results.dataStats.currentValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Model Parameters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Parâmetros do Modelo {currentModel.name}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Parâmetros Ajustados</h5>
            <div className="space-y-2">
              {Object.entries(currentModel.parameters).map(([param, value]) => (
                <div key={param} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{param}:</span>
                  <span className="font-mono text-gray-900">{value.toFixed(6)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-900 mb-3">Métricas de Qualidade</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">R² (Coef. Determinação):</span>
                <span className="font-mono text-gray-900">{(currentModel.rSquared * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">Tempo até Falha:</span>
                <span className="font-mono text-gray-900">
                  {isFinite(results.estimatedFailureTime) 
                    ? results.estimatedFailureTime.toFixed(2)
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DegradationCharts;