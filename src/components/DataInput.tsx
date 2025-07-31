import React, { useState, useCallback } from 'react';
import { Upload, Plus, Trash2, Play, Download } from 'lucide-react';
import { DataPoint, AnalysisResults } from '../types';
import { performLDA } from '../utils/calculations';

interface DataInputProps {
  data: DataPoint[];
  onDataChange: (data: DataPoint[]) => void;
  onAnalysisComplete: (results: AnalysisResults) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  equipmentName: string;
}

const DataInput: React.FC<DataInputProps> = ({
  data,
  onDataChange,
  onAnalysisComplete,
  setIsLoading,
  isLoading,
  equipmentName
}) => {
  const [newEntry, setNewEntry] = useState({ time: '', status: '1', group: '' });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const timeIndex = headers.findIndex(h => h.includes('time') || h.includes('tempo'));
      const statusIndex = headers.findIndex(h => h.includes('status') || h.includes('falha') || h.includes('censura'));
      const groupIndex = headers.findIndex(h => h.includes('group') || h.includes('grupo'));

      if (timeIndex === -1 || statusIndex === -1) {
        alert('Arquivo deve conter colunas "time" e "status"');
        return;
      }

      const parsedData: DataPoint[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const time = parseFloat(values[timeIndex]);
        const status = parseInt(values[statusIndex]);
        
        if (!isNaN(time) && !isNaN(status)) {
          parsedData.push({
            time,
            status,
            group: groupIndex >= 0 ? values[groupIndex] : undefined
          });
        }
      }

      onDataChange(parsedData);
    };
    reader.readAsText(file);
  }, [onDataChange]);

  const addEntry = useCallback(() => {
    const time = parseFloat(newEntry.time);
    const status = parseInt(newEntry.status);
    
    if (isNaN(time) || time <= 0) {
      alert('Tempo deve ser um número positivo');
      return;
    }
    
    if (![0, 1].includes(status)) {
      alert('Status deve ser 0 (censurado) ou 1 (falha)');
      return;
    }

    const entry: DataPoint = {
      time,
      status,
      group: newEntry.group || undefined
    };

    onDataChange([...data, entry]);
    setNewEntry({ time: '', status: '1', group: '' });
  }, [data, newEntry, onDataChange]);

  const removeEntry = useCallback((index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onDataChange(newData);
  }, [data, onDataChange]);

  const runAnalysis = useCallback(async () => {
    if (data.length < 3) {
      alert('São necessários pelo menos 3 pontos de dados para análise');
      return;
    }

    setIsLoading(true);
    try {
      const results = await performLDA(data);
      results.equipmentName = equipmentName;
      onAnalysisComplete(results);
    } catch (error) {
      console.error('Erro na análise:', error);
      alert('Erro ao realizar análise. Verifique os dados.');
    } finally {
      setIsLoading(false);
    }
  }, [data, setIsLoading, onAnalysisComplete]);

  const downloadTemplate = useCallback(() => {
    const csvContent = 'time,status,group\n100,1,A\n150,1,A\n200,0,A\n250,1,B\n300,1,B';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_lda.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Importar Dados
        </h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
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
          Formato: time, status (1=falha, 0=censurado), group (opcional)
        </p>
      </div>

      {/* Manual Entry Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Entrada Manual
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={newEntry.status}
              onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Falha (1)</option>
              <option value="0">Censurado (0)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo (opcional)
            </label>
            <input
              type="text"
              value={newEntry.group}
              onChange={(e) => setNewEntry({ ...newEntry, group: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: A"
            />
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

      {/* Data Table */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Dados Carregados ({data.length} registros)
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupo
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
      {data.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            <Play className="w-5 h-5" />
            <span>{isLoading ? 'Calculando...' : 'Calcular LDA'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DataInput;