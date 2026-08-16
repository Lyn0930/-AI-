import React from 'react';
import { Activity, Users, Inbox, TrendingUp } from 'lucide-react';
import type { SystemHealth } from '@shared/api.interface';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

interface SystemHealthCardsProps {
  data: SystemHealth | null;
  loading: boolean;
}

const SystemHealthCards: React.FC<SystemHealthCardsProps> = ({
  data,
  loading,
}) => {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        加载中...
      </div>
    );
  }

  const metrics = [
    {
      label: '公海规模',
      value: data.poolSize,
      icon: Inbox,
      color: '#f59e0b',
    },
    {
      label: '活跃会话',
      value: data.activeSessions,
      icon: Activity,
      color: '#8b5cf6',
    },
    {
      label: '未分配线索',
      value: data.unassigned,
      icon: Users,
      color: '#ef4444',
    },
    {
      label: '今日新增',
      value: data.todayNew,
      icon: TrendingUp,
      color: '#10b981',
    },
    {
      label: '总联系记录',
      value: data.totalContacts,
      icon: Activity,
      color: '#3b82f6',
    },
    {
      label: '总会话数',
      value: data.totalSessions,
      icon: Activity,
      color: '#06b6d4',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex flex-col p-3 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                <span className="text-xs text-gray-500">{m.label}</span>
              </div>
              <span className="text-xl font-bold text-gray-800">{m.value}</span>
            </div>
          );
        })}
      </div>
      <div className="pt-3 border-t border-gray-200 space-y-2">
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">Prometheus 指标端点：</span>
          <UniversalLink
            to="/api/stats/metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-1"
          >
            /api/stats/metrics
          </UniversalLink>
        </div>
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">追踪 ID：</span>
          所有 API 请求均携带 Trace-ID，可在响应头{' '}
          <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
            x-log-trace-id
          </code>{' '}
          中查看，用于全链路问题排查
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCards;
