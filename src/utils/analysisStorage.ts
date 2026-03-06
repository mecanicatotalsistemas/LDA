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

export const saveDegradationAnalysisDetailed = async (
  title: string,
  equipmentName: string,
  failureLimit: number,
  dataPoints: any[],
  results: any,
  notes?: string
) => {
  try {
    const { data: session } = await supabase.auth.getSession();

    if (!session.session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: savedAnalysis, error } = await supabase
      .from('degradation_analyses')
      .insert({
        user_id: session.session.user.id,
        title,
        equipment_name: equipmentName,
        failure_limit: failureLimit,
        data_points: dataPoints,
        models: results.models,
        best_model: results.bestModel,
        estimated_failure_time: results.estimatedFailureTime,
        r_squared: results.models[results.bestModel]?.rSquared || 0,
        projected_data: results.projectedData,
        data_stats: results.dataStats,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: savedAnalysis };
  } catch (error: any) {
    console.error('Erro ao salvar análise de degradação:', error);
    return { success: false, error: error.message };
  }
};

export const loadDegradationAnalyses = async () => {
  try {
    const { data, error } = await supabase
      .from('degradation_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao carregar análises de degradação:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const deleteDegradationAnalysis = async (id: string) => {
  try {
    const { error } = await supabase
      .from('degradation_analyses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar análise de degradação:', error);
    return { success: false, error: error.message };
  }
};

export const saveEquipmentConfiguration = async (
  equipmentName: string,
  equipmentType: string,
  defaultFailureLimit?: number,
  defaultParameters?: any
) => {
  try {
    const { data: session } = await supabase.auth.getSession();

    if (!session.session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: savedConfig, error } = await supabase
      .from('equipment_configurations')
      .upsert({
        user_id: session.session.user.id,
        equipment_name: equipmentName,
        equipment_type: equipmentType,
        default_failure_limit: defaultFailureLimit,
        default_parameters: defaultParameters || {},
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: savedConfig };
  } catch (error: any) {
    console.error('Erro ao salvar configuração de equipamento:', error);
    return { success: false, error: error.message };
  }
};

export const loadEquipmentConfigurations = async () => {
  try {
    const { data, error } = await supabase
      .from('equipment_configurations')
      .select('*')
      .order('equipment_name');

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao carregar configurações de equipamentos:', error);
    return { success: false, error: error.message, data: [] };
  }
};
