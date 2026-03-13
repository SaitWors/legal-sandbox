import { AlertTriangle } from "lucide-react";
import { Severity } from "@/lib/types";

interface SeverityBadgeProps {
  severity: Severity;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const map: Record<Severity, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-sky-50 text-sky-700 border-sky-200",
  };
  const label = sevLabel(severity);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${map[severity]}`}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function sevLabel(s: Severity) {
  return s === "high" ? "высокая" : s === "medium" ? "средняя" : "низкая";
}