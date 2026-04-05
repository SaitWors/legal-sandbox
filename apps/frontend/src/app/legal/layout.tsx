<<<<<<< HEAD
=======
import type { ReactNode } from "react";
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
import { TooltipProvider } from "@/components/ui/tooltip";

export default function LegalLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode;
=======
  children: ReactNode;
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
}) {
  return <TooltipProvider>{children}</TooltipProvider>;
}