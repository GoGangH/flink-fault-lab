import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import { QA } from "@/lib/content";

export default function QnaSection() {
  return (
    <Section id="qa">
      <SectionHead eyebrow="Q&A" title="예상 질문" />
      <div data-tour="qa-list" className="grid gap-2">
        {QA.map(([q, a]) => (
          <details key={q} className="rounded-md border border-line bg-surface px-4">
            <summary className="cursor-pointer py-3.5 text-[15px] font-semibold">{q}</summary>
            <p className="max-w-[75ch] pb-4 text-[14.5px] text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
