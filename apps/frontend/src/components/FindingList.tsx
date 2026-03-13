import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Check,
  Copy,
  GitMerge,
  Link2,
  ListChecks,
  Trash2,
  X,
} from "lucide-react";
import { Finding, Severity } from "@/lib/types";
import SeverityBadge from "./SeverityBadge";

interface FindingListProps {
  findings: Finding[];
  showResolved: boolean;
  onResolve: (id: string, val: boolean) => void;
  onFocus: (indices: number[]) => void;
}

export default function FindingList({
  findings,
  showResolved,
  onResolve,
  onFocus,
}: FindingListProps) {
  const visible = findings.filter((f) => showResolved || !f.resolved);

  if (visible.length === 0)
    return <p className="text-slate-500 text-sm">Нет находок для отображения.</p>;

  return (
    <div className="grid gap-3">
      {visible.map((f) => (
        <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="border rounded-2xl p-3 md:p-4 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={f.type === "duplicate" ? "secondary" : "destructive"}>
                {f.type === "duplicate" ? (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Дубль
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Конфликт
                  </>
                )}
              </Badge>
              <SeverityBadge severity={f.severity} />
              {f.type === "duplicate" && (
                <Badge variant="outline">Похожесть {Math.round(f.similarity * 100)}%</Badge>
              )}
              {f.type === "conflict" && (
                <Badge variant="outline">Сигнал: {signalLabel(f.signal)}</Badge>
              )}
              {f.resolved && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <Check className="w-3.5 h-3.5 mr-1" /> Решено
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onFocus(
                      f.type === "duplicate" ? (f.items as number[]) : [f.a, f.b]
                    )
                  }
                >
                  <Link2 className="w-4 h-4 mr-1" /> К пунктам
                </Button>
                <Button
                  size="sm"
                  variant={f.resolved ? "secondary" : "default"}
                  onClick={() => onResolve(f.id, !f.resolved)}
                >
                  {f.resolved ? (
                    <>
                      <X className="w-4 h-4 mr-1" /> Снять метку
                    </>
                  ) : (
                    <>
                      <ListChecks className="w-4 h-4 mr-1" /> Отметить решённым
                    </>
                  )}
                </Button>
                {f.type === "duplicate" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline">
                        <GitMerge className="w-4 h-4 mr-1" /> Объединить
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      UI-заглушка: здесь можно реализовать выбор базового пункта
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Скрыть из списка</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{f.reason}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function signalLabel(signal: string) {
  switch (signal) {
    case "negation":
      return "разрешено/запрещено";
    case "numbers":
      return "цифры/сроки";
    case "modal":
      return "обязан/может";
    case "policy":
      return "политика";
    default:
      return signal;
  }
}