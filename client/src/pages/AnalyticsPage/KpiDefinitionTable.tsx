import type { AiEffectivenessKpi } from '@shared/api.interface';

interface KpiDefinitionTableProps {
  kpis: AiEffectivenessKpi[];
}

function isKpiMet(kpi: AiEffectivenessKpi): boolean {
  if (kpi.actual === null || kpi.target === null) return false;
  if (kpi.direction === 'higher') return kpi.actual >= kpi.target;
  return kpi.actual <= kpi.target;
}

const KpiDefinitionTable: React.FC<KpiDefinitionTableProps> = ({ kpis }) => {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2 px-3 font-medium">KPI</th>
          <th className="py-2 px-3 font-medium">定义</th>
          <th className="py-2 px-3 font-medium whitespace-nowrap">目标值</th>
          <th className="py-2 px-3 font-medium">数据来源</th>
        </tr>
      </thead>
      <tbody>
        {kpis.map((kpi: AiEffectivenessKpi) => {
          const met = isKpiMet(kpi);
          const targetLabel =
            kpi.target !== null
              ? `${kpi.direction === 'higher' ? '>' : '<'}${kpi.target}${kpi.unit}`
              : '—';
          return (
            <tr key={kpi.key} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${met ? 'bg-green-500' : 'bg-orange-400'}`}
                  />
                  <span className="font-medium text-gray-800">{kpi.name}</span>
                </div>
              </td>
              <td className="py-2 px-3 text-gray-600">{kpi.definition}</td>
              <td className="py-2 px-3 text-gray-700 whitespace-nowrap">{targetLabel}</td>
              <td className="py-2 px-3 text-gray-500 text-xs">{kpi.dataSource}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default KpiDefinitionTable;
