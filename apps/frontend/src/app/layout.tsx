<<<<<<< HEAD
// apps/frontend/src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
=======
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
>>>>>>> 73dd6ff (С 1й по 3ю и docker)

export default function RootLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode;
=======
  children: ReactNode;
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
}) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
<<<<<<< HEAD
=======
            <Header />
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
