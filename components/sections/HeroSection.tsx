import Section from "@/components/ui/Section";
import Eyebrow from "@/components/ui/Eyebrow";

const QUESTIONS = [
  ["sim", "복구 과정", "TaskManager가 죽으면 Job은 어떤 순서로 다시 뜨나"],
  ["checkpoint", "복원 기준", "무엇을 기준으로 State를 되살리나"],
  ["exactly", "유실과 중복", "그 사이 데이터는 괜찮은가"],
];

export default function HeroSection() {
  return (
    <Section id="top" className="pt-12 pb-16">
      <div className="flex min-h-[calc(100vh-170px)] flex-col justify-center">
      <div data-tour="hero-title">
        <Eyebrow>Apache Flink</Eyebrow>
        <h1 className="text-[clamp(44px,7vw,84px)] leading-none font-bold tracking-[-0.035em]">Fault Tolerance</h1>
        <p className="mt-4 text-[clamp(18px,2.2vw,24px)] font-medium text-muted">TaskManager 장애 복구와 데이터 정합성</p>
      </div>

      <div data-tour="hero-flow" className="flow relative my-12 h-[30px] overflow-hidden rounded-lg bg-sunk" aria-hidden="true">
        <div className="absolute inset-y-0 left-[68%] z-[1] grid w-[62px] place-items-center bg-[linear-gradient(90deg,var(--sunk),var(--fail-tint)_40%,var(--fail-tint)_60%,var(--sunk))]">
          <b className="font-mono text-xs text-fail">✕ tm-1</b>
        </div>
      </div>

      <ol data-tour="hero-questions" className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
        {QUESTIONS.map(([id, t, d], i) => (
          <li key={id} className="border-t border-line pt-3">
            <a href={"#" + id} className="block text-ink no-underline hover:text-rec">
              <span className="text-[13px] text-muted">질문 {i + 1}</span>
              <b className="mt-0.5 block text-base font-semibold">{t}</b>
              <span className="mt-0.5 block text-sm text-muted">{d}</span>
            </a>
          </li>
        ))}
      </ol>
      </div>
    </Section>
  );
}
