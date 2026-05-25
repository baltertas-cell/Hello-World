import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, PlusCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Головна", icon: LayoutDashboard },
    { href: "/records", label: "Реєстр порушень", icon: FileText },
    { href: "/records/new", label: "Новий запис", icon: PlusCircle },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950">
      <aside className="w-64 flex-col bg-slate-900 text-slate-50 hidden md:flex border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center text-slate-900">
            <ShieldAlert size={20} className="stroke-[2.5px]" />
          </div>
          <span className="font-bold text-lg tracking-tight">Реєстр ОВК</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-amber-500/10 text-amber-500" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-50"
              )}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Служба безпеки та комплаєнсу
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="h-16 flex items-center px-4 border-b bg-white dark:bg-slate-900 md:hidden">
          <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center text-slate-900 mr-3">
            <ShieldAlert size={20} />
          </div>
          <span className="font-bold text-lg">Реєстр ОВК</span>
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