"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { companyFormSchema, type CompanyFormInput, type CompanyFormOutput } from "@/lib/validations/admin";
import { saveCompanySettings } from "@/services/admin/actions";

export function CompanyForm({ defaults }: { defaults: CompanyFormInput }) {
  const { register, handleSubmit, getValues, formState } = useForm<CompanyFormInput, unknown, CompanyFormOutput>({ resolver: zodResolver(companyFormSchema), defaultValues: defaults });
  const e = formState.errors;
  const onSubmit = handleSubmit(async () => {
    const res = await saveCompanySettings(getValues());
    if (res.ok) toast.success(res.message);
    else toast.error(res.error);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field label="Contact email" error={e.email?.message}><Input type="email" {...register("email")} /></Field>
      <Field label="Contact phone" error={e.phone?.message}><Input type="tel" {...register("phone")} /></Field>
      <Field label="Address" error={e.address?.message} className="sm:col-span-2"><Textarea rows={2} {...register("address")} /></Field>
      <Field label="Director name" error={e.directorName?.message} description="Printed on certificates"><Input {...register("directorName")} /></Field>
      <div />
      <Field label="LinkedIn URL" error={e.linkedin?.message}><Input {...register("linkedin")} /></Field>
      <Field label="Instagram URL" error={e.instagram?.message}><Input {...register("instagram")} /></Field>
      <Field label="YouTube URL" error={e.youtube?.message}><Input {...register("youtube")} /></Field>
      <Field label="X URL" error={e.x?.message}><Input {...register("x")} /></Field>
      <Field label="GitHub URL" error={e.github?.message}><Input {...register("github")} /></Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={formState.isSubmitting}>Save company details</Button>
      </div>
    </form>
  );
}
