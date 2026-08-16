import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { ConversationSummaryResponse } from '@shared/api.interface';

export const generateSummary = async (
  sessionId: string,
  all = false,
): Promise<ConversationSummaryResponse> => {
  const url = all
    ? `/api/chat/sessions/${sessionId}/summary?all=true`
    : `/api/chat/sessions/${sessionId}/summary`;
  const { data } = await axiosForBackend.post(url);
  return data;
};
