import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#19E0FF]/16 bg-[linear-gradient(180deg,rgba(12,18,28,0.96)_0%,rgba(5,7,11,0.98)_100%)] shadow-[0_20px_50px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-1 hover:border-[#19E0FF]/35 hover:shadow-[0_24px_60px_rgba(25,224,255,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative space-y-2 p-6", className)} {...props}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(25,224,255,0.08) 0%, transparent 55%)" }}
      />
    </div>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative p-6 pt-0", className)} {...props} />;
}
