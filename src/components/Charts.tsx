import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Activity, Zap, Target, Maximize2, Minimize2, X } from 'lucide-react';
import { DataPoint, AnalysisResults } from '../types';

interface ChartsProps {
  data: DataPoint[];
  analysisResults: AnalysisResults | null;
  selectedDistribution: string;
}

const Charts: React.FC<ChartsProps> = ({
  data,
  analysisResults,
  selectedDistribution: globalSelectedDistribution
}) => {
  const [localSelectedDistribution, setLocalSelectedDistribution] = useState(globalSelectedDistribution);
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<number>(0); // 0 = auto, otherwise custom max time
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  // Update local state when global selection changes
  React.useEffect(() => {
    setLocalSelectedDistribution(globalSelectedDistribution);
  }, [globalSelectedDistribution]);

  const chartData = useMemo(() => {
    if (!analysisResults || data.length === 0) return null;

    const dist = analysisResults.distributions[localSelectedDistribution as keyof typeof analysisResults.distributions];
    const dataMaxTime = Math.max(...data.map(d => d.time));
    const maxTime = timeWindow > 0 ? timeWindow : dataMaxTime * 1.2;
    const timePoints = Array.from({ length: 100 }, (_, i) => (i + 1) * maxTime / 100);

    return {
      timePoints,
      maxTime,
      dataMaxTime,
      reliability: timePoints.map(t => ({ x: t, y: dist.reliability(t) })),
      failure: timePoints.map(t => ({ x: t, y: dist.failure(t) })),
      hazard: timePoints.map(t => ({ x: t, y: dist.hazard(t) })),
      pdf: timePoints.map(t => ({ x: t, y: dist.pdf(t) }))
    };
  }, [data, analysisResults, localSelectedDistribution, timeWindow]);

  if (!analysisResults || !chartData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum Gráfico Disponível
        </h3>
        <p className="text-gray-600">
          Execute a análise para visualizar os gráficos de confiabilidade.
        </p>
      </div>
    );
  }

  const distributions = [
    { key: 'weibull2', name: 'Weibull 2P', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
    { key: 'weibull3', name: 'Weibull 3P', color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600' },
    { key: 'exponential', name: 'Exponencial', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
    { key: 'lognormal', name: 'Lognormal', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' },
    { key: 'normal', name: 'Normal', color: 'bg-pink-500', hoverColor: 'hover:bg-pink-600' }
  ];

  const SVGChart: React.FC<{
    title: string;
    data: { x: number; y: number }[];
    color: string;
    yLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    chartId: string;
    customYScale?: boolean;
    customXScale?: boolean;
  }> = ({ title, data, color, yLabel, icon: Icon, chartId }) => {
    const width = 700;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xMax = Math.max(...data.map(d => d.x));
    const yMax = Math.max(...data.map(d => d.y));
    const yMin = Math.min(...data.map(d => d.y));

    // Custom scales for reliability and failure charts
    const isReliabilityChart = chartId === 'reliability' || chartId === 'failure';
    const useCustomYScale = isReliabilityChart;
    const useCustomXScale = isReliabilityChart;

    const xScale = (x: number) => (x / xMax) * chartWidth;
    const yScale = useCustomYScale 
      ? (y: number) => {
          if (chartId === 'reliability') {
            return (1 - y) * chartHeight; // Reliability: 100% at top, 0% at bottom
          } else if (chartId === 'failure') {
            return (1 - y) * chartHeight; // Failure: 0% at bottom, 100% at top
          }
          return (1 - y) * chartHeight; // Default
        }
      : (y: number) => chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    const pathData = data
      .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(point.x)} ${yScale(point.y)}`)
      .join(' ');

    const isHovered = hoveredChart === chartId;

    // Handle mouse move for tooltip
    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - margin.left;
      const mouseY = event.clientY - rect.top - margin.top;
      
      if (mouseX >= 0 && mouseX <= chartWidth && mouseY >= 0 && mouseY <= chartHeight) {
        // Find closest data point
        const timeAtMouse = (mouseX / chartWidth) * xMax;
        const closestPoint = data.reduce((prev, curr) => 
          Math.abs(curr.x - timeAtMouse) < Math.abs(prev.x - timeAtMouse) ? curr : prev
        );
        
        // Format tooltip content based on chart type
        let content = '';
        if (chartId === 'reliability') {
          content = `Tempo: ${closestPoint.x.toFixed(1)}h\nConfiabilidade: ${(closestPoint.y * 100).toFixed(1)}%`;
        } else if (chartId === 'failure') {
          content = `Tempo: ${closestPoint.x.toFixed(1)}h\nProbabilidade de Falha: ${(closestPoint.y * 100).toFixed(1)}%`;
        } else if (chartId === 'hazard') {
          content = `Tempo: ${closestPoint.x.toFixed(1)}h\nTaxa de Falha: ${closestPoint.y.toExponential(3)}`;
        } else if (chartId === 'pdf') {
          content = `Tempo: ${closestPoint.x.toFixed(1)}h\nDensidade: ${closestPoint.y.toExponential(3)}`;
        }
        
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY - 10,
          content
        });
      }
    };

    const handleMouseLeave = () => {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
    };
    // Generate custom grid lines and labels
    const generateYGridLines = () => {
      if (useCustomYScale) {
        if (chartId === 'reliability') {
          // Reliability: 100% to 0% (decreasing)
          return Array.from({ length: 11 }, (_, i) => {
            const value = 1 - (i * 0.1); // Start from 1.0 (100%) and go down to 0.0 (0%)
            const y = margin.top + (i * chartHeight) / 10; // Top to bottom positioning
            return { y, value, label: `${(value * 100).toFixed(0)}%` };
          });
        } else if (chartId === 'failure') {
          // Failure: 0% to 100% (increasing) - FIXED
          return Array.from({ length: 11 }, (_, i) => {
            const value = i * 0.1; // Start from 0.0 (0%) and go up to 1.0 (100%)
            const y = margin.top + chartHeight - (i * chartHeight) / 10; // 0% at bottom, 100% at top
            return { y, value, label: `${(value * 100).toFixed(0)}%` };
          });
        }
        // Default fallback
        return Array.from({ length: 11 }, (_, i) => {
          const value = 1 - (i * 0.1);
          const y = margin.top + (i * chartHeight) / 10;
          return { y, value, label: `${(value * 100).toFixed(0)}%` };
        });
      } else {
        // Default 5 grid lines
        return Array.from({ length: 6 }, (_, i) => {
          const value = yMin + (i * (yMax - yMin)) / 5;
          const y = margin.top + (i * chartHeight) / 5;
          return { y, value, label: value.toFixed(3) };
        });
      }
    };

    const generateXGridLines = () => {
      // Smart increment based on time range
      let increment: number;
      if (xMax <= 100) {
        increment = 20; // 0-100h: 20h increments
      } else if (xMax <= 500) {
        increment = 50; // 100-500h: 50h increments
      } else {
        increment = 100; // >500h: 100h increments
      }
      
      const maxTime = Math.ceil(xMax / increment) * increment;
      const numLines = Math.floor(maxTime / increment) + 1;
      
      return Array.from({ length: numLines }, (_, i) => {
        const value = i * increment;
        const x = margin.left + (value / xMax) * chartWidth;
        return { x, value, label: `${value}h` };
      }).filter(item => item.value <= xMax * 1.1); // Show slightly beyond max for better visualization
    };

    const yGridLines = generateYGridLines();
    const xGridLines = generateXGridLines();
    
    const isFullscreen = fullscreenChart === chartId;
    const chartSize = isFullscreen ? { width: 1200, height: 700 } : { width: 700, height: 400 };
    const chartMargin = isFullscreen ? { top: 50, right: 50, bottom: 80, left: 100 } : margin;
    const finalChartWidth = chartSize.width - chartMargin.left - chartMargin.right;
    const finalChartHeight = chartSize.height - chartMargin.top - chartMargin.bottom;
    
    // Recalculate scales for fullscreen
    const finalXScale = (x: number) => (x / xMax) * finalChartWidth;
    const finalYScale = useCustomYScale 
      ? (y: number) => {
          if (chartId === 'reliability') {
            return (1 - y) * finalChartHeight; // Reliability: 100% at top, 0% at bottom
          } else if (chartId === 'failure') {
            return (1 - y) * finalChartHeight; // Failure: 0% at bottom, 100% at top
          }
          return (1 - y) * finalChartHeight; // Default
        }
      : (y: number) => finalChartHeight - ((y - yMin) / (yMax - yMin)) * finalChartHeight;

    const finalPathData = data
      .map((point, i) => `${i === 0 ? 'M' : 'L'} ${finalXScale(point.x)} ${finalYScale(point.y)}`)
      .join(' ');

    // Add unique ID for chart export
    const chartElementId = `${chartId}-chart`;

    return (
      <>
        <div 
          id={chartElementId}
          id={chartElementId}
          className={`bg-white rounded-xl border-2 transition-all duration-300 ${
            isHovered ? 'border-blue-300 shadow-xl scale-105' : 'border-gray-200 shadow-lg'
          } ${isFullscreen ? 'hidden' : ''}`}
          onMouseEnter={() => setHoveredChart(chartId)}
          onMouseLeave={() => setHoveredChart(null)}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${color.replace('500', '100')}`}>
                  <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-').replace('500', '600')}`} />
                </div>
                <h4 className="text-xl font-bold text-gray-900">{title}</h4>
              </div>
              <button
                onClick={() => setFullscreenChart(chartId)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tela cheia"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-center">
              <svg 
                width={chartSize.width} 
                height={chartSize.height} 
                className={`transition-all duration-300 ${isHovered ? 'drop-shadow-lg' : ''}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Background gradient */}
                <defs>
                  <linearGradient id={`gradient-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color.replace('bg-', '').replace('-500', '')} stopOpacity="0.1" />
                    <stop offset="100%" stopColor={color.replace('bg-', '').replace('-500', '')} stopOpacity="0.05" />
                  </linearGradient>
                  <filter id={`glow-${chartId}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Chart area background */}
                <rect 
                  x={chartMargin.left} 
                  y={chartMargin.top} 
                  width={finalChartWidth} 
                  height={finalChartHeight} 
                  fill={`url(#gradient-${chartId})`}
                  rx="8"
                />

                {/* Grid lines */}
                <g stroke="#e5e7eb" strokeWidth="1" opacity="0.5">
                  {/* Vertical grid lines */}
                  {xGridLines.map((gridLine, i) => (
                    <line key={`v-${i}`} x1={chartMargin.left + finalXScale(gridLine.value)} y1={chartMargin.top} x2={chartMargin.left + finalXScale(gridLine.value)} y2={chartMargin.top + finalChartHeight} />
                  ))}
                  {/* Horizontal grid lines */}
                  {yGridLines.map((gridLine, i) => (
                    <line key={`h-${i}`} x1={chartMargin.left} y1={gridLine.y} x2={chartMargin.left + finalChartWidth} y2={gridLine.y} />
                  ))}
                </g>
                
                {/* Grid labels */}
                <g className="text-xs fill-gray-600">
                  {/* X-axis labels */}
                  {xGridLines.map((gridLine, i) => (
                    <text key={`x-label-${i}`} x={chartMargin.left + finalXScale(gridLine.value)} y={chartSize.height - 35} textAnchor="middle">
                      {gridLine.label}
                    </text>
                  ))}
                  {/* Y-axis labels */}
                  {yGridLines.map((gridLine, i) => (
                    <text key={`y-label-${i}`} x={chartMargin.left - 10} y={gridLine.y + 5} textAnchor="end">
                      {gridLine.label}
                    </text>
                  ))}
                </g>
                
                {/* Axes */}
                <g stroke="#374151" strokeWidth="2">
                  <line
                    x1={chartMargin.left}
                    y1={chartMargin.top + finalChartHeight}
                    x2={chartMargin.left + finalChartWidth}
                    y2={chartMargin.top + finalChartHeight}
                  />
                  <line
                    x1={chartMargin.left}
                    y1={chartMargin.top}
                    x2={chartMargin.left}
                    y2={chartMargin.top + finalChartHeight}
                  />
                </g>
                
                {/* Data line with glow effect */}
                <path
                  d={finalPathData}
                  fill="none"
                  stroke={color.replace('bg-', '').replace('-500', '')}
                  strokeWidth="3"
                  transform={`translate(${chartMargin.left}, ${chartMargin.top})`}
                  filter={isHovered ? `url(#glow-${chartId})` : undefined}
                  className="transition-all duration-300"
                />
                
                {/* Data points */}
                {data.filter((_, i) => i % 10 === 0).map((point, i) => (
                  <circle
                    key={i}
                    cx={chartMargin.left + finalXScale(point.x)}
                    cy={chartMargin.top + finalYScale(point.y)}
                    r={isHovered ? "4" : "3"}
                    fill={color.replace('bg-', '').replace('-500', '')}
                    className="transition-all duration-300"
                  />
                ))}
                
                {/* Axis labels */}
                <text
                  x={chartMargin.left + finalChartWidth / 2}
                  y={chartSize.height - 20}
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  Tempo (horas)
                </text>
                <text
                  x={25}
                  y={chartMargin.top + finalChartHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90, 25, ${chartMargin.top + finalChartHeight / 2})`}
                  className="text-sm font-medium fill-gray-700"
                >
                  {yLabel}
                </text>

              </svg>
            </div>
          </div>
        </div>

        {/* Fullscreen Modal */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-full max-h-full overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${color.replace('500', '100')}`}>
                      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-').replace('500', '600')}`} />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">{title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setFullscreenChart(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Sair da tela cheia"
                    >
                      <Minimize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setFullscreenChart(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Fechar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <svg 
                    width={chartSize.width} 
                    height={chartSize.height} 
                    className="drop-shadow-lg"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Same SVG content as above but with fullscreen dimensions */}
                    <defs>
                      <linearGradient id={`gradient-${chartId}-fs`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color.replace('bg-', '').replace('-500', '')} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={color.replace('bg-', '').replace('-500', '')} stopOpacity="0.05" />
                      </linearGradient>
                      <filter id={`glow-${chartId}-fs`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    <rect 
                      x={chartMargin.left} 
                      y={chartMargin.top} 
                      width={finalChartWidth} 
                      height={finalChartHeight} 
                      fill={`url(#gradient-${chartId}-fs)`}
                      rx="8"
                    />

                    <g stroke="#e5e7eb" strokeWidth="1" opacity="0.5">
                      {xGridLines.map((gridLine, i) => (
                        <line key={`v-${i}`} x1={chartMargin.left + finalXScale(gridLine.value)} y1={chartMargin.top} x2={chartMargin.left + finalXScale(gridLine.value)} y2={chartMargin.top + finalChartHeight} />
                      ))}
                      {generateYGridLines().map((gridLine, i) => (
                        <line key={`h-${i}`} x1={chartMargin.left} y1={gridLine.y} x2={chartMargin.left + finalChartWidth} y2={gridLine.y} />
                      ))}
                    </g>
                    
                    <g className="text-sm fill-gray-600">
                      {xGridLines.map((gridLine, i) => (
                        <text key={`x-label-${i}`} x={chartMargin.left + finalXScale(gridLine.value)} y={chartSize.height - 35} textAnchor="middle">
                          {gridLine.label}
                        </text>
                      ))}
                      {/* Y-axis labels for fullscreen */}
                      {(() => {
                        if (useCustomYScale) {
                          if (chartId === 'failure') {
                            // Failure: 0% to 100% (increasing) - FIXED for fullscreen
                            return Array.from({ length: 11 }, (_, i) => {
                              const value = i * 0.1; // 0% to 100%
                              const y = chartMargin.top + finalChartHeight - (i * finalChartHeight) / 10;
                              return (
                                <text key={`y-label-${i}`} x={chartMargin.left - 15} y={y + 5} textAnchor="end">
                                  {(value * 100).toFixed(0)}%
                                </text>
                              );
                            });
                          } else if (chartId === 'reliability') {
                            // Reliability: 100% to 0% (decreasing)
                            return Array.from({ length: 11 }, (_, i) => {
                              const value = 1 - (i * 0.1); // 100% to 0%
                              const y = chartMargin.top + (i * finalChartHeight) / 10;
                              return (
                                <text key={`y-label-${i}`} x={chartMargin.left - 15} y={y + 5} textAnchor="end">
                                  {(value * 100).toFixed(0)}%
                                </text>
                              );
                            });
                          }
                        }
                        // Default labels
                        return generateYGridLines().map((gridLine, i) => (
                          <text key={`y-label-${i}`} x={chartMargin.left - 15} y={gridLine.y + 5} textAnchor="end">
                            {gridLine.label}
                          </text>
                        ));
                      })()}
                    </g>
                    
                    <g stroke="#374151" strokeWidth="2">
                      <line
                        x1={chartMargin.left}
                        y1={chartMargin.top + finalChartHeight}
                        x2={chartMargin.left + finalChartWidth}
                        y2={chartMargin.top + finalChartHeight}
                      />
                      <line
                        x1={chartMargin.left}
                        y1={chartMargin.top}
                        x2={chartMargin.left}
                        y2={chartMargin.top + finalChartHeight}
                      />
                    </g>
                    
                    <path
                      d={finalPathData}
                      fill="none"
                      stroke={color.replace('bg-', '').replace('-500', '')}
                      strokeWidth="4"
                      transform={`translate(${chartMargin.left}, ${chartMargin.top})`}
                      filter={`url(#glow-${chartId}-fs)`}
                    />
                    
                    {data.filter((_, i) => i % 5 === 0).map((point, i) => (
                      <circle
                        key={i}
                        cx={chartMargin.left + finalXScale(point.x)}
                        cy={chartMargin.top + finalYScale(point.y)}
                        r="5"
                        fill={color.replace('bg-', '').replace('-500', '')}
                      />
                    ))}
                    
                    <text
                      x={chartMargin.left + finalChartWidth / 2}
                      y={chartSize.height - 30}
                      textAnchor="middle"
                      className="text-lg font-medium fill-gray-700"
                    >
                      Tempo (horas)
                    </text>
                    <text
                      x={40}
                      y={chartMargin.top + finalChartHeight / 2}
                      textAnchor="middle"
                      transform={`rotate(-90, 40, ${chartMargin.top + finalChartHeight / 2})`}
                      className="text-lg font-medium fill-gray-700"
                    >
                      {yLabel}
                    </text>

                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Handle ESC key to close fullscreen
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreenChart(null);
      }
    };
    
    if (fullscreenChart) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [fullscreenChart]);

  const currentDist = analysisResults.distributions[localSelectedDistribution as keyof typeof analysisResults.distributions];

  return (
    <div className="space-y-8">
      {/* Distribution Selection */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-blue-900">
            Seleção de Distribuição para Gráficos
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {distributions.map((dist) => {
            const distResult = analysisResults.distributions[dist.key as keyof typeof analysisResults.distributions];
            const isSelected = localSelectedDistribution === dist.key;
            const isRecommended = analysisResults.bestDistribution === dist.key;
            
            return (
              <button
                key={dist.key}
                onClick={() => setLocalSelectedDistribution(dist.key)}
                className={`relative px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isSelected
                    ? `${dist.color} text-white shadow-lg transform scale-105`
                    : `bg-white text-gray-700 border-2 border-gray-200 ${dist.hoverColor.replace('bg-', 'hover:border-').replace('-600', '-300')} hover:shadow-md`
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{dist.name}</span>
                  {isRecommended && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Distribuição Recomendada"></div>
                  )}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  AIC: {distResult.aic.toFixed(1)}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Distribuição Selecionada:</span>
              <span className="ml-2 font-bold text-gray-900">{currentDist.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">MTTF:</div>
              <div className="font-bold text-lg text-blue-600">{currentDist.mttf.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Window Control */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Controle de Janela de Tempo</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Tempo máximo:</label>
            <input
              type="number"
              value={timeWindow || ''}
              onChange={(e) => setTimeWindow(e.target.value ? parseFloat(e.target.value) : 0)}
              placeholder="Auto"
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              min="0"
              step="20"
            />
            <span className="text-sm text-gray-500">horas</span>
          </div>
          
          <button
            onClick={() => setTimeWindow(0)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Auto
          </button>
          
          <div className="text-sm text-gray-600">
            <span>Dados até: <strong>{chartData.dataMaxTime.toFixed(0)}h</strong></span>
            <span className="ml-4">Janela atual: <strong>{chartData.maxTime.toFixed(0)}h</strong></span>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          💡 Escalas inteligentes: 0-100h (20h), 100-500h (50h), &gt;500h (100h)
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <SVGChart
          title="Função de Confiabilidade R(t)"
          data={chartData.reliability}
          color="bg-blue-500"
          yLabel="Confiabilidade (%)"
          icon={Target}
          chartId="reliability"
        />
        
        <SVGChart
          title="Função de Falha F(t)"
          data={chartData.failure}
          color="bg-red-500"
          yLabel="Probabilidade de Falha (%)"
          icon={TrendingUp}
          chartId="failure"
        />
        
        <SVGChart
          title="Taxa de Falha λ(t)"
          data={chartData.hazard}
          color="bg-orange-500"
          yLabel="Taxa de Falha λ(t)"
          icon={Zap}
          chartId="hazard"
        />
        
        <SVGChart
          title="Função Densidade de Probabilidade f(t)"
          data={chartData.pdf}
          color="bg-green-500"
          yLabel="Densidade f(t)"
          icon={Activity}
          chartId="pdf"
        />
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Resumo dos Dados Analisados</span>
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total de Amostras</div>
            <div className="text-2xl font-bold text-blue-900">{analysisResults.dataStats.totalSamples}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Falhas Observadas</div>
            <div className="text-2xl font-bold text-red-900">{analysisResults.dataStats.failures}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-600 font-medium">Dados Censurados</div>
            <div className="text-2xl font-bold text-yellow-900">{analysisResults.dataStats.censored}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium">Tempo Médio</div>
            <div className="text-2xl font-bold text-green-900">{analysisResults.dataStats.meanTime.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Chart Information */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-4 text-lg">📊 Interpretação dos Gráficos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
              <div>
                <strong className="text-blue-700">R(t) - Confiabilidade:</strong>
                <p className="text-sm text-gray-600">Probabilidade de o item sobreviver até o tempo t sem falhar.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mt-1"></div>
              <div>
                <strong className="text-red-700">F(t) - Função de Falha:</strong>
                <p className="text-sm text-gray-600">Probabilidade acumulada de falha até o tempo t.</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full mt-1"></div>
              <div>
                <strong className="text-orange-700">λ(t) - Taxa de Falha:</strong>
                <p className="text-sm text-gray-600">Taxa instantânea de falha no tempo t (falhas por unidade de tempo).</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
              <div>
                <strong className="text-green-700">f(t) - Densidade:</strong>
                <p className="text-sm text-gray-600">Densidade de probabilidade de falha no tempo t.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-mono whitespace-pre-line pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default Charts;