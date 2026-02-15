import React, { useState } from 'react';

const DegradationCurveChart: React.FC = () => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    time: number;
    degradation: number;
  }>({ visible: false, x: 0, y: 0, time: 0, degradation: 0 });

  const width = 1000;
  const height = 600;
  const margin = { top: 50, right: 50, bottom: 80, left: 90 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxTime = 1000;
  const maxDegradation = 100;

  const generateDegradationCurve = () => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const time = i * 10;
      const degradation = 100 * (1 - Math.exp(-0.0025 * time));
      points.push({ time, degradation });
    }
    return points;
  };

  const curveData = generateDegradationCurve();

  const xScale = (time: number) => (time / maxTime) * chartWidth;
  const yScale = (degradation: number) => chartHeight - (degradation / maxDegradation) * chartHeight;

  const pathData = curveData
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(point.time)} ${yScale(point.degradation)}`)
    .join(' ');

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - margin.left;
    const mouseY = event.clientY - rect.top - margin.top;

    if (mouseX >= 0 && mouseX <= chartWidth && mouseY >= 0 && mouseY <= chartHeight) {
      const timeAtMouse = (mouseX / chartWidth) * maxTime;
      const closestPoint = curveData.reduce((prev, curr) =>
        Math.abs(curr.time - timeAtMouse) < Math.abs(prev.time - timeAtMouse) ? curr : prev
      );

      const pointX = xScale(closestPoint.time);
      const pointY = yScale(closestPoint.degradation);
      const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));

      if (distance < 25) {
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY - 70,
          time: closestPoint.time,
          degradation: closestPoint.degradation
        });
      } else {
        setTooltip({ visible: false, x: 0, y: 0, time: 0, degradation: 0 });
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, time: 0, degradation: 0 });
  };

  const xGridLines = Array.from({ length: 11 }, (_, i) => i * 100);
  const yGridLines = Array.from({ length: 11 }, (_, i) => i * 10);

  const degradationZones = [
    { yStart: 0, yEnd: 40, color: '#dcfce7', label: 'Normal', textColor: '#166534' },
    { yStart: 40, yEnd: 70, color: '#fef3c7', label: 'Atenção', textColor: '#92400e' },
    { yStart: 70, yEnd: 100, color: '#fee2e2', label: 'Crítico', textColor: '#991b1b' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">
        Curva de Degradação do Componente
      </h2>
      <p className="text-center text-gray-600 mb-6 text-sm">
        Evolução do nível de degradação ao longo do tempo de operação
      </p>

      <div className="flex justify-center">
        <svg
          width={width}
          height={height}
          className="cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="1" />
              <stop offset="50%" stopColor="#fb923c" stopOpacity="1" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
            </linearGradient>
            <filter id="curveGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>

          {degradationZones.map((zone, idx) => (
            <rect
              key={idx}
              x={margin.left}
              y={margin.top + yScale(zone.yEnd)}
              width={chartWidth}
              height={yScale(zone.yStart) - yScale(zone.yEnd)}
              fill={zone.color}
              opacity="0.4"
            />
          ))}

          {degradationZones.map((zone, idx) => (
            <text
              key={`label-${idx}`}
              x={width - margin.right + 5}
              y={margin.top + (yScale(zone.yStart) + yScale(zone.yEnd)) / 2}
              className="text-xs font-bold"
              fill={zone.textColor}
              textAnchor="start"
            >
              {zone.label}
            </text>
          ))}

          <g stroke="#d1d5db" strokeWidth="1" opacity="0.5">
            {xGridLines.map((time, i) => (
              <line
                key={`v-${i}`}
                x1={margin.left + xScale(time)}
                y1={margin.top}
                x2={margin.left + xScale(time)}
                y2={margin.top + chartHeight}
              />
            ))}
            {yGridLines.map((degradation, i) => (
              <line
                key={`h-${i}`}
                x1={margin.left}
                y1={margin.top + yScale(degradation)}
                x2={margin.left + chartWidth}
                y2={margin.top + yScale(degradation)}
                strokeDasharray="4 4"
              />
            ))}
          </g>

          <g className="text-sm fill-gray-700 font-medium">
            {xGridLines.map((time, i) => (
              <text
                key={`x-label-${i}`}
                x={margin.left + xScale(time)}
                y={height - 40}
                textAnchor="middle"
              >
                {time}h
              </text>
            ))}
            {yGridLines.map((degradation, i) => (
              <text
                key={`y-label-${i}`}
                x={margin.left - 15}
                y={margin.top + yScale(degradation) + 5}
                textAnchor="end"
              >
                {degradation}%
              </text>
            ))}
          </g>

          <g stroke="#374151" strokeWidth="3">
            <line
              x1={margin.left}
              y1={margin.top + chartHeight}
              x2={margin.left + chartWidth}
              y2={margin.top + chartHeight}
            />
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={margin.top + chartHeight}
            />
          </g>

          <path
            d={pathData}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${margin.left}, ${margin.top})`}
            filter="url(#curveGlow)"
          />

          {curveData.filter((_, i) => i % 5 === 0).map((point, i) => (
            <g key={i}>
              <circle
                cx={margin.left + xScale(point.time)}
                cy={margin.top + yScale(point.degradation)}
                r="6"
                fill="#f97316"
                stroke="#fff"
                strokeWidth="2.5"
                filter="url(#shadow)"
              />
            </g>
          ))}

          <text
            x={margin.left + chartWidth / 2}
            y={height - 15}
            textAnchor="middle"
            className="text-lg font-bold fill-gray-800"
          >
            Tempo de Operação (horas)
          </text>
          <text
            x={25}
            y={margin.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 25, ${margin.top + chartHeight / 2})`}
            className="text-lg font-bold fill-gray-800"
          >
            Nível de Degradação (%)
          </text>
        </svg>
      </div>

      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gradient-to-r from-orange-600 to-amber-500 text-white px-5 py-3 rounded-lg shadow-2xl text-sm font-bold pointer-events-none border-2 border-white"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, 0)'
          }}
        >
          Tempo: {Math.round(tooltip.time)} horas | Degradação: {Math.round(tooltip.degradation)}%
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="font-bold text-green-800">Zona Normal (0-40%)</span>
          </div>
          <p className="text-sm text-gray-700">
            Componente em condições ideais de operação. Manutenção preventiva recomendada.
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="font-bold text-yellow-800">Zona de Atenção (40-70%)</span>
          </div>
          <p className="text-sm text-gray-700">
            Degradação moderada. Aumentar frequência de inspeções e planejar intervenção.
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="font-bold text-red-800">Zona Crítica (&gt;70%)</span>
          </div>
          <p className="text-sm text-gray-700">
            Risco elevado de falha. Substituição ou manutenção corretiva urgente necessária.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
        <p className="text-sm text-gray-700 text-center">
          <strong className="text-orange-700">Passe o mouse sobre a curva</strong> para visualizar os valores exatos de tempo e degradação em cada ponto
        </p>
      </div>
    </div>
  );
};

export default DegradationCurveChart;
