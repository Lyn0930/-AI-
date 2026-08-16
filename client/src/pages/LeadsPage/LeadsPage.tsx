import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Eye, UserCog, Hand, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead, LeadListParams, LeadListResponse, LeadStatus, PoolListParams } from '@shared/api.interface';
import { getLeads, assignLead, getPoolLeads, claimLead } from '@client/src/api/leads';
import { getSourceLabel } from '@shared/channels';
import PoolActions from './PoolActions';
import { useRole } from '@client/src/hooks/useRole';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { UserSelect } from '@/components/business-ui/user-select';
import { UserDisplay } from '@/components/business-ui/user-display';

/* ============ 常量映射 ============ */

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'new', label: '新线索' },
  { value: 'contacting', label: '联系中' },
  { value: 'chatting', label: '聊天中' },
  { value: 'collected', label: '已收集' },
  { value: 'closed', label: '已关闭' },
  { value: 'nurturing', label: '培育中' },
  { value: 'recycled', label: '已回收' },
  { value: 'filtered', label: '已过滤' },
];

const STATUS_MAP: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: '新线索', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  contacting: { label: '联系中', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  chatting: { label: '聊天中', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  collected: { label: '已收集', className: 'bg-green-100 text-green-700 border-green-200' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  nurturing: { label: '培育中', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  recycled: { label: '已回收', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  filtered: { label: '已过滤', className: 'bg-red-100 text-red-600 border-red-200' },
};

const GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部分级' },
  { value: 'A', label: 'A级' },
  { value: 'B', label: 'B级' },
  { value: 'C', label: 'C级' },
  { value: 'D', label: 'D级' },
  { value: 'E', label: 'E级' },
];

const URGENCY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部紧急度' },
  { value: 'high', label: '紧急' },
  { value: 'medium', label: '一般' },
  { value: 'low', label: '不急' },
];

const GRADE_MAP: Record<string, { label: string; className: string }> = {
  A: { label: 'A', className: 'bg-green-100 text-green-700 border-green-200' },
  B: { label: 'B', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  C: { label: 'C', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  D: { label: 'D', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  E: { label: 'E', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const PAGE_SIZE = 10;

type LeadTab = 'all' | 'mine' | 'pool';

interface AppliedFilters {
  status: string;
  city: string;
  keyword: string;
  leadGrade: string;
  urgencyLevel: string;
}

/* ============ 工具函数 ============ */

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ============ 子组件 ============ */

interface StatusBadgeProps {
  status: LeadStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = STATUS_MAP[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
};

/* ============ 主页面 ============ */

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useRole();
  const isManager = role === 'manager';
  // 输入状态（仅控制表单，不触发请求）
  const [statusInput, setStatusInput] = useState<string>('');
  const [cityInput, setCityInput] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [gradeInput, setGradeInput] = useState<string>('');
  const [urgencyInput, setUrgencyInput] = useState<string>('');

  // 已应用的筛选条件（触发请求）
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    status: '',
    city: '',
    keyword: '',
    leadGrade: '',
    urgencyLevel: '',
  });

  // 数据状态
  const [data, setData] = useState<LeadListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [tab, setTab] = useState<LeadTab>(isManager ? 'all' : 'mine');

  // 分配客服弹窗状态
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const fetchLeads = useCallback(
    async (p: number, filters: AppliedFilters, currentTab: LeadTab) => {
      setLoading(true);
      setError(null);
      try {
        if (currentTab === 'pool') {
          const params: PoolListParams = { page: p, pageSize: PAGE_SIZE };
          if (filters.city.trim()) params.serviceCity = filters.city.trim();
          if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
          const res = await getPoolLeads(params);
          setData(res);
        } else {
          const params: LeadListParams = {
            page: p,
            pageSize: PAGE_SIZE,
          };
          if (currentTab === 'mine') {
            params.role = 'agent';
          }
          if (filters.status) {
            params.status = filters.status as LeadStatus;
          }
          if (filters.city.trim()) {
            params.serviceCity = filters.city.trim();
          }
          if (filters.keyword.trim()) {
            params.keyword = filters.keyword.trim();
          }
          if (filters.leadGrade) {
            params.leadGrade = filters.leadGrade;
          }
          if (filters.urgencyLevel) {
            params.urgencyLevel = filters.urgencyLevel;
          }
          const res = await getLeads(params);
          setData(res);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载线索失败');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchLeads(page, appliedFilters, tab);
  }, [page, appliedFilters, fetchLeads, tab]);

  useEffect(() => {
    setTab(isManager ? 'all' : 'mine');
    setPage(1);
  }, [role]);

  // 事件处理
  const handleSearch = () => {
    setAppliedFilters({
      status: statusInput,
      city: cityInput,
      keyword: keywordInput,
      leadGrade: gradeInput,
      urgencyLevel: urgencyInput,
    });
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
    if (page < totalPages) setPage(page + 1);
  };

  const handleRefresh = () => {
    fetchLeads(page, appliedFilters, tab);
  };

  const handleViewDetail = (id: string) => {
    navigate(`/leads/${id}`);
  };

  const handleClaim = async (leadId: string) => {
    try {
      await claimLead(leadId);
      toast.success('领取成功');
      fetchLeads(page, appliedFilters, tab);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '领取失败');
    }
  };

  const handleOpenAssign = (lead: Lead) => {
    setAssigningLeadId(lead.id);
    setAssignUserId(lead.assigneeId);
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!assigningLeadId || !assignUserId) return;
    setAssignSubmitting(true);
    try {
      await assignLead(assigningLeadId, assignUserId);
      toast.success('分配成功');
      setAssignOpen(false);
      setAssigningLeadId(null);
      setAssignUserId(null);
      fetchLeads(page, appliedFilters, tab);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '分配失败');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // 渲染
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">线索管理</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              className={`px-3 py-1 text-sm rounded-md transition-colors ${tab === (isManager ? 'all' : 'mine') ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
              onClick={() => { setTab(isManager ? 'all' : 'mine'); setPage(1); }}
            >
              {isManager ? '全部线索' : '我的线索'}
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md transition-colors ${tab === 'pool' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
              onClick={() => { setTab('pool'); setPage(1); }}
            >
              公海
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isManager && tab === 'pool' && <PoolActions onRefresh={() => fetchLeads(page, appliedFilters, tab)} />}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} />
            刷新
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
        <Select value={statusInput} onValueChange={setStatusInput}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="服务城市"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-[160px]"
        />

        <Input
          placeholder="搜索客户姓名/电话"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-[240px]"
        />

        <Select value={gradeInput} onValueChange={setGradeInput}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部分级" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={urgencyInput} onValueChange={setUrgencyInput}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部紧急度" />
          </SelectTrigger>
          <SelectContent>
            {URGENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSearch} disabled={loading}>
          <Search />
          搜索
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 数据表格 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">加载中...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无线索数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">客户姓名</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">电话</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">服务城市</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">来源</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">状态</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">分级</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">评分</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">负责客服</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">分配时间</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">最后跟进</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">创建时间</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead: Lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDetail(lead.id)}
                >
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {lead.customerName || '未填写'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 break-all">
                    {lead.phoneNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {lead.serviceCity || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getSourceLabel(lead.source)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    {lead.leadGrade ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={GRADE_MAP[lead.leadGrade]?.className}>
                          {GRADE_MAP[lead.leadGrade]?.label ?? lead.leadGrade}
                        </Badge>
                        {lead.gradeConfidence != null && lead.gradeConfidence < 0.7 && (
                          <span
                            className="text-orange-500"
                            title={`置信度 ${Math.round(lead.gradeConfidence * 100)}%，待人工复核`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {lead.leadScore != null ? lead.leadScore : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.assigneeId ? (
                      <UserDisplay value={[lead.assigneeId]} size="small" />
                    ) : (
                      <span className="text-sm text-gray-400">未分配</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {lead.assignedAt ? formatDate(lead.assignedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {lead.lastFollowedUpAt ? formatDate(lead.lastFollowedUpAt) : '未跟进'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {tab === 'pool' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(lead.id);
                          }}
                        >
                          <Hand />
                          领取
                        </Button>
                      ) : (
                        <>
                          {isManager && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAssign(lead);
                              }}
                            >
                              <UserCog />
                              分配
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(lead.id);
                        }}
                      >
                        <Eye />
                        查看
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            共 {total} 条，第 {page} / {totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page <= 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page >= totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 分配客服 Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配负责客服</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">负责客服</label>
              <UserSelect
                value={assignUserId}
                onChange={setAssignUserId}
                placeholder="请选择客服"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignSubmitting || !assignUserId}
            >
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsPage;
