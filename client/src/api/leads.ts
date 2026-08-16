import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Lead,
  LeadListParams,
  LeadListResponse,
  Requirement,
  DashboardStats,
  CreateLeadRequest,
  CaptchaResponse,
  SmsSendResponse,
  PoolListParams,
  PoolListResponse,
  AutoAssignResult,
  RecycleResult,
  GradeHistory,
  LeadGrade,
  UpdateRequirementRequest,
} from '@shared/api.interface';

export async function getLeads(params: LeadListParams): Promise<LeadListResponse> {
  const res = await axiosForBackend({
    url: '/api/leads',
    method: 'GET',
    params,
  });
  return res.data;
}

export async function getLeadById(id: string): Promise<Lead> {
  const res = await axiosForBackend({
    url: `/api/leads/${id}`,
    method: 'GET',
  });
  return res.data;
}

export async function getLeadRequirements(leadId: string): Promise<Requirement | null> {
  const res = await axiosForBackend({
    url: `/api/leads/${leadId}/requirements`,
    method: 'GET',
  });
  return res.data;
}

export async function assignLead(id: string, assigneeId: string): Promise<Lead> {
  const res = await axiosForBackend({
    url: `/api/leads/${id}/assign`,
    method: 'PATCH',
    data: { assigneeId },
  });
  return res.data;
}

export async function getLeadStats(): Promise<DashboardStats> {
  const res = await axiosForBackend({
    url: '/api/leads/stats',
    method: 'GET',
  });
  return res.data;
}

/**
 * 发送短信验证码（不需要登录）
 * 走 /api/public/sms/send POST
 */
export async function sendSmsCode(phoneNumber: string): Promise<SmsSendResponse> {
  const res = await axiosForBackend({
    url: '/api/public/sms/send',
    method: 'POST',
    data: { phoneNumber },
  });
  return res.data;
}

/**
 * 公开线索提交（不需要登录）
 * 走 /api/public/leads POST，与客服侧 PublicLeadsController 对应
 */
export async function createPublicLead(data: CreateLeadRequest): Promise<Lead> {
  const res = await axiosForBackend({
    url: '/api/public/leads',
    method: 'POST',
    data,
  });
  return res.data;
}

/**
 * 拉取图形验证码
 * 走 /api/public/captcha GET，返回 { key, svg, expiresAt }
 */
export async function fetchCaptcha(): Promise<CaptchaResponse> {
  const res = await axiosForBackend({
    url: '/api/public/captcha',
    method: 'GET',
  });
  return res.data;
}

export async function getPoolLeads(params: PoolListParams): Promise<PoolListResponse> {
  const res = await axiosForBackend({
    url: '/api/leads/pool',
    method: 'GET',
    params,
  });
  return res.data;
}

export async function claimLead(id: string): Promise<Lead> {
  const res = await axiosForBackend({
    url: `/api/leads/${id}/claim`,
    method: 'POST',
  });
  return res.data;
}

export async function autoAssignPool(): Promise<AutoAssignResult> {
  const res = await axiosForBackend({
    url: '/api/leads/auto-assign',
    method: 'POST',
  });
  return res.data;
}

export async function recycleLeads(): Promise<RecycleResult> {
  const res = await axiosForBackend({
    url: '/api/leads/recycle',
    method: 'POST',
  });
  return res.data;
}

export async function regradeLead(id: string, grade: LeadGrade, reason: string): Promise<Lead> {
  const res = await axiosForBackend({
    url: `/api/leads/${id}/regrade`,
    method: 'POST',
    data: { grade, reason },
  });
  return res.data;
}

export async function getLeadGradeHistory(leadId: string): Promise<GradeHistory[]> {
  const res = await axiosForBackend({
    url: `/api/leads/${leadId}/grade-history`,
    method: 'GET',
  });
  return res.data;
}

export async function updateRequirement(
  leadId: string,
  data: UpdateRequirementRequest,
): Promise<Requirement> {
  const res = await axiosForBackend({
    url: `/api/leads/${leadId}/requirements`,
    method: 'PATCH',
    data,
  });
  return res.data;
}
