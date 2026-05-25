import { useState } from "react";
import { useUser } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ShieldOff, UserCheck, UserX, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AppUser {
  id: number;
  clerkId: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

function useAppUsers() {
  return useQuery<AppUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Помилка завантаження");
      return res.json();
    },
  });
}

function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { role?: string; isActive?: boolean } }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Помилка оновлення");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Помилка видалення");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export default function AdminUsers() {
  const { user: clerkUser } = useUser();
  const { data: users, isLoading, error } = useAppUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handle = async (fn: () => Promise<void>, id: number) => {
    setLoadingId(id);
    try {
      await fn();
      toast({ title: "Збережено" });
    } catch (e: any) {
      toast({ variant: "destructive", title: e.message });
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-red-500 font-medium">Доступ заборонено або сталася помилка.</p>
        <p className="text-slate-500 text-sm mt-1">Ця сторінка доступна лише суперкористувачам.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Управління користувачами</h1>
        <p className="text-slate-500 mt-1">Керуйте доступом та ролями користувачів системи</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Користувачі системи ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users?.map((u) => {
              const isMe = u.clerkId === clerkUser?.id;
              const busy = loadingId === u.id;
              return (
                <div
                  key={u.id}
                  data-testid={`user-row-${u.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                      {(u.name || u.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {u.name || u.email}
                        </span>
                        {isMe && (
                          <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">Ви</Badge>
                        )}
                        <Badge
                          className={
                            u.role === "superuser"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200"
                          }
                        >
                          {u.role === "superuser" ? "Суперкористувач" : "Користувач"}
                        </Badge>
                        {!u.isActive && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Деактивовано</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  {!isMe && (
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        title={u.role === "superuser" ? "Зробити користувачем" : "Зробити суперкористувачем"}
                        data-testid={`button-role-${u.id}`}
                        onClick={() =>
                          handle(
                            () => updateUser.mutateAsync({ id: u.id, data: { role: u.role === "superuser" ? "user" : "superuser" } }),
                            u.id,
                          )
                        }
                        className="gap-1 text-xs"
                      >
                        {u.role === "superuser" ? (
                          <><ShieldOff className="h-4 w-4" /> Звичайний</>
                        ) : (
                          <><ShieldCheck className="h-4 w-4 text-amber-600" /> Супер</>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        title={u.isActive ? "Деактивувати" : "Активувати"}
                        data-testid={`button-active-${u.id}`}
                        onClick={() =>
                          handle(
                            () => updateUser.mutateAsync({ id: u.id, data: { isActive: !u.isActive } }),
                            u.id,
                          )
                        }
                        className="gap-1 text-xs"
                      >
                        {u.isActive ? (
                          <><UserX className="h-4 w-4 text-slate-500" /> Блок</>
                        ) : (
                          <><UserCheck className="h-4 w-4 text-emerald-600" /> Дозволити</>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        title="Видалити користувача"
                        data-testid={`button-delete-user-${u.id}`}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (!confirm(`Видалити користувача ${u.email}?`)) return;
                          handle(() => deleteUser.mutateAsync(u.id), u.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {!users?.length && (
              <div className="py-12 text-center text-slate-500 text-sm">
                Немає зареєстрованих користувачів
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Як надати доступ новому користувачу:</p>
          <ol className="text-sm text-amber-700 dark:text-amber-400 mt-2 space-y-1 list-decimal list-inside">
            <li>Надішліть посилання на реєстрацію новому користувачу</li>
            <li>Вони реєструються — з'являться в цьому списку як "Користувач"</li>
            <li>Ви можете підвищити до "Суперкористувача" або заблокувати їх тут</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
