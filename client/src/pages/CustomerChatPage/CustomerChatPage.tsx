import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { User, Send, AlertCircle, Headphones } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { Spinner } from '@client/src/components/ui/spinner';
import {
  getCustomerChat,
  getCustomerMessages,
  sendCustomerMessage,
  transferToHuman,
} from '@client/src/api/chat';
import type { ChatMessage, ChatSessionMode } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

const POLL_INTERVAL = 2000;
const TYPING_DELAY = 1000;

const SWAN_AVATAR_URL = '/spark/app/app_17buybqcty0/runtime/api/v1/storage/object/bucket_aadkpgd7eesiq_static/static%2Faadkpw3e3oehg_ve_miaoda';

const formatTime = (iso: string): string => dayjs(iso).format('HH:mm');

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.role === 'bot';
  const isAgent = message.role === 'agent';
  return (
    <div
      className={`flex items-start gap-2.5 ${isBot || isAgent ? 'justify-start' : 'justify-end'}`}
    >
      {(isBot || isAgent) && (
        <Image
          src={SWAN_AVATAR_URL}
          alt="小书"
          className={`w-9 h-9 rounded-full shrink-0 object-cover border-0 outline-none shadow-none bg-transparent ${isAgent ? '' : ''}`}
        />
      )}
      <div
        className={`flex flex-col ${isBot || isAgent ? 'items-start' : 'items-end'} max-w-[70%]`}
      >
        {isAgent && (
          <span className="text-xs text-green-600 mb-0.5 px-1">客服</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm break-words shadow-sm ${
            isAgent
              ? 'bg-green-50 border border-green-200 text-green-800 rounded-tl-sm'
              : isBot
                ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
      {!isBot && !isAgent && (
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 shadow-sm">
          <User className="w-5 h-5 text-gray-500" />
        </div>
      )}
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-2.5 justify-start">
    <Image
      src={SWAN_AVATAR_URL}
      alt="小书"
      className="w-9 h-9 rounded-full shrink-0 object-cover border-0 outline-none shadow-none bg-transparent"
    />
    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1s' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1s' }}
        />
      </div>
    </div>
  </div>
);

const WaitingIndicator: React.FC = () => (
  <div className="flex items-center justify-center gap-2 py-3 text-sm text-orange-500">
    <AlertCircle className="w-4 h-4" />
    <span>正在为您转接人工客服，请稍候...</span>
  </div>
);

const CustomerChatPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionMode, setSessionMode] = useState<ChatSessionMode>('ai');
  const [agentConnected, setAgentConnected] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionEndedRef = useRef(false);

  const pollMessages = useCallback(async () => {
    if (sessionEndedRef.current) return;
    try {
      const result = await getCustomerMessages(token, lastMessageIdRef.current);
      if (result.mode !== sessionMode) {
        setSessionMode(result.mode);
        if (result.mode === 'ai') {
          setAgentConnected(false);
        }
      }
      if (result.messages.length > 0) {
        setMessages((prev: ChatMessage[]) => {
          const existingIds = new Set(prev.map((m: ChatMessage) => m.id));
          const newMsgs = result.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
        lastMessageIdRef.current = result.messages[result.messages.length - 1].id;
        const hasAgentMsg = result.messages.some(
          (m: ChatMessage) => m.role === 'agent',
        );
        if (hasAgentMsg) {
          setAgentConnected(true);
          setIsTyping(false);
        }
        const hasBotReply = result.messages.some(
          (m: ChatMessage) => m.role === 'bot' || m.role === 'agent',
        );
        if (hasBotReply) {
          setIsTyping(false);
          if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = null;
          }
        }
      }
    } catch {
      // 静默处理轮询错误
    }
  }, [token, sessionMode]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const data = await getCustomerChat(token);
        if (cancelled) return;
        setMessages(data.messages);
        if (data.messages.length > 0) {
          lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
        }
        setSessionMode(data.session.mode);
        if (data.session.mode === 'human') {
          setAgentConnected(
            data.messages.some((m: ChatMessage) => m.role === 'agent'),
          );
        }
        if (data.session.status === 'completed') {
          sessionEndedRef.current = true;
        }
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError('链接无效或已过期');
        setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (loading || error) return;

    pollTimerRef.current = setInterval(pollMessages, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [loading, error, pollMessages]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTransfer = useCallback(async () => {
    if (transferring || sessionMode === 'human') return;
    setTransferring(true);
    try {
      await transferToHuman(token);
      setSessionMode('human');
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      setIsTyping(false);
    } catch {
      // 转人工失败静默处理
    } finally {
      setTransferring(false);
    }
  }, [token, transferring, sessionMode]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || sending) return;

    setSending(true);
    setInputValue('');

    try {
      const newMsg = await sendCustomerMessage(token, { content });
      setMessages((prev: ChatMessage[]) =>
        prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
      );
      lastMessageIdRef.current = newMsg.id;

      if (sessionMode === 'ai') {
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => {
          setIsTyping(true);
        }, TYPING_DELAY);
      }
    } catch {
      setInputValue(content);
    } finally {
      setSending(false);
    }
  }, [inputValue, sending, token, sessionMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isWaitingForAgent = sessionMode === 'human' && !agentConnected;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Spinner className="w-8 h-8 text-primary mb-3" />
        <span className="text-gray-500 text-sm">正在连接...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
        <span className="text-gray-500 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-lg mx-auto shadow-lg">
      {/* 顶部栏 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div
          className={`w-10 h-10 rounded-full shrink-0 overflow-hidden border-0 outline-none shadow-none bg-transparent ${
            agentConnected ? 'ring-2 ring-green-400' : ''
          }`}
        >
          <Image src={SWAN_AVATAR_URL} alt="小书" className="w-full h-full object-cover border-0 outline-none shadow-none bg-transparent" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-sm">
            {agentConnected ? '人工客服' : '小书'}
          </span>
          <span className="text-xs text-gray-500">
            {agentConnected
              ? '专员正在为您服务'
              : isWaitingForAgent
                ? '正在转接人工客服...'
                : '金牌保姆推荐官'}
          </span>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <Image src={SWAN_AVATAR_URL} alt="小书" className="w-12 h-12 mb-3 opacity-30 rounded-full border-0 outline-none shadow-none bg-transparent" />
            <span>开始与小书对话吧</span>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        {isTyping && <TypingIndicator />}
        {isWaitingForAgent && !isTyping && <WaitingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区域 */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
        {agentConnected && (
          <div className="flex items-center gap-1.5 mb-2 px-1 text-xs text-green-600">
            <Headphones className="w-3.5 h-3.5" />
            <span>人工客服已接入，专员正在为您服务</span>
          </div>
        )}
        {isWaitingForAgent && (
          <div className="flex items-center gap-1.5 mb-2 px-1 text-xs text-orange-500">
            <Headphones className="w-3.5 h-3.5" />
            <span>正在为您转接人工客服，请稍候...</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInputValue(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            className="min-h-[44px] max-h-32 resize-none field-sizing-none"
            rows={1}
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="shrink-0 h-11 w-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerChatPage;
