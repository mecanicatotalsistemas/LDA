import { supabase } from '../lib/supabase';

export type AnalysisType = 'degradation' | 'distribution' | 'calculator';

export interface Analysis {
  id: string;
  user_id: string;
  title: string;
  analysis_type: AnalysisType;
  input_data: Record<string, any>;
  results_data: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveAnalysisParams {
  title: string;
  analysisType: AnalysisType;
  inputData: Record<string, any>;
  resultsData: Record<string, any>;
  notes?: string;
}

export interface UpdateAnalysisParams {
  id: string;
  title?: string;
  inputData?: Record<string, any>;
  resultsData?: Record<string, any>;
  notes?: string;
}

export async function saveAnalysis(params: SaveAnalysisParams): Promise<Analysis | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      title: params.title,
      analysis_type: params.analysisType,
      input_data: params.inputData,
      results_data: params.resultsData,
      notes: params.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar análise:', error);
    throw error;
  }

  return data;
}

export async function updateAnalysis(params: UpdateAnalysisParams): Promise<Analysis | null> {
  const updateData: any = {};

  if (params.title !== undefined) updateData.title = params.title;
  if (params.inputData !== undefined) updateData.input_data = params.inputData;
  if (params.resultsData !== undefined) updateData.results_data = params.resultsData;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('analyses')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar análise:', error);
    throw error;
  }

  return data;
}

export async function getAnalyses(type?: AnalysisType): Promise<Analysis[]> {
  let query = supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('analysis_type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar análises:', error);
    throw error;
  }

  return data || [];
}

export async function getAnalysisById(id: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar análise:', error);
    throw error;
  }

  return data;
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar análise:', error);
    throw error;
  }

  return true;
}

export async function getAnalysesCount(type?: AnalysisType): Promise<number> {
  let query = supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true });

  if (type) {
    query = query.eq('analysis_type', type);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Erro ao contar análises:', error);
    return 0;
  }

  return count || 0;
}
