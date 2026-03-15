import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function SectionHeading({ eyebrow, title, description, actions }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex rounded-full border border-[#19E0FF]/20 bg-[#09121D]/78 px-5 py-2.5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#19E0FF]">{eyebrow}</p>
        </div>
        <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">
          {title}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-[#A9B2C7]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
