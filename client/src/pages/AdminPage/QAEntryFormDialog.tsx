import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import type { QAEntry } from '@shared/api.interface';
import { createQa, updateQa } from '@client/src/api/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@client/src/components/ui/form';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Button } from '@client/src/components/ui/button';

const qaSchema = z.object({
  question: z.string().min(1, '问题不能为空'),
  answer: z.string().min(1, '答案不能为空'),
  category: z.string().min(1, '分类不能为空'),
  sortOrder: z.string().min(1, '排序不能为空'),
});

type QAFormData = z.infer<typeof qaSchema>;

interface QAEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: QAEntry | null;
  onSuccess: () => void;
}

const QAEntryFormDialog: React.FC<QAEntryFormDialogProps> = ({
  open,
  onOpenChange,
  entry,
  onSuccess,
}) => {
  const isEdit = !!entry;

  const form = useForm<QAFormData>({
    resolver: zodResolver(qaSchema),
    defaultValues: {
      question: '',
      answer: '',
      category: 'general',
      sortOrder: '0',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        question: entry?.question ?? '',
        answer: entry?.answer ?? '',
        category: entry?.category ?? 'general',
        sortOrder: String(entry?.sortOrder ?? 0),
      });
    }
  }, [open, entry, form]);

  const onSubmit = async (data: QAFormData) => {
    try {
      const payload = {
        question: data.question,
        answer: data.answer,
        category: data.category,
        sortOrder: parseInt(data.sortOrder, 10) || 0,
      };
      if (isEdit && entry) {
        await updateQa(entry.id, payload);
        toast.success('更新成功');
      } else {
        await createQa(payload);
        toast.success('创建成功');
      }
      onSuccess();
    } catch {
      toast.error(isEdit ? '更新失败' : '创建失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑 QA 条目' : '新增 QA 条目'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    问题 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="客户可能提出的问题"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    答案 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="标准回复内容"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>分类</FormLabel>
                    <FormControl>
                      <Input placeholder="如 general / pricing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem className="w-[120px]">
                    <FormLabel>排序</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default QAEntryFormDialog;
