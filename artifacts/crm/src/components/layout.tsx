import { useClerk, useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, PlusCircle, ShieldAlert, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface AppUser {
  id: number;
  role: string;
  isActive: boolean;
}

function useCurrentAppUser() {
  return useQuery<AppUser>({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Помилка");
      return res.json();
    },
    retry: false,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: appUser } = useCurrentAppUser();

  const isSuperuser = appUser?.role === "superuser";

  const navItems = [
    { href: "/", label: "Головна", icon: LayoutDashboard },
    { href: "/records", label: "Реєстр порушень", icon: FileText },
    { href: "/records/new", label: "Новий запис", icon: PlusCircle },
    ...(isSuperuser ? [{ href: "/admin/users", label: "Користувачі", icon: Users }] : []),
  ];

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="flex min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950">
      <aside className="w-64 flex-col bg-slate-900 text-slate-50 hidden md:flex border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center text-slate-900">
            <ShieldAlert size={20} className="stroke-[2.5px]" />
          </div>
          <span className="font-bold text-sm tracking-tight leading-tight">Реєстр кримінальних проваджень</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-50"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
              {(user?.fullName || user?.primaryEmailAddress?.emailAddress || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.fullName || user?.firstName || "Користувач"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {isSuperuser ? "Суперкористувач" : "Користувач"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: `${basePath}/sign-in` })}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors w-full px-2 py-1.5 rounded hover:bg-slate-800"
          >
            <LogOut size={14} />
            Вийти
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="h-16 flex items-center justify-between px-4 border-b bg-slate-900 text-white md:hidden">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center text-slate-900">
              <ShieldAlert size={20} />
            </div>
            <span className="font-bold text-sm">Реєстр кримінальних проваджень</span>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: `${basePath}/sign-in` })}
            className="text-slate-400 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
