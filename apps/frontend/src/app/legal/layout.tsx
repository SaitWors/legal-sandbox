<<<<<<< HEAD
=======
import type { ReactNode } from "react";
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
import { TooltipProvider } from "@/components/ui/tooltip";

export default function LegalLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode;
=======
  children: ReactNode;
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
}) {
  return <TooltipProvider>{children}</TooltipProvider>;
}