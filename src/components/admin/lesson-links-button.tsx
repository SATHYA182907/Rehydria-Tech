"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveLessonLinks } from "@/services/admin/actions";

export function LessonLinksButton({ lessonId, title, videoUrl, pdfUrl }: { lessonId: string; title: string; videoUrl: string | null; pdfUrl: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [video, setVideo] = useState(videoUrl ?? "");
  const [pdf, setPdf] = useState(pdfUrl ?? "");
  const [pending, start] = useTransition();
  const count = Number(Boolean(videoUrl)) + Number(Boolean(pdfUrl));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          {count ? `Edit links (${count})` : "Add links"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lesson content</DialogTitle>
          <DialogDescription>{title}. Links are shown only to enrolled students.</DialogDescription>
        </DialogHeader>
        <form
          id={`links-${lessonId}`}
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await saveLessonLinks({ lessonId, videoUrl: video, pdfUrl: pdf });
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              toast.success(res.message);
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <Field label="Video link" description="e.g. an unlisted YouTube or Google Drive link (https://)">
            <Input type="url" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://" />
          </Field>
          <Field label="PDF link" description="e.g. a Google Drive PDF shared as “anyone with the link”">
            <Input type="url" value={pdf} onChange={(e) => setPdf(e.target.value)} placeholder="https://" />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={`links-${lessonId}`} loading={pending}>
            Save links
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
