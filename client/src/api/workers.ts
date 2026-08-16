import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Worker,
  WorkerDetail,
  WorkerListParams,
  WorkerListResponse,
  CreateWorkerRequest,
  UpdateWorkerRequest,
  WorkerSkill,
  WorkerAvailability,
} from '@shared/api.interface';

export async function getWorkers(params: WorkerListParams): Promise<WorkerListResponse> {
  const res = await axiosForBackend({
    url: '/api/workers',
    method: 'GET',
    params,
  });
  return res.data;
}

export async function getWorkerById(id: string): Promise<WorkerDetail> {
  const res = await axiosForBackend({
    url: `/api/workers/${id}`,
    method: 'GET',
  });
  return res.data;
}

export async function createWorker(data: CreateWorkerRequest): Promise<Worker> {
  const res = await axiosForBackend({
    url: '/api/workers',
    method: 'POST',
    data,
  });
  return res.data;
}

export async function updateWorker(id: string, data: UpdateWorkerRequest): Promise<Worker> {
  const res = await axiosForBackend({
    url: `/api/workers/${id}`,
    method: 'PATCH',
    data,
  });
  return res.data;
}

export async function deleteWorker(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/workers/${id}`,
    method: 'DELETE',
  });
}

export async function addWorkerSkill(
  workerId: string,
  data: { skillTag: string; proficiency?: string },
): Promise<WorkerSkill> {
  const res = await axiosForBackend({
    url: `/api/workers/${workerId}/skills`,
    method: 'POST',
    data,
  });
  return res.data;
}

export async function removeWorkerSkill(workerId: string, skillId: string): Promise<void> {
  await axiosForBackend({
    url: `/api/workers/${workerId}/skills/${skillId}`,
    method: 'DELETE',
  });
}

export async function addWorkerAvailability(
  workerId: string,
  data: { date: string; timeSlot: string; status?: string },
): Promise<WorkerAvailability> {
  const res = await axiosForBackend({
    url: `/api/workers/${workerId}/availability`,
    method: 'POST',
    data,
  });
  return res.data;
}

export async function removeWorkerAvailability(
  workerId: string,
  availabilityId: string,
): Promise<void> {
  await axiosForBackend({
    url: `/api/workers/${workerId}/availability/${availabilityId}`,
    method: 'DELETE',
  });
}
