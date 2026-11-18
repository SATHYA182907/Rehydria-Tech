import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/feedback";

export function DashboardHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="flex flex-col gap-2">
        {eyebrow && <p className="font-mono text-eyebrow uppercase text-moss-text">{eyebrow}</p>}
        <h1 className="text-3xl font-medium tracking-[-0.03em] md:text-4xl">{title}</h1>
        {description && <p className="max-w-[60ch] text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function UserSlotSkeleton() {
  return <Skeleton className="h-10 w-40 rounded-pill" />;
}
