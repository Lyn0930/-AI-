import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CityAssignment } from '@shared/api.interface';
import {
  getCityAssignments,
  createCityAssignment,
  updateCityAssignment,
  deleteCityAssignment,
} from '@client/src/api/assignment';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { UserSelect } from '@/components/business-ui/user-select';
import { UserDisplay } from '@/components/business-ui/user-display';
import AgentSkillsTab from './AgentSkillsTab';
import AgentWorkloadTab from './AgentWorkloadTab';
import SalaryConfigTab from './SalaryConfigTab';

const CityAssignmentTab: React.FC = () => {
  const [assignments, setAssignments] = useState<CityAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newAssignee, setNewAssignee] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<CityAssignment | null>(null);
  const [editAssignee, setEditAssignee] = useState<string | null>(null);
  const [editCity, setEditCity] = useState('');

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCityAssignments();
      setAssignments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleAdd = async () => {
    if (!newCity.trim() || !newAssignee) return;
    setSubmitting(true);
    try {
      await createCityAssignment({
        serviceCity: newCity.trim(),
        assigneeId: newAssignee,
      });
      toast.success('添加成功');
      setAddOpen(false);
      setNewCity('');
      setNewAssignee(null);
      fetchAssignments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const trimmedCity = editCity.trim();
    const cityChanged = trimmedCity && trimmedCity !== editTarget.serviceCity;
    const assigneeChanged = editAssignee && editAssignee !== editTarget.assigneeId;
    if (!cityChanged && !assigneeChanged) return;

    const updateData: { serviceCity?: string; assigneeId?: string } = {};
    if (cityChanged) updateData.serviceCity = trimmedCity;
    if (assigneeChanged) updateData.assigneeId = editAssignee;

    setSubmitting(true);
    try {
      await updateCityAssignment(editTarget.id, updateData);
      toast.success('更新成功');
      setEditTarget(null);
      setEditAssignee(null);
      setEditCity('');
      fetchAssignments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCityAssignment(id);
      toast.success('删除成功');
      fetchAssignments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const openEdit = (item: CityAssignment) => {
    setEditTarget(item);
    setEditAssignee(item.assigneeId);
    setEditCity(item.serviceCity);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={fetchAssignments} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          刷新
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          新增映射
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading && assignments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">加载中...</div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            暂无分配映射，点击「新增映射」创建
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">服务城市</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">负责客服</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item: CityAssignment) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{item.serviceCity}</td>
                  <td className="px-4 py-3">
                    <UserDisplay value={[item.assigneeId]} size="small" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增城市客服映射</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">服务城市</label>
              <Input
                placeholder="请输入城市名称"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">负责客服</label>
              <UserSelect
                value={newAssignee}
                onChange={setNewAssignee}
                placeholder="请选择客服"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting || !newCity.trim() || !newAssignee}
            >
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditAssignee(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑客服分配 - {editTarget?.serviceCity}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">服务城市</label>
              <Input
                placeholder="请输入城市名称"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">负责客服</label>
              <UserSelect
                value={editAssignee}
                onChange={setEditAssignee}
                placeholder="请选择客服"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                setEditAssignee(null);
                setEditCity('');
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting || (!editCity.trim() && !editAssignee)}
            >
              确认更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AssignmentPage: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">智能路由管理</h1>
      <Tabs defaultValue="city">
        <TabsList>
          <TabsTrigger value="city">城市分配</TabsTrigger>
          <TabsTrigger value="skills">技能管理</TabsTrigger>
          <TabsTrigger value="workload">负载看板</TabsTrigger>
          <TabsTrigger value="salary">薪资话术</TabsTrigger>
        </TabsList>
        <TabsContent value="city">
          <CityAssignmentTab />
        </TabsContent>
        <TabsContent value="skills">
          <AgentSkillsTab />
        </TabsContent>
        <TabsContent value="workload">
          <AgentWorkloadTab />
        </TabsContent>
        <TabsContent value="salary">
          <SalaryConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssignmentPage;
