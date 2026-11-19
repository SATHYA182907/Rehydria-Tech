"use server";

import { FieldPath } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/services/auth/session";
import type { OptionId } from "@/shared/types/domain";
import { AssessmentError, finalizeAttempt, ownedAttempt, startAttempt, SUBMIT_GRACE_MS, type AttemptOutcome, type LiveAttempt } from "./engine";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const id = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/);
const option = z.enum(["a", "b", "c", "d"]);

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof AssessmentError) return { ok: false, error: err.message };
  console.error("[assessment]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function startAssessment(input: unknown): Promise<Result<LiveAttempt>> {
  const user = await requireUser();
  const parsed = z.object({ courseId: id }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid course." };
  try {
    return { ok: true, data: await startAttempt(user.uid, parsed.data.courseId) };
  } catch (err) {
    return fail(err);
  }
}

/** Saves one answer so a reload, or a timeout, keeps it. */
export async function saveAnswer(input: unknown): Promise<Result<null>> {
  const user = await requireUser();
  const parsed = z.object({ attemptId: id, questionId: id, optionId: option }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid answer." };
  try {
    const { ref, data, expiresMs } = await ownedAttempt(user.uid, parsed.data.attemptId);
    if (data.status !== "in_progress" || Date.now() > expiresMs + SUBMIT_GRACE_MS) return { ok: false, error: "Time is up for this attempt." };
    const served = (data.questions as { questionId: string }[]).some((q) => q.questionId === parsed.data.questionId);
    if (!served) return { ok: false, error: "Invalid question." };
    await ref.update(new FieldPath("answers", parsed.data.questionId), parsed.data.optionId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

/** Submits the attempt (answers sent with the submit are merged first if still on time). */
export async function submitAssessment(input: unknown): Promise<Result<AttemptOutcome>> {
  const user = await requireUser();
  const parsed = z.object({ attemptId: id, answers: z.record(id, option).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission." };
  try {
    const { ref, data, expiresMs } = await ownedAttempt(user.uid, parsed.data.attemptId);
    const onTime = Date.now() <= expiresMs + SUBMIT_GRACE_MS;
    const served = new Set((data.questions as { questionId: string }[]).map((q) => q.questionId));
    const late: Record<string, OptionId> = {};
    if (onTime) for (const [q, o] of Object.entries(parsed.data.answers ?? {})) if (served.has(q)) late[q] = o;
    const outcome = await finalizeAttempt(ref, onTime ? "manual" : "auto_timeout", late);
    if (outcome.certificateId) updateTag(`certificate:${outcome.certificateId}`);
    revalidatePath(`/dashboard/courses/${String(data.courseId)}`);
    revalidatePath("/dashboard/certificates");
    return { ok: true, data: outcome };
  } catch (err) {
    return fail(err);
  }
}
