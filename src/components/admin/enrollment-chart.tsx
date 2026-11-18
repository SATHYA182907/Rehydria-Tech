"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Enrollments per course (active + completed). Brand colours; animates on mount. */
export default function EnrollmentChart({ data }: { data: { course: string; count: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label={`Enrollments by course: ${data.map((d) => `${d.course} ${d.count}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="#dde3dc" />
          <XAxis dataKey="course" tickLine={false} axisLine={false} tick={{ fill: "#5e6a62", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5e6a62", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "#eef2ed" }} contentStyle={{ borderRadius: 8, border: "1px solid #dde3dc", fontSize: 13 }} />
          <Bar dataKey="count" name="Enrollments" fill="#367a65" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
