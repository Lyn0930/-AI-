import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { AgentWorkload } from '@shared/api.interface';
import { getAgentWorkloads } from '@client/src/api/routing';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { UserDisplay } from '@/components/business-ui/user-display';

const AgentWorkloadTab: React.FC = () => {
  const [workloads, setWorkloads] = useState<AgentWorkload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkloads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgentWorkloads();
      setWorkloads(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkloads();
  }, [fetchWorkloads]);

  const totalAgents = workloads.length;
  const totalActive = workloads.reduce(
    (sum: number, w: AgentWorkload) => sum + w.activeSessions,
    0,
  );
  const totalChatting = workloads.reduce(
    (sum: number, w: AgentWorkload) => sum + w.chattingLeads,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          总专员数：<span className="font-semibold text-gray-800">{totalAgents}</span>
          <span className="mx-2">|</span>
          总活跃会话：<span className="font-semibold text-gray-800">{totalActive}</span>
          <span className="mx-2">|</span>
          总聊天中线索：<span className="font-semibold text-gray-800">{totalChatting}</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWorkloads} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          刷新
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading && workloads.length === 0 ? (
          <div className="p-12 text-center text-gray-400">加载中...</div>
        ) : workloads.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无专员负载数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">专员</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">活跃会话数</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">聊天中线索数</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">总线索数</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">技能标签</th>
              </tr>
            </thead>
            <tbody>
              {workloads.map((w: AgentWorkload) => (
                <tr key={w.assigneeId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <UserDisplay value={[w.assigneeId]} size="small" />
                  </td>
                  <td className="px-4 py-3">
                    {w.activeSessions > 5 ? (
                      <Badge variant="destructive">{w.activeSessions}</Badge>
                    ) : (
                      <span className="text-sm text-gray-800">{w.activeSessions}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {w.chattingLeads > 3 ? (
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                        {w.chattingLeads}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-800">{w.chattingLeads}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{w.totalLeads}</td>
                  <td className="px-4 py-3">
                    {w.skills.length === 0 ? (
                      <span className="text-sm text-gray-400">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {w.skills.map((s: string) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AgentWorkloadTab;
