"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  PlusCircle,
  Table,
  TrendingUp,
  Calculator,
  LogOut,
  Zap,
  Shield,
  KeyRound,
  UserCircle,
  Sun,
  Moon,
  Activity,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Nova Aposta", href: "/apostas/nova", icon: PlusCircle },
  { name: "Planilha", href: "/planilha", icon: Table },
  { name: "Ganhos", href: "/ganhos", icon: TrendingUp },
  { name: "Calculadora", href: "/calculadora", icon: Calculator },
  { name: "Perfil", href: "/perfil", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  if (pathname === "/login" || pathname === "/cadastro") return null;

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 h-screen bg-[#0a0a12] border-r border-white/[0.06] flex-col justify-between fixed left-0 top-0 z-10">
        <div>
          <div className="px-6 py-6 flex items-center gap-2">
            <div className="bg-gradient-to-br from-amber-500 to-purple-600 p-1.5 rounded-lg">
              <Zap size={16} className="text-black" fill="black" />
            </div>
            <h1 className="text-lg font-bold glow-text">SureStack</h1>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/15 to-purple-500/10 text-amber-400 border border-amber-500/20"
                      : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-3 pb-6 flex flex-col gap-2">
          {(session?.user as any)?.role === "master" && (
            <>
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/admin"
                    ? "bg-gradient-to-r from-amber-500/15 to-purple-500/10 text-amber-400 border border-amber-500/20"
                    : "text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-400"
                }`}
              >
                <Shield size={18} />
                Painel Master
              </Link>
              <Link
                href="/admin/convites"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/admin/convites"
                    ? "bg-gradient-to-r from-amber-500/15 to-purple-500/10 text-amber-400 border border-amber-500/20"
                    : "text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-400"
                }`}
              >
                <KeyRound size={18} />
                Convites
              </Link>
              <Link
                href="/admin/logs"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/admin/logs"
                    ? "bg-gradient-to-r from-amber-500/15 to-purple-500/10 text-amber-400 border border-amber-500/20"
                    : "text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-400"
                }`}
              >
                <Activity size={18} />
                Logs
              </Link>
            </>
          )}
          {session?.user?.name && (
            <p className="text-xs text-gray-600 px-3 truncate">{session.user.name}</p>
          )}
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 w-full transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-[#0a0a12] border-t border-white/[0.06] flex items-center justify-around px-2 py-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                isActive ? "text-amber-400" : "text-gray-500"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <Link
          href="/perfil"
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${pathname === "/perfil" ? "text-amber-400" : "text-gray-500"}`}
        >
          <UserCircle size={20} />
          <span className="text-[10px] font-medium">Perfil</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-gray-500 transition-all"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </nav>
    </>
  );
}
