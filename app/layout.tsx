import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SureStack",
  description: "Controle de apostas surebet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <Sidebar />
          <main className="lg:ml-60 p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}