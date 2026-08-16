import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  CityAssignment,
  CreateCityAssignmentRequest,
  UpdateCityAssignmentRequest,
} from '@shared/api.interface';

export async function getCityAssignments(): Promise<CityAssignment[]> {
  const res = await axiosForBackend({
    url: '/api/assignments',
    method: 'GET',
  });
  return res.data;
}

export async function createCityAssignment(
  data: CreateCityAssignmentRequest,
): Promise<CityAssignment> {
  const res = await axiosForBackend({
    url: '/api/assignments',
    method: 'POST',
    data,
  });
  return res.data;
}

export async function updateCityAssignment(
  id: string,
  data: UpdateCityAssignmentRequest,
): Promise<CityAssignment> {
  const res = await axiosForBackend({
    url: `/api/assignments/${id}`,
    method: 'PATCH',
    data,
  });
  return res.data;
}

export async function deleteCityAssignment(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/assignments/${id}`,
    method: 'DELETE',
  });
}
