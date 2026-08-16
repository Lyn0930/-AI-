import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { GradeFunnelItem } from '@shared/api.interface';

interface GradeFunnelChartProps {
  data: GradeFunnelItem[];
}

const GradeFunnelChart: React.FC<GradeFunnelChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
        暂无数据
      </div>
    );
  }

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}',
    },
    series: [
      {
        type: 'funnel',
        sort: 'none',
        gap: 2,
        data: data.map((item: GradeFunnelItem) => ({
          value: item.count,
          name: `${item.label}  ${item.count}条 (${item.percentage}%)`,
          itemStyle: { color: item.color },
        })),
        label: {
          show: true,
          position: 'inside',
          fontSize: 12,
          color: '#fff',
          fontWeight: 'bold',
        },
      },
    ],
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {data.map((item: GradeFunnelItem) => (
          <div key={item.stage} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
      <ReactECharts option={option} theme="ud" className="h-[320px]" />
    </div>
  );
};

export default GradeFunnelChart;
