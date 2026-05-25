import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetStats, useListRecords } from "@workspace/api-client-react";
import { ShieldAlert, AlertTriangle, Scale, Building, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: recentRecords, isLoading: recordsLoading } = useListRecords({ limit: 5 } as any);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Панель управління</h1>
        <p className="text-slate-500 mt-1">Огляд стану реєстру порушень та шахрайства.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-slate-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього записів</CardTitle>
            <ShieldAlert className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ознаки шахрайства</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.withFraudSigns || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Внутрішнє шахрайство</CardTitle>
            <Building className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.internalFraud || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Передано в ОВС</CardTitle>
            <Scale className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.transferredToPolice || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Останні записи</CardTitle>
          <Link href="/records" className="text-sm text-amber-600 hover:underline font-medium">
            Переглянути всі
          </Link>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="text-sm text-slate-500 py-4">Завантаження...</div>
          ) : recentRecords && recentRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="pb-3 font-medium">Дата</th>
                    <th className="pb-3 font-medium">Відносно мережі/ГО</th>
                    <th className="pb-3 font-medium">Ознаки шахрайства</th>
                    <th className="pb-3 font-medium text-right">Дія</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3">{record.date || "-"}</td>
                      <td className="py-3 font-medium">{record.networkOrg || "-"}</td>
                      <td className="py-3">
                        {record.fraudSigns ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            Так
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/records/${record.id}`} className="text-slate-600 hover:text-amber-600 font-medium">
                          Деталі
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-8 text-center border rounded-lg border-dashed">
              Немає записів для відображення
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}