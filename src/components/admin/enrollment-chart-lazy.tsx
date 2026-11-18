"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/feedback";

/** Recharts only loads on the admin overview. */
export const EnrollmentChartLazy = dynamic(() => import("./enrollment-chart"), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });
