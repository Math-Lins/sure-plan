"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const AUTH_ROUTES = ["/login", "/cadastro"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="lg:ml-60 p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
    </>
  );
}
