import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center font-medium rounded-md transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  // merah is reserved for the primary action + summit zone (§9.6.2).
  primary: "bg-merah text-kertas-1 hover:brightness-95 active:brightness-90",
  secondary: "bg-kertas-1 text-tinta border border-garis hover:bg-kertas-2",
  ghost: "text-tinta hover:bg-kertas-2",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-11 px-4 text-sm", // 44px touch target (§9.4)
  lg: "h-12 px-6 text-base",
};

/** Shared class string so anchors (links) can look identical to buttons. */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  return <button className={`${buttonClasses(variant, size)} ${className ?? ""}`} {...rest} />;
}
