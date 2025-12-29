import React from 'react';
import { ArrowLeft, Printer, Download, FileText, Table, Database } from 'lucide-react';
import { DegradationResults, DegradationPoint } from '../types';

interface DegradationReportProps {
  results: DegradationResults;
  data: DegradationPoint[];
  onBack: () => void;
}

const DegradationReport: React.FC<DegradationReportProps> = ({
  results,
  data,
  onBack
}) => {
  const currentModel = results.models[results.bestModel as keyof typeof results.models];

  const printReport = () => {
    window.print();
  };

  const exportData = (format: 'csv' | 'json') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const csvData = [
        ['RELATÓRIO DE ANÁLISE DE DEGRADAÇÃO'],
        [''],
        ['INFORMAÇÕES GERAIS'],
        ['Equipamento', results.equipmentName || 'Não especificado'],
        ['Data da Análise', new Date().toLocaleString('pt-BR')],
        ['Modelo Recomendado', currentModel.name],
        ['Limite de Falha', results.failureLimit.toString()],
        ['Tempo Estimado de Falha', isFinite(results.estimatedFailureTime) ? results.estimatedFailureTime.toFixed(2) : 'N/A'],
        [''],
        ['PARÂMETROS DO MODELO'],
        ...Object.entries(currentModel.parameters).map(([param, value]) => [param, value.toFixed(6)]),
        ['R² (Coeficiente de Determinação)', (currentModel.rSquared * 100).toFixed(2) + '%'],
        [''],
        ['DADOS HISTÓRICOS'],
        ['Tempo', 'Valor Medido', 'Status'],
        ...data.map(point => [point.time.toString(), point.value.toString(), point.status === 1 ? 'Falhado' : 'Ativo'])
      ];

      content = csvData.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(',')
      ).join('\n');
      
      filename = `Relatorio_Degradacao_${results.equipmentName || 'Analise'}_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    } else {
      const jsonData = {
        equipmentName: results.equipmentName,
        analysisDate: new Date().toISOString(),
        failureLimit: results.failureLimit,
        estimatedFailureTime: results.estimatedFailureTime,
        bestModel: {
          name: currentModel.name,
          type: currentModel.type,
          parameters: currentModel.parameters,
          rSquared: currentModel.rSquared
        },
        allModels: results.models,
        dataStats: results.dataStats,
        historicalData: data,
        projectedData: results.projectedData
      };

      content = JSON.stringify(jsonData, null, 2);
      filename = `Relatorio_Degradacao_${results.equipmentName || 'Analise'}_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json;charset=utf-8;';
    }

    const blob = new Blob(['\ufeff' + content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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
          <span>Voltar aos Gráficos</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportData('csv')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Table className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => exportData('json')}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>Exportar JSON</span>
          </button>
          <button
            onClick={printReport}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatório de Análise de Degradação (DA)
          </h1>
          {results.equipmentName && (
            <h2 className="text-xl font-semibold text-orange-600 mb-2">
              Equipamento: {results.equipmentName}
            </h2>
          )}
          <p className="text-gray-600">
            Análise Preditiva de Degradação
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-orange-900 mb-2">Modelo Recomendado</h3>
                <p className="text-orange-800">{currentModel.name}</p>
                <p className="text-sm text-orange-700">R² = {(currentModel.rSquared * 100).toFixed(1)}%</p>
              </div>
              <div>
                <h3 className="font-medium text-orange-900 mb-2">Tempo Estimado de Falha</h3>
                <p className="text-orange-800 font-mono">
                  {isFinite(currentModel.timeToFailure(results.failureLimit)) 
                    ? `${currentModel.timeToFailure(results.failureLimit).toFixed(2)} unidades`
                    : 'Não determinado'
                  }
                </p>
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
              <div className="text-sm text-gray-600">Total de Medições</div>
              <div className="text-2xl font-bold text-gray-900">{results.dataStats.totalMeasurements}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Período Analisado</div>
              <div className="text-2xl font-bold text-blue-900">{results.dataStats.timeSpan.toFixed(1)}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600">Taxa de Degradação</div>
              <div className="text-2xl font-bold text-orange-900">{results.dataStats.degradationRate.toFixed(3)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Valor Atual</div>
              <div className="text-2xl font-bold text-green-900">{results.dataStats.currentValue.toFixed(2)}</div>
            </div>
          </div>
        </section>

        {/* Model Analysis */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Análise do Modelo: {currentModel.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parameters */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Parâmetros Estimados</h3>
              <div className="space-y-2">
                {Object.entries(currentModel.parameters).map(([param, value]) => (
                  <div key={param} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">{param}:</span>
                    <span className="font-mono text-gray-900">{value.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Metrics */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Métricas de Qualidade</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">R² (Coef. Determinação):</span>
                  <span className="font-mono text-gray-900">{(currentModel.rSquared * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">Limite de Falha:</span>
                  <span className="font-mono text-gray-900">{results.failureLimit}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">Tempo até Falha:</span>
                  <span className="font-mono text-gray-900">
                    {isFinite(currentModel.timeToFailure(results.failureLimit)) 
                      ? currentModel.timeToFailure(results.failureLimit).toFixed(2)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* All Models Comparison */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Comparação de Todos os Modelos
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    R²
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo de Falha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parâmetros
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(results.models).map(([key, model]) => (
                  <tr key={key} className={key === results.bestModel ? 'bg-orange-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{model.name}</span>
                        {key === results.bestModel && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Recomendado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {(model.rSquared * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {isFinite(model.timeToFailure(results.failureLimit)) 
                        ? model.timeToFailure(results.failureLimit).toFixed(2)
                        : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {Object.entries(model.parameters)
                        .map(([param, value]) => `${param}=${value.toFixed(3)}`)
                        .join(', ')
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Historical Data */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dados Históricos de Degradação
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
                    Valor Medido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {point.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        point.status === 1 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {point.status === 1 ? 'Falhado' : 'Ativo'}
                      </span>
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

        {/* Interpretation */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Interpretação dos Resultados
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                <strong>Modelo Selecionado:</strong> O modelo {currentModel.name} foi selecionado 
                por apresentar o melhor ajuste aos dados (R² = {(currentModel.rSquared * 100).toFixed(1)}%).
              </p>
              
              {isFinite(currentModel.timeToFailure(results.failureLimit)) ? (
                <p>
                  <strong>Previsão de Falha:</strong> Com base no modelo ajustado e no limite crítico 
                  de {results.failureLimit}, estima-se que a falha ocorrerá em aproximadamente {' '}
                  {currentModel.timeToFailure(results.failureLimit).toFixed(1)} unidades de tempo.
                </p>
              ) : (
                <p>
                  <strong>Previsão de Falha:</strong> O modelo não conseguiu determinar um tempo 
                  específico de falha com base nos dados fornecidos e no limite estabelecido.
                </p>
              )}
              
              <p>
                <strong>Taxa de Degradação:</strong> A degradação está ocorrendo a uma taxa de {' '}
                {results.dataStats.degradationRate.toFixed(3)} unidades por período de tempo.
              </p>
              
              <p>
                <strong>Recomendações:</strong> Monitore continuamente a degradação e considere 
                ações de manutenção preventiva antes que o limite crítico seja atingido.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-600">
            Relatório gerado pela ferramenta de Análise de Degradação (DA)
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Desenvolvido por <strong>Mecânica Total®</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DegradationReport;