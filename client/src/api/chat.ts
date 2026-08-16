import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  ChatSessionListResponse,
  CustomerChatInfo,
  CustomerPollResult,
  SendMessageRequest,
  ReplySuggestion,
  HandoffSummary,
  CollectionProgress,
} from '@shared/api.interface';

export async function getChatSessions(
  params: { status?: string; page?: number; pageSize?: number; all?: boolean },
): Promise<ChatSessionListResponse> {
  const res = await axiosForBackend({
    url: '/api/chat/sessions',
    method: 'GET',
    params: { ...params, all: params.all ? 'true' : undefined },
  });
  return res.data;
}

export async function getChatSessionDetail(id: string, all = false): Promise<ChatSessionDetail> {
  const res = await axiosForBackend({
    url: `/api/chat/sessions/${id}`,
    method: 'GET',
    params: all ? { all: 'true' } : {},
  });
  return res.data;
}

export async function getCustomerChat(token: string): Promise<CustomerChatInfo> {
  const res = await axiosForBackend({
    url: `/api/public/chat/${token}`,
    method: 'GET',
  });
  return res.data;
}

export async function getCustomerMessages(
  token: string,
  afterId?: string,
): Promise<CustomerPollResult> {
  const res = await axiosForBackend({
    url: `/api/public/chat/${token}/messages`,
    method: 'GET',
    params: afterId ? { afterId } : {},
  });
  return res.data;
}

export async function sendCustomerMessage(
  token: string,
  data: SendMessageRequest,
): Promise<ChatMessage> {
  const res = await axiosForBackend({
    url: `/api/public/chat/${token}/messages`,
    method: 'POST',
    data,
  });
  return res.data;
}

export async function takeoverSession(sessionId: string): Promise<ChatSession> {
  const res = await axiosForBackend({
    url: `/api/chat/sessions/${sessionId}/takeover`,
    method: 'POST',
  });
  return res.data;
}

export async function releaseSession(sessionId: string): Promise<ChatSession> {
  const res = await axiosForBackend({
    url: `/api/chat/sessions/${sessionId}/release`,
    method: 'POST',
  });
  return res.data;
}

export async function sendAgentMessage(
  sessionId: string,
  content: string,
): Promise<ChatMessage> {
  const res = await axiosForBackend({
    url: `/api/chat/sessions/${sessionId}/messages`,
    method: 'POST',
    data: { content },
  });
  return res.data;
}

export async function transferToHuman(
  token: string,
  reason?: string,
): Promise<{ success: boolean }> {
  const res = await axiosForBackend({
    url: `/api/public/chat/${token}/transfer`,
    method: 'POST',
    data: { reason },
  });
  return res.data;
}

export async function getReplySuggestions(
  sessionId: string,
): Promise<ReplySuggestion> {
  const res = await axiosForBackend({
    url: `/api/chat/sessions/${sessionId}/suggestions`,
    method: 'POST',
  });
  return res.data;
}

export async function getHandoffSummary(
  sessionId: string,
  all = false,
): Promise<HandoffSummary> {
  const res = await axiosForBackend({
    url: `/api/chat/sessions/${sessionId}/handoff-summary`,
    method: 'GET',
    params: all ? { all: 'true' } : {},
  });
  return res.data;
}

export async function getCollectionProgress(
  sessionId: string,
): Promise<CollectionProgress> {
  const res = await axiosForBackend({
    url: `/api/chat/sessions/${sessionId}/progress`,
    method: 'GET',
  });
  return res.data;
}
