import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ContactLog,
  CreateContactLogRequest,
} from '@shared/api.interface';

export async function getContactLogs(leadId: string): Promise<ContactLog[]> {
  const res = await axiosForBackend({
    url: `/api/leads/${leadId}/contact-logs`,
    method: 'GET',
  });
  return res.data;
}

export async function createContactLog(
  leadId: string,
  data: CreateContactLogRequest,
): Promise<ContactLog> {
  const res = await axiosForBackend({
    url: `/api/leads/${leadId}/contact-logs`,
    method: 'POST',
    data,
  });
  return res.data;
}
