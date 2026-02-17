import { supabase } from '../lib/supabase';
import { AnalysisResults, DataPoint } from '../types';

export interface SaveAnalysisData {
  title: string;
  analysisType: 'degradation' | 'distribution' | 'calculator';
  inputData: any;
  resultsData: any;
  notes?: string;
}

export const saveAnalysis = async (data: SaveAnalysisData) => {
  try {
    const { data: session } = await supabase.auth.getSession();

    if (!session.session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: savedAnalysis, error } = await supabase
      .from('analyses')
      .insert({
        user_id: session.session.user.id,
        title: data.title,
        analysis_type: data.analysisType,
        input_data: data.inputData,
        results_data: data.resultsData,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: savedAnalysis };
  } catch (error: any) {
    console.error('Erro ao salvar análise:', error);
    return { success: false, error: error.message };
  }
};

export const updateAnalysis = async (id: string, data: Partial<SaveAnalysisData>) => {
  try {
    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.analysisType) updateData.analysis_type = data.analysisType;
    if (data.inputData) updateData.input_data = data.inputData;
    if (data.resultsData) updateData.results_data = data.resultsData;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: updatedAnalysis, error } = await supabase
      .from('analyses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: updatedAnalysis };
  } catch (error: any) {
    console.error('Erro ao atualizar análise:', error);
    return { success: false, error: error.message };
  }
};

export const loadAnalyses = async () => {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao carregar análises:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const deleteAnalysis = async (id: string) => {
  try {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar análise:', error);
    return { success: false, error: error.message };
  }
};

export const saveDistributionAnalysis = async (
  title: string,
  data: DataPoint[],
  results: AnalysisResults,
  selectedDistribution: string,
  equipmentName?: string,
  notes?: string
) => {
  return saveAnalysis({
    title: title || `Análise ${equipmentName || 'sem nome'} - ${new Date().toLocaleDateString()}`,
    analysisType: 'distribution',
    inputData: {
      data,
      selectedDistribution,
      equipmentName,
    },
    resultsData: results,
    notes,
  });
};

export const saveDegradationAnalysis = async (
  title: string,
  inputData: any,
  resultsData: any,
  notes?: string
) => {
  return saveAnalysis({
    title,
    analysisType: 'degradation',
    inputData,
    resultsData,
    notes,
  });
};
