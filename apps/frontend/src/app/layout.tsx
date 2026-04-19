import type { Metadata } from "next";

import Header from "@/components/Header";
import Providers from "@/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost"),
  title: {
    default: "Contract Workspace",
    template: "%s | Contract Workspace",
  },
  description: "Рабочее пространство для анализа договоров, управления документами и безопасной загрузки вложений.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Contract Workspace",
    description: "Платформа для проверки договоров, ролевого доступа и защищённой работы с файлами.",
    type: "website",
    url: "http://localhost",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
