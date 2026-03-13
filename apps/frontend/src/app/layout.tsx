// apps/frontend/src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
