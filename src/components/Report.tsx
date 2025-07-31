import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { DataPoint, AnalysisResults } from '../types';
import ExportButtons from './ExportButtons';

interface ReportProps {
  data: DataPoint[];
  analysisResults: AnalysisResults | null;
  selectedDistribution: string;
}

const Report: React.FC<ReportProps> = ({
  data,
  analysisResults,
  selectedDistribution
}) => {
  if (!analysisResults) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum Relatório Disponível
        </h3>
        <p className="text-gray-600">
          Execute a análise para gerar o relatório completo.
        </p>
      </div>
    );
  }

  const currentDist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];
  const bestDist = analysisResults.distributions[analysisResults.bestDistribution as keyof typeof analysisResults.distributions];

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <ExportButtons 
        data={data}
        analysisResults={analysisResults}
        selectedDistribution={selectedDistribution}
        equipmentName={analysisResults.equipmentName}
      />

      {/* Print Button */}
      <div className="flex justify-end">
        <button
          onClick={printReport}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir</span>
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatório de Life Data Analysis
          </h1>
          {analysisResults.equipmentName && (
            <h2 className="text-xl font-semibold text-blue-600 mb-2">
              Equipamento: {analysisResults.equipmentName}
            </h2>
          )}
          <p className="text-gray-600">
            Análise de Confiabilidade de Ativos
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Gerado em: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Executive Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Resumo Executivo
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Distribuição Recomendada</h3>
                <p className="text-blue-800">{bestDist.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">MTTF (Tempo Médio até Falha)</h3>
                <p className="text-blue-800 font-mono">{bestDist.mttf.toFixed(2)} unidades</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Resumo dos Dados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total de Amostras</div>
              <div className="text-2xl font-bold text-gray-900">{analysisResults.dataStats.totalSamples}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600">Falhas</div>
              <div className="text-2xl font-bold text-red-900">{analysisResults.dataStats.failures}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600">Censurados</div>
              <div className="text-2xl font-bold text-yellow-900">{analysisResults.dataStats.censored}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Tempo Médio</div>
              <div className="text-2xl font-bold text-green-900">{analysisResults.dataStats.meanTime.toFixed(1)}</div>
            </div>
          </div>
        </section>

        {/* Distribution Analysis */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Análise da Distribuição Selecionada: {currentDist.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parameters */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Parâmetros Estimados</h3>
              <div className="space-y-2">
                {Object.entries(currentDist.parameters).map(([param, value]) => (
                  <div key={param} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">{param}:</span>
                    <span className="font-mono text-gray-900">{value.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reliability Metrics */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Métricas de Confiabilidade</h3>
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

          {/* Model Fit */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Qualidade do Ajuste</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Log-Likelihood</div>
                <div className="text-lg font-bold text-blue-900">{currentDist.logLikelihood.toFixed(4)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">AIC</div>
                <div className="text-lg font-bold text-green-900">{currentDist.aic.toFixed(4)}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">BIC</div>
                <div className="text-lg font-bold text-purple-900">{currentDist.bic.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* All Distributions Comparison */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Comparação de Todas as Distribuições
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distribuição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AIC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BIC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MTTF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    B50
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analysisResults.distributions).map(([key, dist]) => (
                  <tr key={key} className={key === analysisResults.bestDistribution ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{dist.name}</span>
                        {key === analysisResults.bestDistribution && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Recomendada
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {dist.aic.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {dist.bic.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {dist.mttf.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {dist.b50.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Data Table */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dados Utilizados na Análise
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slice(0, 20).map((point, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {point.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        point.status === 1 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {point.status === 1 ? 'Falha' : 'Censurado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {point.group || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 20 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Mostrando primeiros 20 registros de {data.length} total
              </p>
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-600">
            Relatório gerado pela ferramenta Life Data Analysis
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Desenvolvido por <strong>Mecânica Total®</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Report;