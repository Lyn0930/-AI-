import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { User, FileText, AlertCircle, Sparkles, Lightbulb, CheckCircle2, Route } from 'lucide-react';

import { Spinner } from '@client/src/components/ui/spinner';
import { Badge } from '@client/src/components/ui/badge';
import { getHandoffSummary, getCollectionProgress } from '@client/src/api/chat';
import { getSourceLabel } from '@shared/channels';
import { generateSummary } from '@client/src/api/summary';
import type {
  HandoffSummary,
  LeadStatus,
  CollectionProgress,
} from '@shared/api.interface';

const STATUS_LABELS: Record<string, string> = {
  new: '新线索',
  contacting: '联系中',
  chatting: '聊天中',
  collected: '已收集',
  closed: '已关闭',
};

const TRANSFER_LABELS: Record<string, string> = {
  customer: '客户主动',
  auto: 'AI自动',
  agent: '专员接管',
};
const INTENT_LABELS: Record<string, string> = {
  urgent_complaint: '紧急投诉',
  service_inquiry: '服务咨询',
  price_inquiry: '价格咨询',
  booking: '预约需求',
  after_sale: '售后问题',
  general: '一般咨询',
};
const INTENT_COLORS: Record<string, string> = {
  urgent_complaint: 'bg-red-100 text-red-700 border-red-200',
  service_inquiry: 'bg-blue-100 text-blue-700 border-blue-200',
  price_inquiry: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  booking: 'bg-green-100 text-green-700 border-green-200',
  after_sale: 'bg-orange-100 text-orange-700 border-orange-200',
  general: 'bg-gray-100 text-gray-700 border-gray-200',
};
interface InfoRowProps {
  label: string;
  value: string | null | undefined;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-2 py-1">
    <span className="text-xs text-gray-500 shrink-0">{label}</span>
    <span className="text-xs text-gray-800 text-right break-words">
      {value || '—'}
    </span>
  </div>
);

interface SuggestionItemProps {
  text: string;
  onClick: () => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ text, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left p-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
  >
    <div className="flex items-start gap-1.5">
      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      <span className="text-xs text-gray-700 group-hover:text-primary">
        {text}
      </span>
    </div>
  </button>
);

interface ContextPanelProps {
  sessionId: string | null;
  isManager: boolean;
  suggestions: string[];
  suggestionLoading: boolean;
  onSuggestionClick: (text: string) => void;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
  sessionId,
  isManager,
  suggestions,
  suggestionLoading,
  onSuggestionClick,
}) => {
  const [summary, setSummary] = useState<HandoffSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [progress, setProgress] = useState<CollectionProgress | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSummary(null);
      setAiSummary(null);
      setProgress(null);
      return;
    }
    setAiSummary(null);
    setProgress(null);
    setLoading(true);
    getHandoffSummary(sessionId, isManager)
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
    getCollectionProgress(sessionId)
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [sessionId, isManager]);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm px-4 text-center">
        选择会话后查看客户上下文
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        无法加载上下文信息
      </div>
    );
  }

  const isTransferred = summary.transferredBy !== null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
          <User className="w-3.5 h-3.5" />
          客户信息
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-0.5">
          <InfoRow label="姓名" value={summary.customerName} />
          <InfoRow label="电话" value={summary.phoneNumber} />
          <InfoRow label="城市" value={summary.serviceCity} />
          <InfoRow label="来源" value={getSourceLabel(summary.source)} />
          <div className="flex items-start justify-between gap-2 py-1">
            <span className="text-xs text-gray-500 shrink-0">线索状态</span>
            <Badge variant="outline" className="text-xs">
              {STATUS_LABELS[summary.leadStatus] ?? summary.leadStatus}
            </Badge>
          </div>
        </div>
      </div>

      {(summary.intent || summary.routingReason) && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 mb-1">
            <Route className="w-3.5 h-3.5" />
            路由信息
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 space-y-1">
            {summary.intent && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">AI意图</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${INTENT_COLORS[summary.intent] ?? INTENT_COLORS.general}`}>
                  {INTENT_LABELS[summary.intent] ?? summary.intent}
                </span>
              </div>
            )}
            {summary.routingReason && <InfoRow label="路由原因" value={summary.routingReason} />}
          </div>
        </div>
      )}

      {isTransferred && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            转接摘要
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5 space-y-0.5">
            <InfoRow label="转接原因" value={summary.transferReason} />
            <div className="flex items-start justify-between gap-2 py-1">
              <span className="text-xs text-gray-500 shrink-0">转接方</span>
              <span className="text-xs text-gray-800">
                {TRANSFER_LABELS[summary.transferredBy ?? ''] ?? '—'}
              </span>
            </div>
            <InfoRow label="消息总数" value={String(summary.messageCount)} />
            <InfoRow label="客户消息" value={String(summary.customerMessageCount)} />
            <InfoRow
              label="会话时长"
              value={dayjs().diff(dayjs(summary.sessionStartedAt), 'minute') + ' 分钟'}
            />
          </div>
        </div>
      )}

      <div className="px-3 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <FileText className="w-3.5 h-3.5" />
            需求采集进度
          </div>
          {progress && (
            <span className="text-xs font-bold text-primary">{progress.percent}%</span>
          )}
        </div>
        {progress ? (
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {progress.serviceTypeLabel}
              </Badge>
              <span className="text-xs text-gray-500">
                {progress.collectedCount}/{progress.totalCount} 已采集
              </span>
              {progress.status === 'completed' && (
                <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                  采集完成
                </Badge>
              )}
            </div>
            <div className="space-y-0.5">
              {progress.items.map((item) => (
                <div key={item.field} className="flex items-start gap-1.5 py-0.5">
                  {item.collected ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <div className={`w-3 h-3 rounded-full border shrink-0 mt-0.5 ${item.required ? 'border-gray-400' : 'border-gray-300'}`} />
                  )}
                  <span className="text-xs text-gray-500 shrink-0">
                    {item.label}{item.required && <span className="text-red-400">*</span>}
                  </span>
                  {item.collected && item.value && (
                    <span className="text-xs text-gray-800 break-words ml-auto text-right max-w-[120px] truncate">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {progress.aiSummary && (
              <div className="pt-1.5 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                  <Sparkles className="w-3 h-3" />
                  AI需求摘要
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {progress.aiSummary}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-center">
            <span className="text-xs text-gray-400">AI 尚未收集到需求信息</span>
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          AI 对话摘要
        </div>
        {aiSummary ? (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-2.5">
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
          </div>
        ) : (
          <button
            type="button"
            disabled={summaryLoading}
            onClick={() => {
              if (!sessionId) return;
              setSummaryLoading(true);
              setAiSummary(null);
              generateSummary(sessionId, isManager)
                .then((res) => setAiSummary(res.summary))
                .catch(() => setAiSummary('摘要生成失败，请稍后重试'))
                .finally(() => setSummaryLoading(false));
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-purple-200 bg-purple-50 text-xs text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {summaryLoading ? (
              <>
                <Spinner className="w-3.5 h-3.5" />
                AI 正在分析对话...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                生成 AI 对话摘要
              </>
            )}
          </button>
        )}
      </div>

      {suggestionLoading ? (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            AI 建议生成中...
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI 回复建议
          </div>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <SuggestionItem
                key={i}
                text={s}
                onClick={() => onSuggestionClick(s)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ContextPanel;
