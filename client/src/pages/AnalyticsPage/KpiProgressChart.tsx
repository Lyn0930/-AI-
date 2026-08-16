import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { AiEffectivenessKpi } from '@shared/api.interface';

interface KpiProgressChartProps {
  kpis: AiEffectivenessKpi[];
}

function isKpiMet(kpi: AiEffectivenessKpi): boolean {
  if (kpi.actual === null || kpi.target === null) return false;
  if (kpi.direction === 'higher') return kpi.actual >= kpi.target;
  return kpi.actual <= kpi.target;
}

const KpiProgressChart: React.FC<KpiProgressChartProps> = ({ kpis }) => {
  const percentageKpis = kpis.filter(
    (k: AiEffectivenessKpi) => k.unit === '%' && k.actual !== null,
  );

  if (percentageKpis.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
        暂无数据
      </div>
    );
  }

  const names = percentageKpis.map((k: AiEffectivenessKpi) => k.name);
  const actuals = percentageKpis.map((k: AiEffectivenessKpi) => k.actual as number);
  const targets = percentageKpis.map((k: AiEffectivenessKpi) => k.target as number);
  const colors = percentageKpis.map((k: AiEffectivenessKpi) =>
    isKpiMet(k) ? '#10b981' : '#f59e0b',
  );

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const arr = params as Array<{ dataIndex: number; value: number }>;
        if (!arr || arr.length === 0) return '';
        const idx = arr[0].dataIndex;
        const kpi = percentageKpis[idx];
        return `${kpi.name}<br/>实际: ${kpi.actual}${kpi.unit}<br/>目标: ${kpi.direction === 'higher' ? '>' : '<'}${kpi.target}${kpi.unit}`;
      },
    },
    grid: { left: '3%', right: '15%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: actuals.map((val: number, idx: number) => ({
          value: Math.min(val, 100),
          itemStyle: { color: colors[idx], borderRadius: [0, 4, 4, 0] },
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          formatter: (params: { dataIndex: number }) => {
            const kpi = percentageKpis[params.dataIndex];
            return `${kpi.actual}%  (目标 ${kpi.direction === 'higher' ? '>' : '<'}${kpi.target}%)`;
          },
          fontSize: 11,
          color: '#6b7280',
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#d1d5db' },
          data: targets.map((t: number, idx: number) => ({
            xAxis: t,
            label: { show: false },
            itemStyle: { color: '#9ca3af' },
          })),
        },
      },
    ],
  };

  return (
    <ReactECharts option={option} theme="ud" className="h-[300px]" />
  );
};

export default KpiProgressChart;
