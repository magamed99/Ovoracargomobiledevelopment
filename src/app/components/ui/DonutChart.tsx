interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  innerRadius?: number;
  outerRadius?: number;
  size?: number;
}

export function DonutChart({ data, innerRadius = 45, outerRadius = 70, size = 160 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const gap = 2; // degrees between slices

  let currentAngle = -90; // start at top

  const slices = data.map((slice) => {
    const fraction = slice.value / total;
    const angleDeg = fraction * 360 - gap;
    const startAngle = currentAngle + gap / 2;
    const endAngle = startAngle + angleDeg;
    currentAngle += fraction * 360;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + outerRadius * Math.cos(toRad(startAngle));
    const y1 = cy + outerRadius * Math.sin(toRad(startAngle));
    const x2 = cx + outerRadius * Math.cos(toRad(endAngle));
    const y2 = cy + outerRadius * Math.sin(toRad(endAngle));
    const x3 = cx + innerRadius * Math.cos(toRad(endAngle));
    const y3 = cy + innerRadius * Math.sin(toRad(endAngle));
    const x4 = cx + innerRadius * Math.cos(toRad(startAngle));
    const y4 = cy + innerRadius * Math.sin(toRad(startAngle));

    const largeArc = angleDeg > 180 ? 1 : 0;

    const d =
      `M ${x1} ${y1}` +
      ` A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}` +
      ` L ${x3} ${y3}` +
      ` A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}` +
      ` Z`;

    return { ...slice, d, startAngle, endAngle };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <path
          key={`donut-slice-${i}-${slice.name}`}
          d={slice.d}
          fill={slice.color}
        />
      ))}
    </svg>
  );
}
