import React, { useState, useCallback } from 'react';
import { TrendingDown, Plus, Trash2, Play, Download, Upload, Target, Activity, Save } from 'lucide-react';
import { DegradationPoint, DegradationResults } from '../types';
import { performDegradationAnalysis } from '../utils/degradationCalculations';
import { saveDegradationAnalysisDetailed } from '../utils/analysisStorage';
import DegradationCharts from './DegradationCharts';
import DegradationReport from './DegradationReport';

interface DegradationAnalysisProps {
  equipmentName: string;
}

const DegradationAnalysis: React.FC<DegradationAnalysisProps> = ({ equipmentName }) => {
  const [data, setData] = useState<DegradationPoint[]>([]);
  const [failureLimit, setFailureLimit] = useState<string>('');
  const [newEntry, setNewEntry] = useState({ time: '', value: '', status: '0' });
  const [results, setResults] = useState<DegradationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'input' | 'charts' | 'report'>('input');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const timeIndex = headers.findIndex(h => h.includes('time') || h.includes('tempo'));
      const valueIndex = headers.findIndex(h => h.includes('value') || h.includes('valor') || h.includes('medição'));
      const statusIndex = headers.findIndex(h => h.includes('status'));

      if (timeIndex === -1 || valueIndex === -1) {
        alert('Arquivo deve conter colunas "time" e "value"');
        return;
      }

      const parsedData: DegradationPoint[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const time = parseFloat(values[timeIndex]);
        const value = parseFloat(values[valueIndex]);
        const status = statusIndex >= 0 ? parseInt(values[statusIndex]) : 0;
        
        if (!isNaN(time) && !isNaN(value)) {
          parsedData.push({ time, value, status });
        }
      }

      setData(parsedData.sort((a, b) => a.time - b.time));
    };
    reader.readAsText(file);
  }, []);

  const addEntry = useCallback(() => {
    const time = parseFloat(newEntry.time);
    const value = parseFloat(newEntry.value);
    const status = parseInt(newEntry.status);
    
    if (isNaN(time) || time < 0) {
      alert('Tempo deve ser um número não negativo');
      return;
    }
    
    if (isNaN(value)) {
      alert('Valor deve ser um número válido');
      return;
    }

    const entry: DegradationPoint = { time, value, status };
    const newData = [...data, entry].sort((a, b) => a.time - b.time);
    setData(newData);
    setNewEntry({ time: '', value: '', status: '0' });
  }, [data, newEntry]);

  const removeEntry = useCallback((index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  }, [data]);

  const runAnalysis = useCallback(async () => {
    if (data.length < 3) {
      alert('São necessários pelo menos 3 pontos de medição para análise');
      return;
    }

    const limit = parseFloat(failureLimit);
    if (isNaN(limit) || limit <= 0) {
      alert('Limite de falha deve ser um número positivo');
      return;
    }

    setIsLoading(true);
    try {
      const analysisResults = await performDegradationAnalysis(data, limit, equipmentName);
      setResults(analysisResults);
      setActiveView('charts');
    } catch (error) {
      console.error('Erro na análise:', error);
      alert(`Erro ao realizar análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  }, [data, failureLimit, equipmentName]);

  const saveCurrentAnalysis = useCallback(async () => {
    if (!results) {
      alert('Nenhuma análise para salvar. Execute a análise primeiro.');
      return;
    }

    const title = equipmentName
      ? `Degradação - ${equipmentName} - ${new Date().toLocaleDateString()}`
      : `Análise de Degradação - ${new Date().toLocaleDateString()}`;

    try {
      const result = await saveDegradationAnalysisDetailed(
        title,
        equipmentName || 'Equipamento não especificado',
        parseFloat(failureLimit),
        data,
        results
      );

      if (result.success) {
        alert('Análise de degradação salva com sucesso!');
      } else {
        alert('Erro ao salvar análise: ' + result.error);
      }
    } catch (error: any) {
      alert('Erro ao salvar análise: ' + error.message);
    }
  }, [results, equipmentName, failureLimit, data]);

  const downloadTemplate = useCallback(() => {
    const csvContent = 'time,value,status\n0,1.0,0\n100,1.2,0\n200,1.5,0\n300,1.8,0\n400,2.1,0';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_degradacao.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  if (activeView === 'charts' && results) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div />
          <button
            onClick={saveCurrentAnalysis}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            <span>Salvar Análise</span>
          </button>
        </div>
        <DegradationCharts
          results={results}
          data={data}
          onBack={() => setActiveView('input')}
          onViewReport={() => setActiveView('report')}
        />
      </div>
    );
  }

  if (activeView === 'report' && results) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div />
          <button
            onClick={saveCurrentAnalysis}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            <span>Salvar Análise</span>
          </button>
        </div>
        <DegradationReport
          results={results}
          data={data}
          onBack={() => setActiveView('charts')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-orange-100 p-2 rounded-lg">
            <TrendingDown className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-orange-900">
              🧬 Análise de Degradação (DA)
            </h2>
            <p className="text-orange-700">
              Análise preditiva baseada em medições de degradação ao longo do tempo
            </p>
          </div>
        </div>
        
        {equipmentName && (
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Equipamento em análise:</strong> {equipmentName}
            </p>
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Importar Dados de Degradação
        </h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Selecionar CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Template CSV</span>
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Formato: time, value (medição), status (0=ativo, 1=falhado)
        </p>
      </div>

      {/* Manual Entry Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Entrada Manual de Medições
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tempo
            </label>
            <input
              type="number"
              value={newEntry.time}
              onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: 1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Medido
            </label>
            <input
              type="number"
              step="any"
              value={newEntry.value}
              onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: 2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={newEntry.status}
              onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="0">Ativo (0)</option>
              <option value="1">Falhado (1)</option>
            </select>
          </div>
          <button
            onClick={addEntry}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Failure Limit Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">
            Limite Crítico de Falha
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="number"
              step="any"
              value={failureLimit}
              onChange={(e) => setFailureLimit(e.target.value)}
              className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ex: 5.0 (valor que define falha)"
            />
          </div>
          <div className="text-sm text-red-700">
            <p><strong>Limite:</strong> Valor crítico que define o ponto de falha</p>
            <p className="text-xs">Ex: espessura mínima, vibração máxima, etc.</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Medições Carregadas ({data.length} registros)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Medido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((point, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => removeEntry(index)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analysis Button */}
      {data.length > 0 && failureLimit && (
        <div className="flex justify-center">
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            <Activity className="w-5 h-5" />
            <span>{isLoading ? 'Calculando Degradação...' : 'Calcular Degradação'}</span>
          </button>
        </div>
      )}

      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">📊 Sobre a Análise de Degradação</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Modelos ajustados:</strong> Linear, Exponencial, Logarítmico e Potência</p>
          <p>• <strong>Resultado:</strong> Tempo estimado de falha baseado no limite crítico</p>
          <p>• <strong>Aplicações:</strong> Espessura de parede, vibração, temperatura, desgaste, etc.</p>
          <p>• <strong>Saída:</strong> Curvas de degradação, confiabilidade e relatórios completos</p>
        </div>
      </div>
    </div>
  );
};

export default DegradationAnalysis;