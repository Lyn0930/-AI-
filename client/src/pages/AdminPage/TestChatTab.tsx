import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { testChat } from '@client/src/api/admin';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { ScrollArea } from '@client/src/components/ui/scroll-area';

interface ChatMessageItem {
  role: 'customer' | 'bot';
  content: string;
}

const TestChatTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: ChatMessageItem[] = [
      ...messages,
      { role: 'customer', content: trimmed },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await testChat({
        message: trimmed,
        history,
      });

      setMessages((prev) => [...prev, { role: 'bot', content: res.reply }]);
    } catch {
      toast.error('AI 回复失败，请检查插件配置');
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: '抱歉，回复失败，请稍后重试。' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1 rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">AI 客服测试面板</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重置对话
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="h-[480px] overflow-y-auto px-4 py-4 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              输入消息开始测试 AI 客服效果
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'customer' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'customer'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="mb-0.5 text-xs opacity-60">
                    {msg.role === 'customer' ? '客户' : 'AI 客服'}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入客户消息，按 Enter 发送，Shift+Enter 换行"
              rows={1}
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-[40px] w-[40px] shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-[240px] shrink-0 space-y-3">
        <div className="rounded-lg border bg-white p-4">
          <h4 className="mb-2 text-sm font-medium">使用说明</h4>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li>输入消息模拟客户对话</li>
            <li>AI 使用当前配置的人设和 QA 知识库</li>
            <li>对话不会创建真实线索或会话</li>
            <li>修改 AI 配置后立即生效</li>
          </ul>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h4 className="mb-2 text-sm font-medium">对话统计</h4>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>客户消息</span>
              <span className="font-medium text-gray-900">
                {messages.filter((m) => m.role === 'customer').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>AI 回复</span>
              <span className="font-medium text-gray-900">
                {messages.filter((m) => m.role === 'bot').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestChatTab;
