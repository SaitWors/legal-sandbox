"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <AuthProvider>{children}</AuthProvider>
    </TooltipProvider>
  );
}
