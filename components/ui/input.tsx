import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-[#19E0FF]/16 bg-[#09111B]/92 px-4 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors placeholder:text-[#6E7A92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19E0FF] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
