const TONE = { bad: "bg-fail-tint text-fail", warn: "bg-barrier-tint text-barrier", good: "bg-ok-tint text-ok" };

export default function Tag({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  return <span className={"inline-block rounded-sm px-1.5 py-px text-xs font-semibold " + TONE[tone]}>{children}</span>;
}
