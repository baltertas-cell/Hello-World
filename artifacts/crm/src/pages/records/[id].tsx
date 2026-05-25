import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetRecord,
  getGetRecordQueryKey,
  useUpdateRecord,
  useDeleteRecord,
  getListRecordsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RecordForm } from "@/components/record-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export default function RecordEdit() {
  const { id } = useParams<{ id: string }>();
  const numId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useGetRecord(numId, {
    query: { enabled: !!numId && !isNaN(numId), queryKey: getGetRecordQueryKey(numId) },
  });

  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();

  const handleUpdate = (data: Record<string, string | null | undefined>) => {
    updateRecord.mutate(
      { id: numId, data: data as any },
      {
        onSuccess: () => {
          toast({ title: "Запис оновлено" });
          queryClient.invalidateQueries({ queryKey: getGetRecordQueryKey(numId) });
          queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setEditing(false);
        },
        onError: () => toast({ variant: "destructive", title: "Помилка оновлення" }),
      },
    );
  };

  const handleDelete = () => {
    if (!confirm("Видалити цей запис назавжди?")) return;
    deleteRecord.mutate(
      { id: numId },
      {
        onSuccess: () => {
          toast({ title: "Запис видалено" });
          queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setLocation("/records");
        },
        onError: () => toast({ variant: "destructive", title: "Помилка видалення" }),
      },
    );
  };

  const fields: { label: string; key: keyof typeof record }[] = [
    { label: "Дата", key: "date" },
    { label: "Відносно мережі/ГО", key: "networkOrg" },
    { label: "по Факту", key: "byFact" },
    { label: "Підстава", key: "basis" },
    { label: "Ознаки шахрайства", key: "fraudSigns" },
    { label: "Внутрішнє шахрайство", key: "internalFraud" },
    { label: "Виявлено порушень", key: "violationsFound" },
    { label: "Завдано збитків", key: "damagesCaused" },
    { label: "Притягнуто до відповідальності / прийняті заходи", key: "measuresТaken" },
    { label: "Передано в ОВС", key: "transferredToPolice" },
    { label: "Результат ОВС", key: "policeResult" },
    { label: "Заявник / Потерпілий", key: "applicantVictim" },
    { label: "Стан контролю досудового розслідування", key: "investigationStatus" },
    { label: "Додаткові нотатки", key: "notes" },
  ];

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500">Завантаження запису...</div>
    );
  }

  if (!record) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Запис не знайдено</p>
        <Link href="/records">
          <Button variant="outline" className="mt-4">До списку</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/records">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              До списку
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Запис #{record.id}
            </h1>
            {record.date && (
              <p className="text-slate-500 text-sm">Дата: {record.date}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setEditing(true)}
              data-testid="button-edit"
            >
              <Pencil className="h-4 w-4" />
              Редагувати
            </Button>
          )}
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleDelete}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4" />
            Видалити
          </Button>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Редагування запису</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Скасувати
            </Button>
          </CardHeader>
          <CardContent>
            <RecordForm
              initialValues={record as any}
              onSubmit={handleUpdate}
              isSubmitting={updateRecord.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Деталі запису</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {fields.map(({ label, key }) => {
                const value = record[key as keyof typeof record];
                return (
                  <div key={String(key)} data-testid={`field-${String(key)}`} className="space-y-1">
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100">
                      {value ? (
                        <span>{String(value)}</span>
                      ) : (
                        <span className="text-slate-400 italic">Не заповнено</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
