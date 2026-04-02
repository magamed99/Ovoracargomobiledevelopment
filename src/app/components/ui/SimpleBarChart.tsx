interface BarItem {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarItem[];
  color?: string;
  height?: number;
  valueSuffix?: string;
}

export function SimpleBarChart({ data, color = '#3b82f6', height = 200, valueSuffix = '' }: SimpleBarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barAreaHeight = height - 36; // reserve space for labels
  const barWidth = 100 / data.length;

  return (
    <div style={{ height }} className="w-full relative flex flex-col">
      {/* Chart area */}
      <div className="flex-1 flex items-end gap-1 px-1">
        {data.map((item, i) => {
          const barH = Math.max(2, (item.value / max) * barAreaHeight);
          return (
            <div
              key={`bar-${i}-${item.label}`}
              className="flex flex-col items-center flex-1 gap-0.5"
              style={{ minWidth: 0 }}
            >
              {item.value > 0 && (
                <span className="text-xs font-semibold" style={{ color, fontSize: 10 }}>
                  {item.value}{valueSuffix}
                </span>
              )}
              <div
                className="w-full rounded-t-sm transition-all"
                style={{ height: barH, backgroundColor: item.value > 0 ? color : '#e5e7eb' }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1 px-1 mt-1">
        {data.map((item, i) => (
          <div
            key={`label-${i}-${item.label}`}
            className="flex-1 text-center text-gray-400 truncate"
            style={{ fontSize: 11 }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
