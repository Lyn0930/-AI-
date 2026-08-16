import React from 'react';
import { UserDisplay } from '@/components/business-ui/user-display';
import type { TeamPerformanceItem } from '@shared/api.interface';

interface TeamPerformanceTableProps {
  data: TeamPerformanceItem[];
  loading: boolean;
}

const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({
  data,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        加载中...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        暂无团队效能数据
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 px-3 font-medium text-gray-600">客服</th>
          <th className="text-right py-2 px-3 font-medium text-gray-600">
            分配线索
          </th>
          <th className="text-right py-2 px-3 font-medium text-gray-600">
            联系次数
          </th>
          <th className="text-right py-2 px-3 font-medium text-gray-600">
            转化数
          </th>
          <th className="text-left py-2 px-3 font-medium text-gray-600">
            转化率
          </th>
          <th className="text-right py-2 px-3 font-medium text-gray-600">
            活跃聊天
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item: TeamPerformanceItem) => (
          <tr
            key={item.assigneeId}
            className="border-b border-gray-100 hover:bg-gray-50"
          >
            <td className="py-2.5 px-3">
              <UserDisplay value={[item.assigneeId]} size="small" />
            </td>
            <td className="text-right py-2.5 px-3 text-gray-800">
              {item.assignedCount}
            </td>
            <td className="text-right py-2.5 px-3 text-gray-800">
              {item.contactCount}
            </td>
            <td className="text-right py-2.5 px-3 text-gray-800">
              {item.convertedCount}
            </td>
            <td className="py-2.5 px-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.conversionRate}%`,
                      backgroundColor: '#10b981',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-10 text-right">
                  {item.conversionRate}%
                </span>
              </div>
            </td>
            <td className="text-right py-2.5 px-3 text-gray-800">
              {item.activeSessions}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TeamPerformanceTable;
