import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createWorker, updateWorker } from '@client/src/api/workers';
import type { Worker, CreateWorkerRequest, UpdateWorkerRequest } from '@shared/api.interface';

const workerSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  phone: z.string().min(1, '手机号不能为空'),
  gender: z.string().min(1, '请选择性别'),
  serviceCity: z.string().min(1, '服务城市不能为空'),
  serviceType: z.string().min(1, '服务类型不能为空'),
  level: z.string().min(1, '请选择等级'),
  status: z.string().min(1, '请选择状态'),
  rating: z.coerce.number().min(0).max(100),
  totalOrders: z.coerce.number().min(0),
});

type WorkerFormData = z.infer<typeof workerSchema>;

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

const LEVEL_OPTIONS = [
  { value: 'junior', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'senior', label: '高级' },
  { value: 'gold', label: '金牌' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '在岗' },
  { value: 'on_leave', label: '休假' },
];

const SERVICE_TYPE_OPTIONS = [
  { value: 'baomu', label: '保姆' },
  { value: 'yuesao', label: '月嫂' },
];

interface WorkerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingWorker: Worker | null;
  onSuccess: () => void;
}

const WorkerFormDialog: React.FC<WorkerFormDialogProps> = ({
  open,
  onOpenChange,
  editingWorker,
  onSuccess,
}) => {
  const isEdit = !!editingWorker;

  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: editingWorker?.name ?? '',
      phone: editingWorker?.phone ?? '',
      gender: editingWorker?.gender ?? 'female',
      serviceCity: editingWorker?.serviceCity ?? '',
      serviceType: editingWorker?.serviceType ?? 'baomu',
      level: editingWorker?.level ?? 'junior',
      status: editingWorker?.status ?? 'active',
      rating: editingWorker?.rating ?? 0,
      totalOrders: editingWorker?.totalOrders ?? 0,
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      if (isEdit && editingWorker) {
        const updateData: UpdateWorkerRequest = {
          name: data.name,
          phone: data.phone,
          gender: data.gender as Worker['gender'],
          serviceCity: data.serviceCity,
          serviceType: data.serviceType,
          level: data.level as Worker['level'],
          status: data.status as Worker['status'],
          rating: data.rating,
          totalOrders: data.totalOrders,
        };
        await updateWorker(editingWorker.id, updateData);
        toast.success('劳动者信息已更新');
      } else {
        const createData: CreateWorkerRequest = {
          name: data.name,
          phone: data.phone,
          gender: data.gender as Worker['gender'],
          serviceCity: data.serviceCity,
          serviceType: data.serviceType,
          level: data.level as Worker['level'],
          status: data.status as Worker['status'],
          rating: data.rating,
          totalOrders: data.totalOrders,
        };
        await createWorker(createData);
        toast.success('劳动者已创建');
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑劳动者' : '新增劳动者'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>姓名 <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="请输入姓名" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>手机号 <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="请输入手机号" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>性别 <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex flex-wrap gap-4">
              <FormField control={form.control} name="serviceCity" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>服务城市 <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="如：北京" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>服务类型 <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SERVICE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>等级 <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex flex-wrap gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>状态 <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rating" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>评分（0-100）</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="totalOrders" render={({ field }) => (
                <FormItem className="flex-1 min-w-[180px]">
                  <FormLabel>总订单数</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit" disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerFormDialog;
