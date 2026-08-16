import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  QAEntry,
  CreateQAEntryRequest,
  UpdateQAEntryRequest,
  AIConfigItem,
  UpdateAIConfigRequest,
  TestChatRequest,
  TestChatResponse,
  LearnedTemplate,
  UpdateLearnedTemplateRequest,
} from '@shared/api.interface';

export async function listQa(category?: string): Promise<QAEntry[]> {
  const res = await axiosForBackend({
    url: '/api/admin/qa',
    method: 'GET',
    params: category ? { category } : undefined,
  });
  return res.data;
}

export async function createQa(data: CreateQAEntryRequest): Promise<QAEntry> {
  const res = await axiosForBackend({
    url: '/api/admin/qa',
    method: 'POST',
    data,
  });
  return res.data;
}

export async function updateQa(
  id: string,
  data: UpdateQAEntryRequest,
): Promise<QAEntry> {
  const res = await axiosForBackend({
    url: `/api/admin/qa/${id}`,
    method: 'PUT',
    data,
  });
  return res.data;
}

export async function deleteQa(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/admin/qa/${id}`,
    method: 'DELETE',
  });
}

export async function getAiConfig(): Promise<AIConfigItem[]> {
  const res = await axiosForBackend({
    url: '/api/admin/ai-config',
    method: 'GET',
  });
  return res.data;
}

export async function updateAiConfig(
  data: UpdateAIConfigRequest,
): Promise<void> {
  await axiosForBackend({
    url: '/api/admin/ai-config',
    method: 'PUT',
    data,
  });
}

export async function testChat(
  data: TestChatRequest,
): Promise<TestChatResponse> {
  const res = await axiosForBackend({
    url: '/api/admin/test-chat',
    method: 'POST',
    data,
  });
  return res.data;
}

export async function listLearnedTemplates(): Promise<LearnedTemplate[]> {
  const res = await axiosForBackend({
    url: '/api/admin/learned-templates',
    method: 'GET',
  });
  return res.data;
}

export async function deleteLearnedTemplate(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/admin/learned-templates/${id}`,
    method: 'DELETE',
  });
}

export async function updateLearnedTemplate(
  id: string,
  data: UpdateLearnedTemplateRequest,
): Promise<LearnedTemplate> {
  const res = await axiosForBackend({
    url: `/api/admin/learned-templates/${id}`,
    method: 'PATCH',
    data,
  });
  return res.data;
}
