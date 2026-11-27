import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
  {
    variants: {
      variant: {
        default: "bg-white text-zinc-950 hover:bg-white/90",
        glass:
          "border border-white/15 bg-white/5 text-white hover:bg-white/10",
        auth: "neu-outset border border-white/6 bg-[rgba(22,22,32,0.72)] text-white focus-visible:ring-0",
        outline:
          "border border-white/20 bg-transparent text-white hover:bg-white/8",
        ghost: "text-white/80 hover:text-white hover:bg-white/8",
        destructive: "bg-red-500/15 text-red-300 border border-red-400/20 hover:bg-red-500/25",
        max: "bg-white text-zinc-950 hover:bg-white/90",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
