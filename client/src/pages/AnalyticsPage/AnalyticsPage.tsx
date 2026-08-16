import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  getTeamPerformance,
  getLeadFunnel,
  getTimeline,
  getSourceEffectiveness,
  getSystemHealth,
  getAiEffectiveness,
} from '@/api/stats';
import type {
  TeamPerformanceItem,
  LeadFunnel,
  TimelineItem,
  SystemHealth,
  SourceEffectiveness,
  AiEffectivenessResponse,
} from '@shared/api.interface';
import TeamPerformanceTable from './TeamPerformanceTable';
import SystemHealthCards from './SystemHealthCards';
import KpiDefinitionTable from './KpiDefinitionTable';
import KpiProgressChart from './KpiProgressChart';
import GradeFunnelChart from './GradeFunnelChart';

function buildFunnelOption(funnel: LeadFunnel): EChartsOption {
  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'funnel',
        sort: 'none',
        data: [
          { value: funnel.new, name: '新线索' },
          { value: funnel.contacting, name: '联系中' },
          { value: funnel.chatting, name: '沟通中' },
          { value: funnel.collected, name: '已采集' },
          { value: funnel.closed, name: '已关闭' },
        ],
        label: { show: true, position: 'inside' },
      },
    ],
  };
}

function buildSourceOption(data: SourceEffectiveness[]): EChartsOption {
  const sources = data.map((d: SourceEffectiveness) => d.source || '未知');
  const totals = data.map((d: SourceEffectiveness) => d.total);
  const converted = data.map((d: SourceEffectiveness) => d.converted);
  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sources,
      axisLabel: { rotate: 30 },
      boundaryGap: true,
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '总数',
        type: 'bar',
        data: totals,
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: '转化数',
        type: 'bar',
        data: converted,
        itemStyle: { color: '#10b981' },
      },
    ],
  };
}

function buildTimelineOption(data: TimelineItem[]): EChartsOption {
  const dates = data.map((d: TimelineItem) => d.date.slice(5));
  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: 45 },
      boundaryGap: true,
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新线索',
        type: 'line',
        data: data.map((d: TimelineItem) => d.newLeads),
        smooth: true,
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: '联系记录',
        type: 'line',
        data: data.map((d: TimelineItem) => d.contacts),
        smooth: true,
        itemStyle: { color: '#10b981' },
      },
      {
        name: '转化',
        type: 'line',
        data: data.map((d: TimelineItem) => d.conversions),
        smooth: true,
        itemStyle: { color: '#f59e0b' },
      },
    ],
  };
}

interface MetricCardProps {
  label: string;
  value: string | number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color }) => (
  <Card className="p-4">
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="text-2xl font-bold" style={{ color }}>
      {value}
    </div>
  </Card>
);

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamPerformance, setTeamPerformance] = useState<
    TeamPerformanceItem[]
  >([]);
  const [leadFunnel, setLeadFunnel] = useState<LeadFunnel | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [sourceEffectiveness, setSourceEffectiveness] = useState<
    SourceEffectiveness[]
  >([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [aiEffectiveness, setAiEffectiveness] = useState<AiEffectivenessResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tp, lf, tl, se, sh, ae] = await Promise.all([
          getTeamPerformance(),
          getLeadFunnel(),
          getTimeline(30),
          getSourceEffectiveness(),
          getSystemHealth(),
          getAiEffectiveness(),
        ]);
        setTeamPerformance(tp);
        setLeadFunnel(lf);
        setTimeline(tl);
        setSourceEffectiveness(se);
        setSystemHealth(sh);
        setAiEffectiveness(ae);
      } catch {
        setError('数据加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-red-500">{error}</span>
      </div>
    );
  }

  const totalConverted = leadFunnel
    ? leadFunnel.collected + leadFunnel.closed
    : 0;
  const conversionRate =
    systemHealth && systemHealth.totalLeads > 0
      ? Math.round((totalConverted / systemHealth.totalLeads) * 1000) / 10
      : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">经营分析看板</h1>

      {aiEffectiveness && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-l-4 border-primary pl-3">
            线索层AI效能
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">核心KPI定义</CardTitle>
            </CardHeader>
            <CardContent>
              <KpiDefinitionTable kpis={aiEffectiveness.kpis} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">核心KPI达成情况</CardTitle>
              </CardHeader>
              <CardContent>
                <KpiProgressChart kpis={aiEffectiveness.kpis} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">线索分级漏斗</CardTitle>
              </CardHeader>
              <CardContent>
                <GradeFunnelChart data={aiEffectiveness.gradeFunnel} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div
        data-ai-section-type="card-stat"
        className="grid grid-cols-5 gap-4"
      >
        <MetricCard
          label="总线索"
          value={systemHealth?.totalLeads ?? 0}
          color="#3b82f6"
        />
        <MetricCard
          label="今日新增"
          value={systemHealth?.todayNew ?? 0}
          color="#10b981"
        />
        <MetricCard
          label="公海规模"
          value={systemHealth?.poolSize ?? 0}
          color="#f59e0b"
        />
        <MetricCard
          label="活跃会话"
          value={systemHealth?.activeSessions ?? 0}
          color="#8b5cf6"
        />
        <MetricCard
          label="转化率"
          value={`${conversionRate}%`}
          color="#ef4444"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">团队效能</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamPerformanceTable data={teamPerformance} loading={false} />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">系统健康</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemHealthCards data={systemHealth} loading={false} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">线索漏斗</CardTitle>
          </CardHeader>
          <CardContent>
            {leadFunnel && (
              <ReactECharts
                option={buildFunnelOption(leadFunnel)}
                theme="ud"
                className="h-[300px]"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">来源效果分析</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={buildSourceOption(sourceEffectiveness)}
              theme="ud"
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">30 天趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={buildTimelineOption(timeline)}
            theme="ud"
            className="h-[300px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
