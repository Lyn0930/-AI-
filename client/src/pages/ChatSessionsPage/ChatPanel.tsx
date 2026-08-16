import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Phone, MapPin, User, Headphones, Send, MessageSquare, Sparkles, Zap, Plus, Trash2, Settings2, X } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Spinner } from '@client/src/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@client/src/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import type {
  ChatSessionDetail,
  ChatMessage,
  ChatSessionStatus,
  ChatSessionMode,
} from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';
import { useCurrentUserProfile } from '@lark-apaas/client-toolkit/hooks/useCurrentUserProfile';
import { loadQuickReplies, saveQuickReplies } from './quickReplies';

const SWAN_AVATAR_URL = '/spark/app/app_17buybqcty0/runtime/api/v1/storage/object/bucket_aadkpgd7eesiq_static/static%2Faadkpw3e3oehg_ve_miaoda';

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
  ai: { label: 'AI 自动', className: 'bg-blue-100 text-blue-700' },
  human: { label: '人工接管', className: 'bg-orange-100 text-orange-700' },
};

const formatTime = (iso: string): string => {
  const d = dayjs(iso);
  const now = dayjs();
  if (d.isSame(now, 'day')) return d.format('HH:mm');
  if (d.isSame(now.subtract(1, 'day'), 'day'))
    return `昨天 ${d.format('HH:mm')}`;
  return d.format('MM-DD HH:mm');
};

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.role === 'bot';
  const isAgent = message.role === 'agent';
  const isRight = isAgent;

  return (
    <div
      className={`flex items-start gap-2 ${isRight ? 'justify-end' : 'justify-start'}`}
    >
      {!isRight && (
        isBot ? (
          <Image
            src={SWAN_AVATAR_URL}
            alt="小书"
            className="w-8 h-8 rounded-full shrink-0 object-cover border-0 outline-none shadow-none bg-transparent"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )
      )}
      <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {isAgent && (
          <span className="text-xs text-green-600 mb-0.5">客服</span>
        )}
        <div
          className={`rounded-lg px-3 py-2 text-sm break-words ${
            isAgent
              ? 'bg-primary text-primary-foreground'
              : isBot
                ? 'bg-gray-100 text-gray-800'
                : 'bg-white border border-gray-200 text-gray-800'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-400 mt-1">{formatTime(message.createdAt)}</span>
      </div>
      {isRight && (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <Headphones className="w-4 h-4 text-green-600" />
        </div>
      )}
    </div>
  );
};

interface ChatPanelProps {
  detail: ChatSessionDetail | null;
  loading: boolean;
  isManager: boolean;
  actionLoading: boolean;
  suggestionLoading: boolean;
  suggestionText: string | null;
  onTakeover: () => void;
  onRelease: () => void;
  onSendAgentMessage: (content: string) => void;
  onRequestSuggestions: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  detail,
  loading,
  isManager,
  actionLoading,
  suggestionLoading,
  suggestionText,
  onTakeover,
  onRelease,
  onSendAgentMessage,
  onRequestSuggestions,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [inputText, setInputText] = useState('');

  const userInfo = useCurrentUserProfile();
  const userId = userInfo?.user_id;
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [newReplyDraft, setNewReplyDraft] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

  // 智能滚动：只在用户本来就停靠在底部时才跟随新消息；
  // 用户向上翻看历史时，新消息不会把视口拽回底部（不打断阅读、不影响输入）
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [detail?.messages, loading, isAtBottom]);

  useEffect(() => {
    if (suggestionText) {
      setInputText(suggestionText);
    }
  }, [suggestionText]);

  useEffect(() => {
    setQuickReplies(loadQuickReplies(userId));
  }, [userId]);

  const persist = (next: string[]) => {
    setQuickReplies(next);
    saveQuickReplies(userId, next);
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSendAgentMessage(text);
    setInputText('');
  };

  const handlePickQuickReply = (content: string) => {
    setInputText(content);
  };

  const handleDeleteQuickReply = (idx: number) => {
    persist(quickReplies.filter((_, i) => i !== idx));
  };

  const handleAddQuickReply = () => {
    const draft = newReplyDraft.trim();
    if (!draft) return;
    persist([...quickReplies, draft]);
    setNewReplyDraft('');
  };

  const handleStartEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditingDraft(quickReplies[idx]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const draft = editingDraft.trim();
    if (!draft) return;
    const next = quickReplies.slice();
    next[editingIndex] = draft;
    persist(next);
    setEditingIndex(null);
    setEditingDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
        <span>请从左侧选择一个会话查看详情</span>
      </div>
    );
  }

  const lead = detail.lead;
  const statusInfo = STATUS_MAP[detail.status] ?? STATUS_MAP.completed;
  const modeInfo = MODE_MAP[detail.mode] ?? MODE_MAP.ai;
  const isHumanMode = detail.mode === 'human';
  const canOperate = !isManager;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900 text-sm">
              {lead?.customerName ?? '未知客户'}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {lead?.phoneNumber ?? '—'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {lead?.serviceCity ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className={modeInfo.className}>{modeInfo.label}</Badge>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
            {canOperate &&
              (isHumanMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRelease}
                  disabled={actionLoading}
                >
                  释放回 AI
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTakeover}
                  disabled={actionLoading}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  接管
                </Button>
              ))}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
      >
        {detail.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            暂无聊天记录
          </div>
        ) : (
          detail.messages.map((msg: ChatMessage) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
      </div>

      {canOperate && isHumanMode && (
        <div className="px-4 py-2.5 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestSuggestions}
              disabled={suggestionLoading}
              className="shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${suggestionLoading ? 'animate-spin' : ''}`} />
              AI建议
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  title="插入常用语（填入输入框，可修改后发送）"
                >
                  <Zap className="w-3.5 h-3.5" />
                  常用语
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
                {quickReplies.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-gray-400 text-center">
                    还没有常用语，点右边的"管理"加一条
                  </div>
                ) : (
                  quickReplies.map((content, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={() => handlePickQuickReply(content)}
                      className="py-2"
                    >
                      <span className="text-sm whitespace-pre-wrap line-clamp-3">
                        {content}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover open={manageOpen} onOpenChange={setManageOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-gray-500"
                  title="管理我的常用语"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96 p-0">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium">管理我的常用语</span>
                  <button
                    type="button"
                    onClick={() => setManageOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-4 py-3 max-h-80 overflow-y-auto space-y-2">
                  {quickReplies.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-6">
                      还没有常用语，在下方添加第一条
                    </div>
                  ) : (
                    quickReplies.map((content, idx) =>
                      editingIndex === idx ? (
                        <div
                          key={idx}
                          className="border border-blue-200 rounded-md p-2 bg-blue-50"
                        >
                          <Textarea
                            value={editingDraft}
                            onChange={(e) => setEditingDraft(e.target.value)}
                            className="min-h-[60px] text-sm"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingIndex(null);
                                setEditingDraft('');
                              }}
                            >
                              取消
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit}>
                              保存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={idx}
                          className="group flex items-start gap-2 p-2 border border-gray-200 rounded-md hover:border-gray-300"
                        >
                          <span className="flex-1 text-sm whitespace-pre-wrap">
                            {content}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idx)}
                            className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="编辑"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuickReply(idx)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ),
                    )
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-200 space-y-2">
                  <Textarea
                    placeholder="新常用语内容（Enter 添加，Shift+Enter 换行）"
                    value={newReplyDraft}
                    onChange={(e) => setNewReplyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddQuickReply();
                      }
                    }}
                    className="min-h-[60px] text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddQuickReply}
                    disabled={!newReplyDraft.trim()}
                    className="w-full"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加常用语
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Input
              placeholder="输入回复内容..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={actionLoading || !inputText.trim()}
            >
              <Send className="w-4 h-4" />
              发送
            </Button>
          </div>
        </div>
      )}

      {isManager && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center text-xs text-gray-400">
          管理者模式下为只读，无法操作会话
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
