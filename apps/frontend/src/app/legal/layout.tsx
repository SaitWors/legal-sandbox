import { TooltipProvider } from "@/components/ui/tooltip";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TooltipProvider>{children}</TooltipProvider>;
}