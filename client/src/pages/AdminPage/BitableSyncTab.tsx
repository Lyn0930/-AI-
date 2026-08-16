import React, { useState, useEffect, useCallback } from 'react';
import { Table2, RefreshCw, CheckCircle2, XCircle, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSyncStatus,
  getUnsyncedLeads,
  syncLead,
  syncAll,
} from '@client/src/api/bitable-sync';
import type {
  BitableSyncStatus,
  BitableSyncLeadItem,
} from '@shared/api.interface';

const BitableSyncTab: React.FC = () => {
  const [status, setStatus] = useState<BitableSyncStatus | null>(null);
  const [unsynced, setUnsynced] = useState<BitableSyncLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([getSyncStatus(), getUnsyncedLeads()]);
      setStatus(s);
      setUnsynced(u);
    } catch {
      toast.error('加载同步状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const result = await syncAll();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
      await refresh();
    } catch {
      toast.error('批量同步失败');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncOne = async (leadId: string) => {
    setSyncingId(leadId);
    try {
      const result = await syncLead(leadId);
      if (result.success) {
        toast.success('同步成功');
      } else {
        toast.error(`同步失败: ${result.message}`);
      }
      await refresh();
    } catch {
      toast.error('同步失败');
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
        <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-medium mb-0.5">飞书多维表格同步</p>
          <p>
            线索创建和需求收集完成时，自动将数据同步到飞书多维表格。
            若插件未配置 appToken/tableId，同步将静默失败，不影响业务流程。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500 mb-1">总线索数</div>
          <div className="text-2xl font-semibold text-gray-900">
            {status?.total ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            已同步
          </div>
          <div className="text-2xl font-semibold text-green-700">
            {status?.synced ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-1 text-xs text-orange-600 mb-1">
            <XCircle className="w-3.5 h-3.5" />
            未同步
          </div>
          <div className="text-2xl font-semibold text-orange-700">
            {status?.unsynced ?? 0}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">未同步线索</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            刷新
          </button>
          <button
            type="button"
            disabled={syncingAll || (status?.unsynced ?? 0) === 0}
            onClick={handleSyncAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <Table2 className="w-3.5 h-3.5" />
                一键同步全部
              </>
            )}
          </button>
        </div>
      </div>

      {unsynced.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">所有线索已同步</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  客户姓名
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  电话
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  城市
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  创建时间
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {unsynced.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-2.5 text-xs text-gray-800">
                    {lead.customerName || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-800">
                    {lead.phoneNumber}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-800">
                    {lead.serviceCity}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {new Date(lead.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={syncingId === lead.id}
                      onClick={() => handleSyncOne(lead.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-primary border border-primary/30 rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      {syncingId === lead.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      同步
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BitableSyncTab;
