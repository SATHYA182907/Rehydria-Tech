"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { courseFormSchema, type CourseFormInput, type CourseFormOutput } from "@/lib/validations/admin";
import { saveCourse } from "@/services/admin/actions";

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-line pt-8 lg:grid-cols-3">
      <div className="flex flex-col gap-1">
        <legend className="font-medium">{title}</legend>
        {description && <p className="text-sm text-ink-soft">{description}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">{children}</div>
    </fieldset>
  );
}

type Option = { value: string; label: string };
function SelectField({ name, label, options, control, error }: { name: "level" | "illustration" | "status"; label: string; options: Option[]; control: Control<CourseFormInput, unknown, CourseFormOutput>; error?: string }) {
  return (
    <Field label={label} required error={error}>
      {(p) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger {...p}><SelectValue /></SelectTrigger>
              <SelectContent>
                {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </Field>
  );
}

export function CourseForm({ courseId, defaults }: { courseId: string | null; defaults: CourseFormInput }) {
  const router = useRouter();
  const { register, control, handleSubmit, getValues, formState } = useForm<CourseFormInput, unknown, CourseFormOutput>({ resolver: zodResolver(courseFormSchema), defaultValues: defaults });
  const e = formState.errors;

  // The server re-validates the RAW input with the same schema, so send getValues(), not the
  // transformed output (e.g. price "1499" → 149900 paise happens on the server too).
  const onSubmit = handleSubmit(async () => {
    const res = await saveCourse(courseId, getValues());
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(res.message);
    if (!courseId && res.id) router.replace(`/admin/courses/${res.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <Group title="Basics" description="How the program appears on the website.">
        <Field label="Title" required error={e.title?.message} className="sm:col-span-2"><Input {...register("title")} /></Field>
        <Field label="URL slug" required error={e.slug?.message} description="/internships/{slug}, e.g. iot"><Input className="font-mono" {...register("slug")} /></Field>
        <Field label="Course code" required error={e.code?.message} description="Shown on cards, e.g. IOT-101"><Input className="font-mono uppercase" {...register("code")} /></Field>
        <Field label="Short description" required error={e.shortDescription?.message} description="20–180 characters. Used on cards and in search results." className="sm:col-span-2"><Textarea rows={2} {...register("shortDescription")} /></Field>
        <Field label="Full description" error={e.description?.message} description="Markdown supported: ## headings, - lists, **bold**, [links](https://…)." className="sm:col-span-2"><Textarea rows={8} {...register("description")} /></Field>
      </Group>

      <Group title="Format & pricing" description="Prices are entered in rupees and stored as exact paise.">
        <Field label="Duration label" required error={e.durationLabel?.message} description="e.g. 6 weeks"><Input {...register("durationLabel")} /></Field>
        <Field label="Duration (weeks)" required error={e.durationWeeks?.message}><Input type="number" min={1} {...register("durationWeeks")} /></Field>
        <Field label="Price (₹)" required error={e.price?.message}><Input inputMode="decimal" {...register("price")} /></Field>
        <Field label="Compare-at price (₹)" error={e.compareAtPrice?.message} description="Optional, shown struck through"><Input inputMode="decimal" {...register("compareAtPrice")} /></Field>
        <SelectField name="level" label="Level" control={control} error={e.level?.message} options={[{ value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }]} />
        <SelectField name="illustration" label="Card illustration" control={control} error={e.illustration?.message} options={[{ value: "network", label: "Sensor network" }, { value: "board", label: "Dev board" }, { value: "chip", label: "Chip" }, { value: "wave", label: "Waveform" }, { value: "robot", label: "Robot" }]} />
      </Group>

      <Group title="Learning outcomes" description="One item per line.">
        <Field label="Learning objectives" error={e.objectives?.message} className="sm:col-span-2"><Textarea rows={5} {...register("objectives")} /></Field>
        <Field label="Prerequisites" error={e.prerequisites?.message}><Textarea rows={4} {...register("prerequisites")} /></Field>
        <Field label="Highlights" error={e.highlights?.message} description="Shown beside the price"><Textarea rows={4} {...register("highlights")} /></Field>
        <Field label="Tags" error={e.tags?.message} description="Comma separated, e.g. ESP32, MQTT, Sensors" className="sm:col-span-2"><Input {...register("tags")} /></Field>
      </Group>

      <Group title="Publishing" description="Only published courses appear on the website.">
        <SelectField name="status" label="Status" control={control} error={e.status?.message} options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }]} />
        <Field label="Sort order" error={e.sortOrder?.message} description="Lower numbers appear first"><Input type="number" min={0} {...register("sortOrder")} /></Field>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <Controller control={control} name="enrollmentOpen" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
          Enrollment open (students can enroll when payments are enabled)
        </label>
      </Group>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-line bg-canvas/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/courses")}>Cancel</Button>
        <Button type="submit" loading={formState.isSubmitting}>{courseId ? "Save changes" : "Create course"}</Button>
      </div>
    </form>
  );
}
