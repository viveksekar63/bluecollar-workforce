import { LucideIcon } from "lucide-react";

export function StatCard({
  title, value, change, Icon, tone = "blue"
}: {
  title: string; value: string; change: string; Icon: LucideIcon; tone?: "blue"|"green"|"orange"|"purple";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-amber-50 text-amber-600",
    purple: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-[24px] font-extrabold tracking-tight">{value}</div>
          <div className="mt-1 text-[10px] text-emerald-600">{change} <span className="text-slate-400">this month</span></div>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
