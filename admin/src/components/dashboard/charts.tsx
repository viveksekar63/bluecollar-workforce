"use client";

import { useEffect, useRef } from "react";

export function RegistrationChart() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width = canvas.clientWidth * 2;
    const h = canvas.height = canvas.clientHeight * 2;
    ctx.scale(2,2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    ctx.strokeStyle = "#1769ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const points = [78,74,50,56,47,59,48,60,30,38,42,28,22,32,13,31,20,17,26,18,35,21,14,26,11];
    points.forEach((v,i) => {
      const x = (i/(points.length-1))*(W-24)+12;
      const y = 10+(v/90)*(H-28);
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();
  }, []);

  return <canvas ref={ref} className="h-[185px] w-full" />;
}

export function VerificationDonut() {
  return (
    <div className="flex items-center gap-7">
      <div className="relative h-[150px] w-[150px] rounded-full" style={{
        background: "conic-gradient(#20b879 0 73.8%, #3b82f6 73.8% 90.5%, #f6b82e 90.5% 100%)"
      }}>
        <div className="absolute inset-[25px] flex flex-col items-center justify-center rounded-full bg-white">
          <b className="text-xl">25,430</b><span className="text-[10px] text-slate-500">Total</span>
        </div>
      </div>
      <div className="space-y-3 text-xs">
        <Legend color="#20b879" label="Verified" value="18,764 (73.8%)" />
        <Legend color="#3b82f6" label="In Progress" value="4,256 (16.7%)" />
        <Legend color="#f6b82e" label="Pending" value="2,410 (9.5%)" />
        <Legend color="#ef4444" label="Rejected" value="0 (0%)" />
      </div>
    </div>
  );
}
function Legend({color,label,value}:{color:string;label:string;value:string}) {
  return <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{background:color}}/><span className="w-[68px]">{label}</span><b>{value}</b></div>;
}
