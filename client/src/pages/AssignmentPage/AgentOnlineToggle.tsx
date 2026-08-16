import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCurrentUserProfile } from '@lark-apaas/client-toolkit/hooks/useCurrentUserProfile';
import { sendHeartbeat, getOnlineAgents } from '@client/src/api/routing';
import { Button } from '@client/src/components/ui/button';
import { toast } from 'sonner';

const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000;

const AgentOnlineToggle: React.FC = () => {
  const userInfo = useCurrentUserProfile();
  const userId = userInfo?.user_id;

  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHeartbeat = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        await sendHeartbeat('online');
      } catch {
        toast.error('心跳发送失败，可能影响线索分配');
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getOnlineAgents()
      .then((agents: { assigneeId: string }[]) => {
        if (cancelled) return;
        if (agents.some((a) => a.assigneeId === userId)) {
          setIsOnline(true);
          startHeartbeat();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, startHeartbeat]);

  useEffect(() => {
    return () => stopHeartbeat();
  }, [stopHeartbeat]);

  const handleGoOnline = async () => {
    setLoading(true);
    try {
      await sendHeartbeat('online');
      setIsOnline(true);
      startHeartbeat();
      toast.success('已上线，可接收线索分配');
    } catch {
      toast.error('上线失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoOffline = async () => {
    setLoading(true);
    try {
      await sendHeartbeat('offline');
      setIsOnline(false);
      stopHeartbeat();
      toast.success('已下线');
    } catch {
      toast.error('下线失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      <span className="text-sm text-gray-600">
        {isOnline ? '在线' : '离线'}
      </span>
      {isOnline ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoOffline}
          disabled={loading}
        >
          下线
        </Button>
      ) : (
        <Button size="sm" onClick={handleGoOnline} disabled={loading}>
          上线
        </Button>
      )}
    </div>
  );
};

export default AgentOnlineToggle;
