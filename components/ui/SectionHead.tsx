import Eyebrow from "./Eyebrow";

export default function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[clamp(26px,3.4vw,36px)] leading-tight font-bold tracking-[-0.02em]">{title}</h2>
      {children && <p className="mt-3.5 max-w-[65ch] text-[17px] text-muted">{children}</p>}
    </div>
  );
}
