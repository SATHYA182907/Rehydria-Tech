import { LogoMark } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

export interface CertificateData {
  id: string;
  studentName: string;
  courseTitle: string;
  grade: string;
  issuedAt: string | null;
  directorName: string;
}

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * The certificate artwork (A4 landscape ratio). Sized with container-query units so it
 * scales crisply from a dashboard card to a printed page. Contains only data from the
 * certificate record; nothing is invented.
 */
export function CertificateDocument({ cert, className }: { cert: CertificateData; className?: string }) {
  return (
    <div className={cn("@container w-full", className)}>
      <div
        className="relative aspect-[297/210] w-full overflow-hidden bg-[#FBFCF8] text-ink [print-color-adjust:exact]"
        style={{ boxShadow: "inset 0 0 0 0.9cqw #173F35, inset 0 0 0 1.25cqw #FBFCF8, inset 0 0 0 1.4cqw #B8E4C9" }}
      >
        {/* Guilloché-like rings */}
        <svg aria-hidden="true" viewBox="0 0 400 400" className="absolute -right-[12cqw] -bottom-[16cqw] w-[48cqw] text-moss opacity-[0.09]">
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx="200" cy="200" r={40 + i * 11} fill="none" stroke="currentColor" strokeWidth="1.2" />
          ))}
        </svg>
        <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(#173F35_0.6px,transparent_0.6px)] [background-size:2.2cqw_2.2cqw] opacity-[0.05]" />

        <div className="relative flex h-full flex-col items-center justify-between px-[8cqw] py-[5.5cqw] text-center">
          <div className="flex flex-col items-center gap-[1cqw]">
            <div className="flex items-center gap-[1cqw]">
              <LogoMark className="size-[3.6cqw]" />
              <span className="text-[1.9cqw] font-semibold tracking-[0.18em] text-forest uppercase">{siteConfig.legalName}</span>
            </div>
            <span className="mt-[1.6cqw] font-mono text-[1.2cqw] tracking-[0.32em] text-moss uppercase">Certificate of completion</span>
          </div>

          <div className="flex flex-col items-center gap-[1.2cqw]">
            <span className="text-[1.5cqw] text-ink-soft">This is to certify that</span>
            <span className="font-serif text-[5.4cqw] leading-none text-forest italic">{cert.studentName}</span>
            <span aria-hidden="true" className="h-px w-[40cqw] bg-gradient-to-r from-transparent via-moss to-transparent" />
            <span className="max-w-[62cqw] text-[1.5cqw] leading-relaxed text-ink-soft">
              has successfully completed the internship program and passed the final assessment of
            </span>
            <span className="text-[2.6cqw] leading-tight font-medium tracking-tight">{cert.courseTitle}</span>
          </div>

          <div className="grid w-full grid-cols-3 items-end gap-[3cqw] text-[1.15cqw]">
            <div className="flex flex-col items-start gap-[0.4cqw] text-left">
              <span className="font-mono text-[0.95cqw] tracking-[0.16em] text-ink-soft uppercase">Issued on</span>
              <span className="font-medium">{cert.issuedAt ? date.format(new Date(cert.issuedAt)) : "-"}</span>
              <span className="mt-[0.6cqw] font-mono text-[0.95cqw] tracking-[0.16em] text-ink-soft uppercase">Certificate ID</span>
              <span className="font-mono font-medium">{cert.id}</span>
            </div>
            <div className="flex justify-center">
              <div className="relative flex size-[10cqw] flex-col items-center justify-center rounded-full bg-forest text-mint shadow-[0_0_0_0.4cqw_#FBFCF8,0_0_0_0.55cqw_#367A65]">
                <span className="font-mono text-[0.8cqw] tracking-[0.2em] uppercase opacity-80">Grade</span>
                <span className="text-[3.4cqw] leading-none font-semibold">{cert.grade}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-[0.4cqw] text-right">
              <span aria-hidden="true" className="h-px w-[18cqw] bg-ink/40" />
              <span className="font-medium">{cert.directorName || "Director"}</span>
              <span className="text-ink-soft">{cert.directorName ? "Director, " : ""}{siteConfig.name}</span>
              <span className="mt-[0.6cqw] text-[0.95cqw] text-ink-soft">Verify at {siteConfig.url.replace(/^https?:\/\//, "")}/verify</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
