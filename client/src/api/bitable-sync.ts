import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  BitableSyncStatus,
  BitableSyncResult,
  BitableSyncLeadItem,
} from '@shared/api.interface';

export const getSyncStatus = async (): Promise<BitableSyncStatus> => {
  const { data } = await axiosForBackend.get('/api/bitable-sync/status');
  return data;
};

export const getUnsyncedLeads = async (): Promise<BitableSyncLeadItem[]> => {
  const { data } = await axiosForBackend.get('/api/bitable-sync/unsynced');
  return data;
};

export const syncLead = async (leadId: string): Promise<BitableSyncResult> => {
  const { data } = await axiosForBackend.post(
    `/api/bitable-sync/sync/${leadId}`,
  );
  return data;
};

export const syncAll = async (): Promise<BitableSyncResult> => {
  const { data } = await axiosForBackend.post('/api/bitable-sync/sync-all');
  return data;
};
