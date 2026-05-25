import { useState } from "react";
import { Link } from "wouter";
import { useListRecords, getListRecordsQueryKey, useDeleteRecord } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExcelImport } from "@/components/excel-import";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Eye, Filter } from "lucide-react";

export default function RecordsList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fraudOnly, setFraudOnly] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(fraudOnly ? { fraudOnly: "true" } : {}),
  };

  const { data: records, isLoading } = useListRecords(params);
  const deleteRecord = useDeleteRecord();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout((window as any).__searchTimeout);
    (window as any).__searchTimeout = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Видалити цей запис?")) return;
    deleteRecord.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Запис видалено" });
        queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Помилка видалення" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Реєстр записів</h1>
          <p className="text-slate-500 mt-1">Всі записи про порушення та шахрайство</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExcelImport />
          <Link href="/records/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Новий запис
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                data-testid="input-search"
                placeholder="Пошук по записах..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <Button
              variant={fraudOnly ? "default" : "outline"}
              onClick={() => setFraudOnly(!fraudOnly)}
              className="gap-2 shrink-0"
              data-testid="button-filter-fraud"
            >
              <Filter className="h-4 w-4" />
              {fraudOnly ? "Скинути фільтр" : "Тільки шахрайство"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Завантаження...</div>
          ) : !records || records.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border-t">
              <p className="font-medium">Записів не знайдено</p>
              <p className="text-sm mt-1">Спробуйте змінити пошук або <Link href="/records/new" className="text-amber-600 underline">додайте перший запис</Link></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-medium">Дата</th>
                    <th className="px-4 py-3 text-left font-medium">Відносно мережі/ГО</th>
                    <th className="px-4 py-3 text-left font-medium">по Факту</th>
                    <th className="px-4 py-3 text-left font-medium">Ознаки шахрайства</th>
                    <th className="px-4 py-3 text-left font-medium">Заявник/Потерпілий</th>
                    <th className="px-4 py-3 text-left font-medium">Стан розслідування</th>
                    <th className="px-4 py-3 text-right font-medium">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      data-testid={`row-record-${record.id}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{record.date || "—"}</td>
                      <td className="px-4 py-3 font-medium max-w-[180px] truncate">{record.networkOrg || "—"}</td>
                      <td className="px-4 py-3 max-w-[160px] truncate text-slate-600">{record.byFact || "—"}</td>
                      <td className="px-4 py-3">
                        {record.fraudSigns ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200">
                            {record.fraudSigns.length > 20 ? record.fraudSigns.slice(0, 20) + "…" : record.fraudSigns}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[140px] truncate text-slate-600">{record.applicantVictim || "—"}</td>
                      <td className="px-4 py-3 max-w-[160px] truncate text-slate-600">{record.investigationStatus || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/records/${record.id}`}>
                            <Button size="sm" variant="ghost" data-testid={`button-view-${record.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(record.id)}
                            data-testid={`button-delete-${record.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
