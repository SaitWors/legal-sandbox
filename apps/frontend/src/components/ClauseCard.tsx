import { Clause } from "@/lib/types";

interface ClauseCardProps {
  clause: Clause;
  selected?: boolean;
}

export default function ClauseCard({ clause, selected }: ClauseCardProps) {
  return (
    <div
      id={`clause-${clause.index}`}
      className={
        "rounded-2xl border p-4 bg-white shadow-sm transition-all " +
        (selected ? "ring-2 ring-blue-400" : "hover:shadow-md")
      }
    >
      <div className="flex items-start gap-3">
        <div className="select-none inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-semibold">
          {clause.index}
        </div>
        <div className="flex-1">
          {clause.header && (
            <div className="text-slate-700 font-medium mb-1">{clause.header}</div>
          )}
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {clause.text}
          </div>
        </div>
      </div>
    </div>
  );
}