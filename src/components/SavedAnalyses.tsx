import { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Calendar, FileText, X } from 'lucide-react';
import {
  getAnalyses,
  deleteAnalysis,
  Analysis,
  AnalysisType,
} from '../utils/analysisStorage';

interface SavedAnalysesProps {
  analysisType?: AnalysisType;
  onLoadAnalysis: (analysis: Analysis) => void;
  onClose?: () => void;
}

export default function SavedAnalyses({ analysisType, onLoadAnalysis, onClose }: SavedAnalysesProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, [analysisType]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyses(analysisType);
      setAnalyses(data);
    } catch (err) {
      setError('Erro ao carregar análises');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta análise?')) {
      return;
    }

    try {
      await deleteAnalysis(id);
      setAnalyses(analyses.filter(a => a.id !== id));
    } catch (err) {
      alert('Erro ao deletar análise');
      console.error(err);
    }
  };

  const handleLoad = (analysis: Analysis) => {
    onLoadAnalysis(analysis);
    if (onClose) onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      degradation: 'Análise de Degradação',
      distribution: 'Análise de Distribuição',
      calculator: 'Calculadora',
    };
    return labels[type as AnalysisType] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="text-green-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Análises Salvas</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fechar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="text-center py-12">
          <Save className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Nenhuma análise salva ainda</p>
          <p className="text-sm text-gray-400 mt-2">
            As análises salvas aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {analysis.title}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <FileText size={16} />
                      <span>{getAnalysisTypeLabel(analysis.analysis_type)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{formatDate(analysis.created_at)}</span>
                    </div>
                  </div>

                  {analysis.notes && (
                    <p className="text-sm text-gray-600 mb-3 italic">
                      {analysis.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleLoad(analysis)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    title="Carregar análise"
                  >
                    <FolderOpen size={16} />
                    Carregar
                  </button>
                  <button
                    onClick={() => handleDelete(analysis.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    title="Deletar análise"
                  >
                    <Trash2 size={16} />
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
