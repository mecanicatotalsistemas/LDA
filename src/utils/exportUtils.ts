import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DataPoint, AnalysisResults, DegradationResults, DegradationPoint } from '../types';

// Utility function to capture chart as image
export const captureChartAsImage = async (elementId: string): Promise<string> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true
  });
  
  return canvas.toDataURL('image/png');
};

// Generate PDF Report
export const exportToPDF = async (
  data: DataPoint[],
  analysisResults: AnalysisResults,
  selectedDistribution: string,
  equipmentName: string
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório de Análise de Confiabilidade - LDA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  if (equipmentName) {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 100, 200);
    pdf.text(`Equipamento: ${equipmentName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // Executive Summary
  checkPageBreak(40);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumo Executivo', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const bestDist = analysisResults.distributions[analysisResults.bestDistribution as keyof typeof analysisResults.distributions];
  pdf.text(`Distribuição Recomendada: ${bestDist.name}`, 20, yPosition);
  yPosition += 7;
  pdf.text(`MTTF (Tempo Médio até Falha): ${bestDist.mttf.toFixed(2)} unidades`, 20, yPosition);
  yPosition += 7;
  pdf.text(`Total de Amostras: ${analysisResults.dataStats.totalSamples}`, 20, yPosition);
  yPosition += 7;
  pdf.text(`Falhas Observadas: ${analysisResults.dataStats.failures}`, 20, yPosition);
  yPosition += 15;

  // Data Statistics
  checkPageBreak(50);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Estatísticas dos Dados', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Dados Censurados: ${analysisResults.dataStats.censored}`, 20, yPosition);
  yPosition += 7;
  pdf.text(`Tempo Mínimo: ${analysisResults.dataStats.minTime.toFixed(2)}`, 20, yPosition);
  yPosition += 7;
  pdf.text(`Tempo Máximo: ${analysisResults.dataStats.maxTime.toFixed(2)}`, 20, yPosition);
  yPosition += 7;
  pdf.text(`Tempo Médio: ${analysisResults.dataStats.meanTime.toFixed(2)}`, 20, yPosition);
  yPosition += 15;

  // Selected Distribution Analysis
  checkPageBreak(60);
  const currentDist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Análise da Distribuição: ${currentDist.name}`, 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  // Parameters
  pdf.setFont('helvetica', 'bold');
  pdf.text('Parâmetros Estimados:', 20, yPosition);
  yPosition += 7;
  pdf.setFont('helvetica', 'normal');
  
  Object.entries(currentDist.parameters).forEach(([param, value]) => {
    pdf.text(`${param}: ${value.toFixed(6)}`, 25, yPosition);
    yPosition += 6;
  });
  yPosition += 5;

  // Reliability Metrics
  pdf.setFont('helvetica', 'bold');
  pdf.text('Métricas de Confiabilidade:', 20, yPosition);
  yPosition += 7;
  pdf.setFont('helvetica', 'normal');
  
  pdf.text(`MTTF: ${currentDist.mttf.toFixed(2)}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`B10: ${currentDist.b10.toFixed(2)}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`B50: ${currentDist.b50.toFixed(2)}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`B90: ${currentDist.b90.toFixed(2)}`, 25, yPosition);
  yPosition += 10;

  // Model Fit Statistics
  pdf.setFont('helvetica', 'bold');
  pdf.text('Qualidade do Ajuste:', 20, yPosition);
  yPosition += 7;
  pdf.setFont('helvetica', 'normal');
  
  pdf.text(`Log-Likelihood: ${currentDist.logLikelihood.toFixed(4)}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`AIC: ${currentDist.aic.toFixed(4)}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`BIC: ${currentDist.bic.toFixed(4)}`, 25, yPosition);
  yPosition += 15;

  // Try to capture and add charts
  try {
    const chartIds = ['reliability-chart', 'failure-chart', 'hazard-chart', 'pdf-chart'];
    const chartTitles = [
      'Função de Confiabilidade R(t)',
      'Função de Falha F(t)',
      'Taxa de Falha λ(t)',
      'Função Densidade de Probabilidade f(t)'
    ];

    for (let i = 0; i < chartIds.length; i++) {
      const chartElement = document.getElementById(chartIds[i]);
      if (chartElement) {
        checkPageBreak(80);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(chartTitles[i], 20, yPosition);
        yPosition += 10;

        try {
          const chartImage = await captureChartAsImage(chartIds[i]);
          const imgWidth = 170;
          const imgHeight = 100;
          
          checkPageBreak(imgHeight + 10);
          pdf.addImage(chartImage, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (error) {
          console.warn(`Could not capture chart ${chartIds[i]}:`, error);
          pdf.setFont('helvetica', 'normal');
          pdf.text('(Gráfico não disponível para exportação)', 25, yPosition);
          yPosition += 10;
        }
      }
    }
  } catch (error) {
    console.warn('Error capturing charts:', error);
  }

  // Distribution Comparison Table
  pdf.addPage();
  yPosition = 20;
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Comparação de Distribuições', 20, yPosition);
  yPosition += 15;

  // Table headers
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Distribuição', 20, yPosition);
  pdf.text('AIC', 80, yPosition);
  pdf.text('BIC', 110, yPosition);
  pdf.text('MTTF', 140, yPosition);
  pdf.text('B50', 170, yPosition);
  yPosition += 7;

  // Table data
  pdf.setFont('helvetica', 'normal');
  Object.entries(analysisResults.distributions).forEach(([key, dist]) => {
    if (key === analysisResults.bestDistribution) {
      pdf.setFont('helvetica', 'bold');
    }
    
    pdf.text(dist.name, 20, yPosition);
    pdf.text(dist.aic.toFixed(2), 80, yPosition);
    pdf.text(dist.bic.toFixed(2), 110, yPosition);
    pdf.text(dist.mttf.toFixed(2), 140, yPosition);
    pdf.text(dist.b50.toFixed(2), 170, yPosition);
    yPosition += 6;
    
    pdf.setFont('helvetica', 'normal');
  });

  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Relatório gerado pela ferramenta Life Data Analysis - Mecânica Total®', 
           pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save PDF
  pdf.save(`Relatorio_LDA_${equipmentName || 'Analise'}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Generate Excel Report
export const exportToExcel = (
  data: DataPoint[],
  analysisResults: AnalysisResults,
  selectedDistribution: string,
  equipmentName: string
): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Input Data
  const dataSheet = data.map((point, index) => ({
    'Índice': index + 1,
    'Tempo': point.time,
    'Status': point.status === 1 ? 'Falha' : 'Censurado',
    'Grupo': point.group || '-'
  }));
  
  const ws1 = XLSX.utils.json_to_sheet(dataSheet);
  XLSX.utils.book_append_sheet(wb, ws1, 'Dados de Entrada');

  // Sheet 2: Distribution Parameters
  const parameterData: any[] = [];
  Object.entries(analysisResults.distributions).forEach(([key, dist]) => {
    const row: any = {
      'Distribuição': dist.name,
      'Recomendada': key === analysisResults.bestDistribution ? 'SIM' : 'NÃO',
      'AIC': dist.aic,
      'BIC': dist.bic,
      'Log-Likelihood': dist.logLikelihood,
      'MTTF': dist.mttf,
      'B10': dist.b10,
      'B50': dist.b50,
      'B90': dist.b90
    };
    
    // Add parameters
    Object.entries(dist.parameters).forEach(([param, value]) => {
      row[param] = value;
    });
    
    parameterData.push(row);
  });
  
  const ws2 = XLSX.utils.json_to_sheet(parameterData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Parâmetros');

  // Sheet 3: Reliability Functions at different times
  const currentDist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];
  const maxTime = Math.max(...data.map(d => d.time));
  const timePoints = Array.from({ length: 21 }, (_, i) => (i * maxTime) / 20);
  
  const reliabilityData = timePoints.map(t => ({
    'Tempo': t.toFixed(2),
    'R(t) - Confiabilidade': (currentDist.reliability(t) * 100).toFixed(4) + '%',
    'F(t) - Falha': (currentDist.failure(t) * 100).toFixed(4) + '%',
    'λ(t) - Taxa de Falha': currentDist.hazard(t).toExponential(4),
    'f(t) - Densidade': currentDist.pdf(t).toExponential(4)
  }));
  
  const ws3 = XLSX.utils.json_to_sheet(reliabilityData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Funções de Confiabilidade');

  // Sheet 4: Summary
  const summaryData = [
    { 'Métrica': 'Equipamento', 'Valor': equipmentName || 'Não especificado' },
    { 'Métrica': 'Data da Análise', 'Valor': new Date().toLocaleString('pt-BR') },
    { 'Métrica': 'Distribuição Recomendada', 'Valor': analysisResults.distributions[analysisResults.bestDistribution as keyof typeof analysisResults.distributions].name },
    { 'Métrica': 'Total de Amostras', 'Valor': analysisResults.dataStats.totalSamples },
    { 'Métrica': 'Falhas Observadas', 'Valor': analysisResults.dataStats.failures },
    { 'Métrica': 'Dados Censurados', 'Valor': analysisResults.dataStats.censored },
    { 'Métrica': 'Tempo Médio', 'Valor': analysisResults.dataStats.meanTime.toFixed(2) },
    { 'Métrica': 'MTTF da Distribuição Selecionada', 'Valor': currentDist.mttf.toFixed(2) }
  ];
  
  const ws4 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws4, 'Resumo');

  // Save Excel file
  XLSX.writeFile(wb, `Relatorio_LDA_${equipmentName || 'Analise'}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Generate Excel Report for Degradation Analysis
export const exportDegradationToExcel = (
  data: DegradationPoint[],
  results: DegradationResults,
  equipmentName: string
): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Input Data
  const dataSheet = data.map((point, index) => ({
    'Índice': index + 1,
    'Tempo': point.time,
    'Valor Medido': point.value,
    'Status': point.status === 1 ? 'Falhado' : 'Ativo'
  }));
  
  const ws1 = XLSX.utils.json_to_sheet(dataSheet);
  XLSX.utils.book_append_sheet(wb, ws1, 'Dados de Degradação');

  // Sheet 2: Model Parameters
  const modelData: any[] = [];
  Object.entries(results.models).forEach(([key, model]) => {
    const row: any = {
      'Modelo': model.name,
      'Recomendado': key === results.bestModel ? 'SIM' : 'NÃO',
      'R²': model.rSquared,
      'Tempo de Falha': isFinite(model.timeToFailure(results.failureLimit)) 
        ? model.timeToFailure(results.failureLimit) 
        : 'N/A'
    };
    
    // Add parameters
    Object.entries(model.parameters).forEach(([param, value]) => {
      row[param] = value;
    });
    
    modelData.push(row);
  });
  
  const ws2 = XLSX.utils.json_to_sheet(modelData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Modelos');

  // Sheet 3: Projected Data
  const projectedSheet = results.projectedData.map((point, index) => ({
    'Índice': index + 1,
    'Tempo': point.time,
    'Valor Projetado': point.value
  }));
  
  const ws3 = XLSX.utils.json_to_sheet(projectedSheet);
  XLSX.utils.book_append_sheet(wb, ws3, 'Projeção');

  // Sheet 4: Summary
  const summaryData = [
    { 'Métrica': 'Equipamento', 'Valor': equipmentName || 'Não especificado' },
    { 'Métrica': 'Data da Análise', 'Valor': new Date().toLocaleString('pt-BR') },
    { 'Métrica': 'Modelo Recomendado', 'Valor': results.models[results.bestModel as keyof typeof results.models].name },
    { 'Métrica': 'Limite de Falha', 'Valor': results.failureLimit },
    { 'Métrica': 'Tempo Estimado de Falha', 'Valor': isFinite(results.estimatedFailureTime) ? results.estimatedFailureTime.toFixed(2) : 'N/A' },
    { 'Métrica': 'Total de Medições', 'Valor': results.dataStats.totalMeasurements },
    { 'Métrica': 'Período Analisado', 'Valor': results.dataStats.timeSpan.toFixed(2) },
    { 'Métrica': 'Taxa de Degradação', 'Valor': results.dataStats.degradationRate.toFixed(4) },
    { 'Métrica': 'Valor Atual', 'Valor': results.dataStats.currentValue.toFixed(2) }
  ];
  
  const ws4 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws4, 'Resumo');

  // Save Excel file
  XLSX.writeFile(wb, `Relatorio_Degradacao_${equipmentName || 'Analise'}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
// Generate CSV Report
export const exportToCSV = (
  data: DataPoint[],
  analysisResults: AnalysisResults,
  selectedDistribution: string,
  equipmentName: string
): void => {
  const currentDist = analysisResults.distributions[selectedDistribution as keyof typeof analysisResults.distributions];
  
  // Create comprehensive CSV data
  const csvData = [
    ['RELATÓRIO DE ANÁLISE DE CONFIABILIDADE - LDA'],
    [''],
    ['INFORMAÇÕES GERAIS'],
    ['Equipamento', equipmentName || 'Não especificado'],
    ['Data da Análise', new Date().toLocaleString('pt-BR')],
    ['Distribuição Selecionada', currentDist.name],
    ['Distribuição Recomendada', analysisResults.distributions[analysisResults.bestDistribution as keyof typeof analysisResults.distributions].name],
    [''],
    ['ESTATÍSTICAS DOS DADOS'],
    ['Total de Amostras', analysisResults.dataStats.totalSamples],
    ['Falhas Observadas', analysisResults.dataStats.failures],
    ['Dados Censurados', analysisResults.dataStats.censored],
    ['Tempo Mínimo', analysisResults.dataStats.minTime.toFixed(2)],
    ['Tempo Máximo', analysisResults.dataStats.maxTime.toFixed(2)],
    ['Tempo Médio', analysisResults.dataStats.meanTime.toFixed(2)],
    [''],
    ['PARÂMETROS DA DISTRIBUIÇÃO SELECIONADA'],
    ...Object.entries(currentDist.parameters).map(([param, value]) => [param, value.toFixed(6)]),
    [''],
    ['MÉTRICAS DE CONFIABILIDADE'],
    ['MTTF', currentDist.mttf.toFixed(2)],
    ['B10', currentDist.b10.toFixed(2)],
    ['B50', currentDist.b50.toFixed(2)],
    ['B90', currentDist.b90.toFixed(2)],
    [''],
    ['QUALIDADE DO AJUSTE'],
    ['Log-Likelihood', currentDist.logLikelihood.toFixed(4)],
    ['AIC', currentDist.aic.toFixed(4)],
    ['BIC', currentDist.bic.toFixed(4)],
    [''],
    ['COMPARAÇÃO DE DISTRIBUIÇÕES'],
    ['Distribuição', 'AIC', 'BIC', 'MTTF', 'B50'],
    ...Object.entries(analysisResults.distributions).map(([key, dist]) => [
      dist.name,
      dist.aic.toFixed(2),
      dist.bic.toFixed(2),
      dist.mttf.toFixed(2),
      dist.b50.toFixed(2)
    ]),
    [''],
    ['DADOS DE ENTRADA'],
    ['Índice', 'Tempo', 'Status', 'Grupo'],
    ...data.map((point, index) => [
      index + 1,
      point.time,
      point.status === 1 ? 'Falha' : 'Censurado',
      point.group || '-'
    ])
  ];

  // Convert to CSV string
  const csvContent = csvData.map(row => 
    row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')
  ).join('\n');

  // Create and download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `Relatorio_LDA_${equipmentName || 'Analise'}_${new Date().toISOString().split('T')[0]}.csv`);
};