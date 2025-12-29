import React, { useState, useCallback } from 'react';
import { Upload, Calculator, BarChart3, FileText, Database, TrendingUp, RefreshCw, MessageCircle, TrendingDown, AlertTriangle } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import DataInput from './components/DataInput';
import DistributionAnalysis from './components/DistributionAnalysis';
import Charts from './components/Charts';
import Report from './components/Report';
import CalculatorTab from './components/CalculatorTab';
import LDAChat from './components/LDAChat';
import DegradationAnalysis from './components/DegradationAnalysis';
import FailureProbabilityChart from './components/FailureProbabilityChart';
import { DataPoint, DistributionResult, AnalysisResults } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('data');
  const [data, setData] = useState<DataPoint[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [selectedDistribution, setSelectedDistribution] = useState<string>('weibull2');
  const [isLoading, setIsLoading] = useState(false);
  const [equipmentName, setEquipmentName] = useState<string>('');

  const handleDataChange = useCallback((newData: DataPoint[]) => {
    setData(newData);
    setAnalysisResults(null);
  }, []);

  const handleAnalysisComplete = useCallback((results: AnalysisResults) => {
    setAnalysisResults(results);
    setActiveTab('charts');
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setData([]);
    setAnalysisResults(null);
    setEquipmentName('');
    setSelectedDistribution('weibull2');
    setActiveTab('data');
  }, []);
  const tabs = [
    { id: 'data', label: 'Dados', icon: Database },
    { id: 'distribution', label: 'Distribuição', icon: TrendingUp },
    { id: 'charts', label: 'Gráficos', icon: BarChart3 },
    { id: 'report', label: 'Relatório', icon: FileText },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'degradation', label: 'Degradação (DA)', icon: TrendingDown },
    { id: 'failure-curve', label: 'Curva de Falha', icon: AlertTriangle },
    { id: 'chat', label: 'LDAChat', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Equipment Name and New Analysis Section */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Equipamento
              </label>
              <input
                type="text"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Bomba Centrífuga 001, Motor Elétrico A1, etc."
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleNewAnalysis}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Nova Análise</span>
              </button>
            </div>
          </div>
          {equipmentName && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Equipamento em análise:</strong> {equipmentName}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'data' && (
              <DataInput 
                data={data} 
                onDataChange={handleDataChange}
                onAnalysisComplete={handleAnalysisComplete}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
                equipmentName={equipmentName}
              />
            )}
            
            {activeTab === 'distribution' && (
              <DistributionAnalysis 
                analysisResults={analysisResults}
                selectedDistribution={selectedDistribution}
                onDistributionChange={setSelectedDistribution}
                data={data}
              />
            )}
            
            {activeTab === 'charts' && (
              <Charts 
                data={data}
                analysisResults={analysisResults}
                selectedDistribution={selectedDistribution}
              />
            )}
            
            {activeTab === 'report' && (
              <Report 
                data={data}
                analysisResults={analysisResults}
                selectedDistribution={selectedDistribution}
              />
            )}
            
            {activeTab === 'calculator' && (
              <CalculatorTab 
                analysisResults={analysisResults}
                selectedDistribution={selectedDistribution}
              />
            )}
            
            {activeTab === 'degradation' && (
              <DegradationAnalysis
                equipmentName={equipmentName}
              />
            )}

            {activeTab === 'failure-curve' && (
              <FailureProbabilityChart />
            )}

            {activeTab === 'chat' && (
              <LDAChat
                analysisResults={analysisResults}
                selectedDistribution={selectedDistribution}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;