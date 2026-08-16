import React, { useState } from 'react';
import { Zap, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { autoAssignPool, recycleLeads } from '@client/src/api/leads';
import { Button } from '@client/src/components/ui/button';

interface PoolActionsProps {
  onRefresh: () => void;
}

const PoolActions: React.FC<PoolActionsProps> = ({ onRefresh }) => {
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [recycling, setRecycling] = useState(false);

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const result = await autoAssignPool();
      toast.success(`自动分配完成，已分配 ${result.assignedCount} 条线索`);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '自动分配失败');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleRecycle = async () => {
    setRecycling(true);
    try {
      const result = await recycleLeads();
      toast.success(`回收完成，已回收 ${result.recycledCount} 条线索`);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '回收失败');
    } finally {
      setRecycling(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" onClick={handleAutoAssign} disabled={autoAssigning}>
        <Zap className={autoAssigning ? 'animate-pulse' : ''} />
        自动分配
      </Button>
      <Button variant="outline" size="sm" onClick={handleRecycle} disabled={recycling}>
        <RotateCcw className={recycling ? 'animate-spin' : ''} />
        手动回收
      </Button>
    </div>
  );
};

export default PoolActions;
