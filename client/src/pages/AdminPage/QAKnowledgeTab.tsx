import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { QAEntry } from '@shared/api.interface';
import { listQa, deleteQa, updateQa } from '@client/src/api/admin';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Switch } from '@client/src/components/ui/switch';
import { Spinner } from '@client/src/components/ui/spinner';
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
import QAEntryFormDialog from './QAEntryFormDialog';

const QAKnowledgeTab: React.FC = () => {
  const [qaList, setQaList] = useState<QAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<QAEntry | null>(null);

  const loadQa = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listQa(categoryFilter === 'all' ? undefined : categoryFilter);
      setQaList(data);
    } catch {
      toast.error('加载 QA 列表失败');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadQa();
  }, [loadQa]);

  const handleToggleEnabled = async (entry: QAEntry) => {
    try {
      await updateQa(entry.id, { enabled: !entry.enabled });
      setQaList((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, enabled: !e.enabled } : e)),
      );
    } catch {
      toast.error('更新状态失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQa(id);
      setQaList((prev) => prev.filter((e) => e.id !== id));
      toast.success('删除成功');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleEdit = (entry: QAEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingEntry(null);
    loadQa();
  };

  const categories = Array.from(new Set(qaList.map((e) => e.category)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadQa}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          新增 QA
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : qaList.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-gray-400">
          暂无 QA 条目，点击「新增 QA」添加
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">问题</TableHead>
                <TableHead className="w-[35%]">答案</TableHead>
                <TableHead className="w-[10%]">分类</TableHead>
                <TableHead className="w-[8%]">启用</TableHead>
                <TableHead className="w-[10%] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qaList.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="max-w-xs truncate" title={entry.question}>
                    {entry.question}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={entry.answer}>
                    {entry.answer}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={entry.enabled}
                      onCheckedChange={() => handleToggleEnabled(entry)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除这条 QA 条目吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                            >
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

      <QAEntryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editingEntry}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
};

export default QAKnowledgeTab;
