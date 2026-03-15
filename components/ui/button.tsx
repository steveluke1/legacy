import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] shadow-[0_14px_34px_rgba(25,224,255,0.26)] hover:shadow-[0_18px_40px_rgba(25,224,255,0.32)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
        outline:
          "border-2 border-[#19E0FF]/35 bg-[#09121D] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[#19E0FF]/60 hover:bg-[#0D1724] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
        ghost: "text-[#A9B2C7] hover:bg-[#0C121C] hover:text-white",
      },
      size: {
        default: "h-11 px-6 py-3 text-sm",
        lg: "h-14 px-8 text-base",
        sm: "h-9 px-4 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...props,
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
