import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  SalaryConfig,
  CreateSalaryConfigRequest,
  UpdateSalaryConfigRequest,
} from '@shared/api.interface';

export async function getSalaryConfigs(serviceType?: string): Promise<SalaryConfig[]> {
  const res = await axiosForBackend({
    url: '/api/salary-config',
    method: 'GET',
    params: serviceType ? { serviceType } : undefined,
  });
  return res.data;
}

export async function createSalaryConfig(
  data: CreateSalaryConfigRequest,
): Promise<SalaryConfig> {
  const res = await axiosForBackend({
    url: '/api/salary-config',
    method: 'POST',
    data,
  });
  return res.data;
}

export async function updateSalaryConfig(
  id: string,
  data: UpdateSalaryConfigRequest,
): Promise<SalaryConfig> {
  const res = await axiosForBackend({
    url: `/api/salary-config/${id}`,
    method: 'PATCH',
    data,
  });
  return res.data;
}

export async function deleteSalaryConfig(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/salary-config/${id}`,
    method: 'DELETE',
  });
}
