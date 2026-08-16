import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TeamPerformanceItem,
  LeadFunnel,
  TimelineItem,
  SystemHealth,
  SourceEffectiveness,
  GradeFunnelItem,
  AiEffectivenessResponse,
} from '@shared/api.interface';

export async function getTeamPerformance(): Promise<TeamPerformanceItem[]> {
  const res = await axiosForBackend({
    url: '/api/stats/team-performance',
    method: 'GET',
  });
  return res.data;
}

export async function getLeadFunnel(): Promise<LeadFunnel> {
  const res = await axiosForBackend({
    url: '/api/stats/lead-funnel',
    method: 'GET',
  });
  return res.data;
}

export async function getTimeline(days = 30): Promise<TimelineItem[]> {
  const res = await axiosForBackend({
    url: '/api/stats/timeline',
    method: 'GET',
    params: { days },
  });
  return res.data;
}

export async function getSourceEffectiveness(): Promise<SourceEffectiveness[]> {
  const res = await axiosForBackend({
    url: '/api/stats/source-effectiveness',
    method: 'GET',
  });
  return res.data;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const res = await axiosForBackend({
    url: '/api/stats/system-health',
    method: 'GET',
  });
  return res.data;
}

export async function getGradeFunnel(): Promise<GradeFunnelItem[]> {
  const res = await axiosForBackend({
    url: '/api/stats/grade-funnel',
    method: 'GET',
  });
  return res.data;
}

export async function getAiEffectiveness(): Promise<AiEffectivenessResponse> {
  const res = await axiosForBackend({
    url: '/api/stats/ai-effectiveness',
    method: 'GET',
  });
  return res.data;
}
