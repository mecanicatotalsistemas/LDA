import React, { useState } from 'react';
import { Download, FileText, Table, Database, Loader2 } from 'lucide-react';
import { DataPoint, AnalysisResults } from '../types';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';

interface ExportButtonsProps {
  data: DataPoint[];
  analysisResults: AnalysisResults;
  selectedDistribution: string;
  equipmentName: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  analysisResults,
  selectedDistribution,
  equipmentName
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setIsExporting('pdf');
    try {
      await exportToPDF(data, analysisResults, selectedDistribution, equipmentName);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = () => {
    setIsExporting('excel');
    try {
      exportToExcel(data, analysisResults, selectedDistribution, equipmentName);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao gerar Excel. Tente novamente.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportCSV = () => {
    setIsExporting('csv');
    try {
      exportToCSV(data, analysisResults, selectedDistribution, equipmentName);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao gerar CSV. Tente novamente.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Download className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-blue-900">
          Exportar Relatório Completo
        </h3>
      </div>
      
      <p className="text-blue-800 mb-6">
        Baixe o relatório completo com todos os dados, gráficos e análises em diferentes formatos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PDF Export */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting === 'pdf'}
          className="flex items-center justify-center space-x-3 bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isExporting === 'pdf' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
          <div className="text-left">
            <div className="font-semibold">Exportar PDF</div>
            <div className="text-xs opacity-90">Relatório completo com gráficos</div>
          </div>
        </button>

        {/* Excel Export */}
        <button
          onClick={handleExportExcel}
          disabled={isExporting === 'excel'}
          className="flex items-center justify-center space-x-3 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isExporting === 'excel' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Table className="w-5 h-5" />
          )}
          <div className="text-left">
            <div className="font-semibold">Exportar Excel</div>
            <div className="text-xs opacity-90">Dados organizados em abas</div>
          </div>
        </button>

        {/* CSV Export */}
        <button
          onClick={handleExportCSV}
          disabled={isExporting === 'csv'}
          className="flex items-center justify-center space-x-3 bg-gray-600 text-white px-6 py-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isExporting === 'csv' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Database className="w-5 h-5" />
          )}
          <div className="text-left">
            <div className="font-semibold">Exportar CSV</div>
            <div className="text-xs opacity-90">Dados resumidos estruturados</div>
          </div>
        </button>
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-2">📋 Conteúdo dos Relatórios:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong className="text-red-600">PDF:</strong>
            <ul className="text-gray-600 mt-1 space-y-1">
              <li>• Resumo executivo</li>
              <li>• Gráficos incorporados</li>
              <li>• Parâmetros detalhados</li>
              <li>• Comparação de distribuições</li>
            </ul>
          </div>
          <div>
            <strong className="text-green-600">Excel:</strong>
            <ul className="text-gray-600 mt-1 space-y-1">
              <li>• Aba "Dados de Entrada"</li>
              <li>• Aba "Parâmetros"</li>
              <li>• Aba "Funções R(t), F(t), λ(t)"</li>
              <li>• Aba "Resumo"</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-600">CSV:</strong>
            <ul className="text-gray-600 mt-1 space-y-1">
              <li>• Dados estruturados</li>
              <li>• Parâmetros resumidos</li>
              <li>• Métricas principais</li>
              <li>• Comparação de modelos</li>
            </ul>
          </div>
        </div>
      </div>

      {equipmentName && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Equipamento:</strong> {equipmentName} - 
            Os arquivos serão nomeados automaticamente com o nome do equipamento e data.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExportButtons;