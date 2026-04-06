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
>>>>>>> 945d7f9 (lab-1-3-and_Docker)

export default function RootLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode;
=======
  children: ReactNode;
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
}) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
<<<<<<< HEAD
=======
            <Header />
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
