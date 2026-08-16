import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Phone, MapPin, Star, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getWorkerById,
  addWorkerSkill,
  removeWorkerSkill,
  addWorkerAvailability,
  removeWorkerAvailability,
} from '@client/src/api/workers';
import type { WorkerDetail, WorkerSkill, WorkerAvailability } from '@shared/api.interface';

const LEVEL_LABELS: Record<string, string> = {
  junior: '初级', intermediate: '中级', senior: '高级', gold: '金牌',
};
const STATUS_LABELS: Record<string, string> = {
  active: '在岗', on_leave: '休假',
};
const SERVICE_TYPE_LABELS: Record<string, string> = {
  baomu: '保姆', yuesao: '月嫂',
};
const PROFICIENCY_LABELS: Record<string, string> = {
  beginner: '初级', intermediate: '中级', advanced: '高级', expert: '专家',
};
const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
  { value: 'expert', label: '专家' },
];
const TIME_SLOT_OPTIONS = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
  { value: 'full_day', label: '全天' },
];

const WorkerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [availDialogOpen, setAvailDialogOpen] = useState(false);
  const [newSkillTag, setNewSkillTag] = useState('');
  const [newSkillProf, setNewSkillProf] = useState('intermediate');
  const [newAvailDate, setNewAvailDate] = useState('');
  const [newAvailSlot, setNewAvailSlot] = useState('morning');

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getWorkerById(id);
      setDetail(data);
    } catch {
      toast.error('加载劳动者详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleAddSkill = async () => {
    if (!id || !newSkillTag.trim()) return;
    try {
      await addWorkerSkill(id, { skillTag: newSkillTag.trim(), proficiency: newSkillProf });
      toast.success('技能已添加');
      setSkillDialogOpen(false);
      setNewSkillTag('');
      setNewSkillProf('intermediate');
      fetchDetail();
    } catch {
      toast.error('添加技能失败');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!id) return;
    try {
      await removeWorkerSkill(id, skillId);
      toast.success('技能已删除');
      fetchDetail();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleAddAvailability = async () => {
    if (!id || !newAvailDate.trim()) return;
    try {
      await addWorkerAvailability(id, { date: newAvailDate.trim(), timeSlot: newAvailSlot });
      toast.success('可用时间已添加');
      setAvailDialogOpen(false);
      setNewAvailDate('');
      setNewAvailSlot('morning');
      fetchDetail();
    } catch {
      toast.error('添加失败');
    }
  };

  const handleRemoveAvailability = async (availabilityId: string) => {
    if (!id) return;
    try {
      await removeWorkerAvailability(id, availabilityId);
      toast.success('可用时间已删除');
      fetchDetail();
    } catch {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">加载中...</div>;
  }
  if (!detail) {
    return <div className="p-6 text-center text-gray-500">劳动者不存在</div>;
  }

  const w = detail;

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/workers')}>
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回列表
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800">{w.name}</h2>
                <Badge variant={w.status === 'active' ? 'default' : 'secondary'}>
                  {STATUS_LABELS[w.status] ?? w.status}
                </Badge>
                <Badge variant="outline">{LEVEL_LABELS[w.level] ?? w.level}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> {w.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> {w.serviceCity}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">服务类型：</span>
                  {SERVICE_TYPE_LABELS[w.serviceType] ?? w.serviceType}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">性别：</span>
                  {w.gender === 'male' ? '男' : '女'}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" /> 评分：{w.rating}
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" /> 总订单：{w.totalOrders}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">技能标签（{detail.skills.length}）</TabsTrigger>
          <TabsTrigger value="availability">可用时间（{detail.availabilities.length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>技能标签</CardTitle>
              <Button size="sm" onClick={() => setSkillDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> 添加技能
              </Button>
            </CardHeader>
            <CardContent>
              {detail.skills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无技能标签</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>技能名称</TableHead>
                      <TableHead>熟练度</TableHead>
                      <TableHead className="text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.skills.map((s: WorkerSkill) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.skillTag}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{PROFICIENCY_LABELS[s.proficiency] ?? s.proficiency}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveSkill(s.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>可用时间</CardTitle>
              <Button size="sm" onClick={() => setAvailDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> 添加时间段
              </Button>
            </CardHeader>
            <CardContent>
              {detail.availabilities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无可用时间</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>时间段</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.availabilities.map((a: WorkerAvailability) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.date}</TableCell>
                        <TableCell>{TIME_SLOT_OPTIONS.find((o) => o.value === a.timeSlot)?.label ?? a.timeSlot}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === 'available' ? 'default' : 'secondary'}>
                            {a.status === 'available' ? '可用' : '已预约'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveAvailability(a.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加技能</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">技能名称</label>
              <Input placeholder="如：保洁、做饭、育儿" value={newSkillTag} onChange={(e) => setNewSkillTag(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">熟练度</label>
              <Select value={newSkillProf} onValueChange={setNewSkillProf}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddSkill}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={availDialogOpen} onOpenChange={setAvailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加可用时间</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">日期</label>
              <Input placeholder="如：2026-08-15" value={newAvailDate} onChange={(e) => setNewAvailDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">时间段</label>
              <Select value={newAvailSlot} onValueChange={setNewAvailSlot}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddAvailability}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkerDetailPage;
