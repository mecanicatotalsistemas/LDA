import React, { useState } from 'react';

const FailureProbabilityChart: React.FC = () => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    time: number;
    failure: number;
  }>({ visible: false, x: 0, y: 0, time: 0, failure: 0 });

  const width = 900;
  const height = 500;
  const margin = { top: 40, right: 40, bottom: 70, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxTime = 100;
  const maxFailure = 100;

  const generateFailureCurve = () => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const time = i;
      const failure = 100 * (1 - Math.exp(-0.03 * time));
      points.push({ time, failure });
    }
    return points;
  };

  const curveData = generateFailureCurve();

  const xScale = (time: number) => (time / maxTime) * chartWidth;
  const yScale = (failure: number) => chartHeight - (failure / maxFailure) * chartHeight;

  const pathData = curveData
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(point.time)} ${yScale(point.failure)}`)
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
      const pointY = yScale(closestPoint.failure);
      const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));

      if (distance < 20) {
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY - 60,
          time: closestPoint.time,
          failure: closestPoint.failure
        });
      } else {
        setTooltip({ visible: false, x: 0, y: 0, time: 0, failure: 0 });
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, time: 0, failure: 0 });
  };

  const xGridLines = Array.from({ length: 6 }, (_, i) => i * 20);
  const yGridLines = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Probabilidade de Falha ao Longo do Tempo
      </h2>

      <div className="flex justify-center">
        <svg
          width={width}
          height={height}
          className="cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fee2e2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fecaca" stopOpacity="0.1" />
            </linearGradient>
            <filter id="dropShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            x={margin.left}
            y={margin.top}
            width={chartWidth}
            height={chartHeight}
            fill="url(#redGradient)"
            rx="8"
          />

          <g stroke="#e5e7eb" strokeWidth="1" opacity="0.6">
            {xGridLines.map((time, i) => (
              <line
                key={`v-${i}`}
                x1={margin.left + xScale(time)}
                y1={margin.top}
                x2={margin.left + xScale(time)}
                y2={margin.top + chartHeight}
              />
            ))}
            {yGridLines.map((failure, i) => (
              <line
                key={`h-${i}`}
                x1={margin.left}
                y1={margin.top + yScale(failure)}
                x2={margin.left + chartWidth}
                y2={margin.top + yScale(failure)}
              />
            ))}
          </g>

          <g className="text-sm fill-gray-600 font-medium">
            {xGridLines.map((time, i) => (
              <text
                key={`x-label-${i}`}
                x={margin.left + xScale(time)}
                y={height - 35}
                textAnchor="middle"
              >
                {time}h
              </text>
            ))}
            {yGridLines.map((failure, i) => (
              <text
                key={`y-label-${i}`}
                x={margin.left - 15}
                y={margin.top + yScale(failure) + 5}
                textAnchor="end"
              >
                {failure}%
              </text>
            ))}
          </g>

          <g stroke="#374151" strokeWidth="2.5">
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
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${margin.left}, ${margin.top})`}
            filter="url(#dropShadow)"
          />

          {curveData.filter((_, i) => i % 5 === 0).map((point, i) => (
            <circle
              key={i}
              cx={margin.left + xScale(point.time)}
              cy={margin.top + yScale(point.failure)}
              r="4"
              fill="#dc2626"
              stroke="#fff"
              strokeWidth="2"
            />
          ))}

          <text
            x={margin.left + chartWidth / 2}
            y={height - 15}
            textAnchor="middle"
            className="text-base font-semibold fill-gray-700"
          >
            Tempo (horas)
          </text>
          <text
            x={20}
            y={margin.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 20, ${margin.top + chartHeight / 2})`}
            className="text-base font-semibold fill-gray-700"
          >
            Probabilidade de Falha (%)
          </text>
        </svg>
      </div>

      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-2xl text-sm font-semibold pointer-events-none border-2 border-red-500"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, 0)'
          }}
        >
          Tempo: {Math.round(tooltip.time)} horas | Falha: {Math.round(tooltip.failure)}%
        </div>
      )}

      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-gray-700 text-center">
          <strong className="text-red-700">Passe o mouse sobre a curva</strong> para visualizar os valores de tempo e probabilidade de falha
        </p>
      </div>
    </div>
  );
};

export default FailureProbabilityChart;
