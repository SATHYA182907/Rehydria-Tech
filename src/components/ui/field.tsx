"use client";

import { CircleAlert } from "lucide-react";
import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Label } from "./input";

export interface FieldControlProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
  "aria-required": true | undefined;
}

interface FieldProps {
  label: ReactNode;
  /**
   * A single form control (receives id/aria props automatically), or a render function for
   * composite controls such as Select: `{(p) => <Select><SelectTrigger {...p} />…</Select>}`.
   */
  children: ReactElement<Record<string, unknown>> | ((props: FieldControlProps) => ReactNode);
  description?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Visually hide the label (it stays available to assistive tech). */
  hideLabel?: boolean;
}

/**
 * Label + control + help text + error, wired for accessibility.
 * Works with React Hook Form: `<Field label="Email" error={errors.email?.message}><Input {...register("email")} /></Field>`
 */
export function Field({ label, children, description, error, required, className, hideLabel }: FieldProps) {
  const id = useId();
  const controlId = `${id}-control`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const controlProps: FieldControlProps = {
    id: controlId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": required ? true : undefined,
  };

  let control: ReactNode;
  let resolvedId = controlId;
  if (typeof children === "function") {
    control = children(controlProps);
  } else {
    const child = Children.only(children);
    resolvedId = (isValidElement(child) && (child.props.id as string | undefined)) || controlId;
    control = isValidElement(child) ? cloneElement(child, { ...controlProps, id: resolvedId }) : child;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} data-invalid={error ? "" : undefined}>
      <Label htmlFor={resolvedId} className={cn(hideLabel && "sr-only")}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-moss">
            *
          </span>
        )}
      </Label>
      {control}
      {description && !error && (
        <p id={descriptionId} className="text-[13px] text-ink-soft">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-danger">
          <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
