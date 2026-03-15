import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-[#19E0FF]/24 bg-[#0C121C]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#19E0FF]", className)} {...props} />;
}
