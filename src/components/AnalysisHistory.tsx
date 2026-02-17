import React, { useState, useEffect } from 'react';
import { History, Trash2, Eye, Calendar, FileText, TrendingDown, BarChart3, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Analysis {
  id: string;
  title: string;
  analysis_type: string;
  input_data: any;
  results_data: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalysisHistoryProps {
  onLoadAnalysis?: (analysis: Analysis) => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ onLoadAnalysis }) => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAnalyses();
    }
  }, [user]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAnalyses(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar análises:', err);
      setError(err.message || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta análise?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('analyses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAnalyses(analyses.filter(a => a.id !== id));
    } catch (err: any) {
      console.error('Erro ao excluir análise:', err);
      alert('Erro ao excluir análise: ' + err.message);
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'degradation':
        return TrendingDown;
      case 'distribution':
        return BarChart3;
      case 'calculator':
        return Calculator;
      default:
        return FileText;
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'degradation':
        return 'Análise de Degradação';
      case 'distribution':
        return 'Análise de Distribuição';
      case 'calculator':
        return 'Calculadora';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro: {error}</p>
        <button
          onClick={loadAnalyses}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhuma análise encontrada
        </h3>
        <p className="text-gray-500">
          Suas análises salvas aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <History className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Histórico de Análises
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {analyses.length} {analyses.length === 1 ? 'análise' : 'análises'}
        </p>
      </div>

      <div className="grid gap-4">
        {analyses.map((analysis) => {
          const Icon = getAnalysisIcon(analysis.analysis_type);

          return (
            <div
              key={analysis.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {analysis.title}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {getAnalysisTypeLabel(analysis.analysis_type)}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(analysis.created_at)}
                      </span>
                    </div>

                    {analysis.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {analysis.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {onLoadAnalysis && (
                    <button
                      onClick={() => onLoadAnalysis(analysis)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Carregar análise"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteAnalysis(analysis.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir análise"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisHistory;
