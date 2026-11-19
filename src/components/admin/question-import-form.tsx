"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { importQuestions } from "@/services/admin/actions";
import { parseQuestionText } from "@/shared/question-import";

const EXAMPLE = `Q: Which pin reads an analog input on an Arduino Uno?
a) D13
b) A0
c) GND
d) VIN
Answer: b

Q: Which protocol is commonly used to publish IoT sensor data?
a) FTP
b) SMTP
c) MQTT
d) POP3
Answer: c`;

export function QuestionImportForm({ courses }: { courses: { id: string; title: string; count: number }[] }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [source, setSource] = useState("");
  const [pending, start] = useTransition();
  const preview = useMemo(() => (source.trim() ? parseQuestionText(source) : null), [source]);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await importQuestions({ courseId, source });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success(res.message);
          setSource("");
          router.refresh();
        });
      }}
    >
      <Field label="Course">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger aria-label="Course">
            <SelectValue placeholder="Choose a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title} ({c.count} active questions)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Questions" description="One block per question, separated by a blank line. Each needs four options (a–d) and an Answer line.">
        <Textarea rows={16} value={source} onChange={(e) => setSource(e.target.value)} placeholder={EXAMPLE} className="font-mono text-sm" />
      </Field>
      {preview && (
        <div className="rounded-sm border border-line bg-canvas-2 p-4 text-sm" aria-live="polite">
          <p className="font-medium">{preview.questions.length} valid question{preview.questions.length === 1 ? "" : "s"}</p>
          {preview.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-danger">
              {preview.errors.slice(0, 8).map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Button type="submit" className="w-fit" loading={pending} disabled={!courseId || !preview || preview.errors.length > 0}>
        Add questions
      </Button>
    </form>
  );
}
