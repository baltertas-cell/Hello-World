import { useLocation } from "wouter";
import { useCreateRecord, getListRecordsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RecordForm } from "@/components/record-form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecordNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createRecord = useCreateRecord();

  const handleSubmit = (data: Record<string, string | null | undefined>) => {
    createRecord.mutate(
      { data: data as any },
      {
        onSuccess: (record) => {
          toast({ title: "Запис створено" });
          queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setLocation(`/records/${record.id}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Помилка створення запису" });
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/records">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            До списку
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Новий запис</h1>
          <p className="text-slate-500 text-sm">Заповніть форму для додавання нового запису до реєстру</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Дані запису</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordForm
            onSubmit={handleSubmit}
            isSubmitting={createRecord.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
