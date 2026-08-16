import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Pencil, Trash2, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { LearnedTemplate, LearnedTemplateStatus } from '@shared/api.interface';
import {
  listLearnedTemplates,
  deleteLearnedTemplate,
  updateLearnedTemplate,
} from '@client/src/api/admin';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Spinner } from '@client/src/components/ui/spinner';
import { Textarea } from '@client/src/components/ui/textarea';
import { Input } from '@client/src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@client/src/components/ui/alert-dialog';

const LearnedTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<LearnedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editing, setEditing] = useState<LearnedTemplate | null>(null);
  const [editAnswer, setEditAnswer] = useState('');
  const [editStatus, setEditStatus] = useState<LearnedTemplateStatus>('learning');
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLearnedTemplates();
      setTemplates(data);
    } catch {
      toast.error('加载学习模板失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const topicKeys = useMemo(
    () => Array.from(new Set(templates.map((t) => t.topicKey))),
    [templates],
  );

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (topicFilter !== 'all' && t.topicKey !== topicFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [templates, topicFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    try {
      await deleteLearnedTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success('删除成功');
    } catch {
      toast.error('删除失败');
    }
  };

  const openEdit = (template: LearnedTemplate) => {
    setEditing(template);
    setEditAnswer(template.answerText);
    setEditStatus(template.status);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditAnswer('');
    setEditStatus('learning');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editAnswer.trim()) {
      toast.error('答案不能为空');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateLearnedTemplate(editing.id, {
        answerText: editAnswer.trim(),
        status: editStatus,
      });
      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
      toast.success('更新成功');
      closeEdit();
    } catch {
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const calcSuccessRate = (t: LearnedTemplate): string => {
    if (t.useCount === 0) return '-';
    return `${((t.successCount / t.useCount) * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        AI 会从历史对话中学习「问题 → 答案」模板。当某条模板被使用达到 successThreshold 次后，
        自动升级为 mastered 状态。运营可在此处查看、编辑答案、删除不再需要的模板。
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="按 topicKey 筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部 topicKey</SelectItem>
              {topicKeys.map((key) => (
                <SelectItem key={key} value={key}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="按状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="learning">学习中</SelectItem>
              <SelectItem value="mastered">已掌握</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadTemplates}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm text-gray-500">共 {filtered.length} 条</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-gray-400">
          {templates.length === 0
            ? '暂无学习模板。AI 会从对话中自动学习，或由人工补录。'
            : '当前筛选下没有匹配的模板'}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[12%]">topicKey</TableHead>
                <TableHead className="w-[22%]">问题/场景</TableHead>
                <TableHead className="w-[30%]">标准答案</TableHead>
                <TableHead className="w-[10%] text-center">使用</TableHead>
                <TableHead className="w-[8%] text-center">成功率</TableHead>
                <TableHead className="w-[10%] text-center">状态</TableHead>
                <TableHead className="w-[8%] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                      {t.topicKey}
                    </code>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm" title={t.questionText}>
                      {t.questionText}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm text-gray-700" title={t.answerText}>
                      {t.answerText}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {t.useCount}
                    <div className="text-xs text-gray-400">
                      ✓{t.successCount} ✗{t.failCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {calcSuccessRate(t)}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.status === 'mastered' ? (
                      <Badge className="bg-green-100 text-green-700">已掌握</Badge>
                    ) : (
                      <Badge variant="secondary">学习中</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="删除">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除 topicKey 为 <code>{t.topicKey}</code> 的模板吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(t.id)}>
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 编辑弹窗 */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑学习模板</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">topicKey</label>
                <Input value={editing.topicKey} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">问题/场景</label>
                <Input value={editing.questionText} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">标准答案</label>
                <Textarea
                  value={editAnswer}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditAnswer(e.target.value)
                  }
                  className="mt-1 min-h-[120px]"
                  placeholder="AI 将使用这个答案回复客户"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">状态</label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as LearnedTemplateStatus)}
                >
                  <SelectTrigger className="mt-1 w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learning">学习中</SelectItem>
                    <SelectItem value="mastered">已掌握</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">
                  mastered 状态的模板会被 AI 优先参考；learning 仅记录学习过程。
                </p>
              </div>
              <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                累计使用 {editing.useCount} 次（成功 {editing.successCount} / 失败 {editing.failCount}），
                升级阈值 {editing.successThreshold}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearnedTemplatesTab;
