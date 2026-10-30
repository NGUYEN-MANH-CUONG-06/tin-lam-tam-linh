import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "lacquer"
    | "bronze";
  size?: "default" | "sm" | "lg" | "icon" | "pill";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex max-w-full items-center justify-center gap-2 whitespace-normal text-center rounded-control text-base font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer touch-manipulation [&>svg]:shrink-0";

    const variantStyles: Record<string, string> = {
      default: "border border-action bg-action text-on-action hover:bg-action-hover hover:border-action-hover",
      lacquer: "border border-action bg-action text-on-action hover:bg-action-hover hover:border-action-hover",
      bronze: "border border-gold bg-gold text-on-accent shadow-sm hover:opacity-90",
      destructive: "border border-danger bg-danger-soft text-danger hover:opacity-90",
      outline: "border border-line bg-surface text-ink hover:border-accent hover:bg-accent-soft hover:text-accent",
      secondary: "border border-transparent bg-accent-soft text-accent hover:opacity-85",
      ghost: "border border-transparent text-muted hover:bg-surface-soft hover:text-ink",
      link: "h-auto p-0 text-accent underline-offset-4 hover:underline",
    };

    const sizeStyles: Record<string, string> = {
      default: "min-h-12 rounded-control px-6 py-3",
      sm: "min-h-11 rounded-control px-4 text-sm",
      lg: "min-h-[3.25rem] rounded-control px-7 text-lg",
      pill: "min-h-12 rounded-control px-5",
      icon: "h-12 w-12 rounded-full p-0",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          variantStyles[variant] || variantStyles.default,
          sizeStyles[size] || sizeStyles.default,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
