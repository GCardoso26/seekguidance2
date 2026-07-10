import { cn } from "@/lib/utils";

type FieldErrorProps = {
  message?: string;
  className?: string;
  id?: string;
};

export function FieldError({ message, className, id }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={cn("mt-1 text-xs text-danger", className)}>
      {message}
    </p>
  );
}
