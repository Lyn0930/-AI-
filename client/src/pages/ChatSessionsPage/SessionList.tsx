import React from 'react';
import dayjs from 'dayjs';
import { Phone, MapPin, MessageSquare } from 'lucide-react';

import { Badge } from '@client/src/components/ui/badge';
import { Spinner } from '@client/src/components/ui/spinner';
import { Button } from '@client/src/components/ui/button';
import type {
  ChatSessionListItem,
  ChatSessionStatus,
  ChatSessionMode,
} from '@shared/api.interface';

const STATUS_MAP: Record<
  ChatSessionStatus,
  { label: string; className: string }
> = {
  active: {
    label: '进行中',
    className: 'border-transparent bg-green-100 text-green-700',
  },
  completed: {
    label: '已结束',
    className: 'border-transparent bg-gray-200 text-gray-600',
  },
};

const MODE_MAP: Record<ChatSessionMode, { label: string; className: string }> = {
  ai: { label: 'AI', className: 'bg-blue-100 text-blue-700' },
  human: { label: '人工', className: 'bg-orange-100 text-orange-700' },
};

const formatTime = (iso: string): string => {
  const d = dayjs(iso);
  const now = dayjs();
  if (d.isSame(now, 'day')) return d.format('HH:mm');
  if (d.isSame(now.subtract(1, 'day'), 'day'))
    return `昨天 ${d.format('HH:mm')}`;
  return d.format('MM-DD HH:mm');
};

const getDisplayName = (item: ChatSessionListItem): string => {
  if (item.lead?.customerName) return item.lead.customerName;
  return item.lead?.phoneNumber ?? '未知客户';
};

interface SessionCardProps {
  item: ChatSessionListItem;
  selected: boolean;
  onClick: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ item, selected, onClick }) => {
  const statusInfo = STATUS_MAP[item.status] ?? STATUS_MAP.completed;
  const modeInfo = MODE_MAP[item.mode] ?? MODE_MAP.ai;
  const displayName = getDisplayName(item);
  const phone = item.lead?.phoneNumber ?? '—';
  const city = item.lead?.serviceCity ?? '—';
  const lastMsg = item.lastMessage?.content ?? '暂无消息';
  const msgCount = item.messageCount ?? 0;
  const isTransferred = item.transferredBy !== null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-3 border-b border-gray-100 transition-colors hover:bg-gray-50 ${
        selected
          ? 'bg-primary/5 border-l-[3px] border-l-primary'
          : 'border-l-[3px] border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-gray-900 truncate text-sm">
          {displayName}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {isTransferred && (
            <Badge className="text-xs bg-red-100 text-red-600">转接</Badge>
          )}
          <Badge className={`text-xs ${modeInfo.className}`}>{modeInfo.label}</Badge>
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {phone}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {city}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 truncate flex-1">{lastMsg}</span>
        <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
          <MessageSquare className="w-3 h-3" />
          {msgCount}
        </span>
      </div>
      <div className="text-xs text-gray-300 mt-0.5">{formatTime(item.startedAt)}</div>
      {/* 未读/待回复红点 — 2026-08-15 新增 */}
      {item.unread && (
        <span
          className="absolute top-2 right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
          title="客户最新消息待回复"
        >
          待回复
        </span>
      )}
    </button>
  );
};

interface SessionListProps {
  sessions: ChatSessionListItem[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedId,
  loading,
  error,
  onSelect,
  onRetry,
}) => {
  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
        <span className="mb-2">{error}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          重试
        </Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
        <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
        暂无会话记录
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sessions.map((item: ChatSessionListItem) => (
        <SessionCard
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
};

export default SessionList;
