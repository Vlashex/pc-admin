import { Button } from "../components/ui/button";
import type { ReactNode } from "react";

export function ActionButton({
  children,
  onClick,
  disabled,
  icon,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: "primary" | "destructive" | "success";
}) {
  let classes =
    "h-16 text-lg flex items-center justify-center transition-colors rounded-md shadow-sm font-medium";

  if (variant === "destructive") {
    classes +=
      " bg-destructive text-destructive-foreground hover:opacity-90 border border-destructive";
  } else if (variant === "success") {
    classes +=
      " bg-success text-success-foreground hover:opacity-90 border border-success";
  } else {
    classes +=
      " bg-primary text-primary-foreground hover:opacity-90 border border-primary";
  }

  return (
    <Button onClick={onClick} disabled={disabled} className={classes}>
      {icon}
      {children}
    </Button>
  );
}
