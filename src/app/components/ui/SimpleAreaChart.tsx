interface AreaSeries {
  dataKey: string;
  color: string;
  label: string;
}

interface AreaDataPoint {
  [key: string]: string | number;
}

interface SimpleAreaChartProps {
  data: AreaDataPoint[];
  labelKey: string;
  series: AreaSeries[];
  height?: number;
}

export function SimpleAreaChart({ data, labelKey, series, height = 240 }: SimpleAreaChartProps) {
  const chartH = height - 40;
  const chartW = 100; // percentage-based

  const allValues = series.flatMap(s => data.map(d => Number(d[s.dataKey]) || 0));
  const max = Math.max(...allValues, 1);

  // Build SVG points for each series
  const n = data.length;
  if (n === 0) return null;

  const getX = (i: number) => (i / (n - 1)) * 100;
  const getY = (val: number) => chartH - (val / max) * chartH;

  const buildPath = (s: AreaSeries) => {
    const pts = data.map((d, i) => `${getX(i)},${getY(Number(d[s.dataKey]) || 0)}`);
    const linePts = pts.join(' L ');
    const first = `${getX(0)},${getY(Number(data[0][s.dataKey]) || 0)}`;
    const last = `${getX(n - 1)},${getY(Number(data[n - 1][s.dataKey]) || 0)}`;
    const area = `M ${first} L ${linePts} L ${last},${chartH} L ${getX(0)},${chartH} Z`;
    const line = `M ${first} L ${linePts}`;
    return { area, line };
  };

  // Y-axis labels
  const yTicks = [0, Math.round(max / 2), max];

  return (
    <div style={{ height }} className="w-full">
      <div className="flex gap-3 mb-2 flex-wrap">
        {series.map(s => (
          <div key={s.dataKey} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
      <div className="flex" style={{ height: chartH + 20 }}>
        {/* Y-axis */}
        <div className="flex flex-col justify-between pr-1" style={{ height: chartH }}>
          {yTicks.reverse().map(v => (
            <span key={v} className="text-gray-400 text-right" style={{ fontSize: 10, lineHeight: 1 }}>{v}</span>
          ))}
        </div>
        {/* Chart */}
        <div className="flex-1 flex flex-col">
          <svg
            width="100%"
            height={chartH}
            viewBox={`0 0 100 ${chartH}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Grid lines */}
            {[0, 0.5, 1].map((frac, gi) => (
              <line
                key={`grid-${gi}`}
                x1="0" y1={chartH * (1 - frac)}
                x2="100" y2={chartH * (1 - frac)}
                stroke="#f1f5f9" strokeWidth="0.5"
              />
            ))}
            {/* Areas and lines */}
            {series.map(s => {
              const { area, line } = buildPath(s);
              return (
                <g key={`series-${s.dataKey}`}>
                  <path d={area} fill={s.color} fillOpacity={0.15} />
                  <path d={line} fill="none" stroke={s.color} strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>
          {/* X-axis labels */}
          <div className="flex justify-between mt-1">
            {data.filter((_, i) => i % Math.max(1, Math.floor(n / 7)) === 0 || i === n - 1).map((d, i) => (
              <span key={`xlabel-${i}`} className="text-gray-400 truncate" style={{ fontSize: 10 }}>
                {String(d[labelKey])}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
