import type { ScriptPage } from "@/lib/script";

/** 한 페이지 분량의 대본: 말할 내용과 화면 동작 */
export default function ScriptBody({ script, large = false }: { script: ScriptPage; large?: boolean }) {
  return (
    <>
      <div className={"grid " + (large ? "gap-5 text-[clamp(18px,1.9vw,22px)] leading-[1.7]" : "gap-3 text-base leading-relaxed")}>
        {script.say.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
      {script.cue && (
        <div className={"rounded-md border-l-[3px] border-barrier bg-barrier-tint px-4 py-3 " + (large ? "mt-7 text-[15px]" : "mt-4 text-sm")}>
          <div className="mb-1 font-semibold">화면 동작</div>
          <ul className="grid list-disc gap-1 pl-5">
            {script.cue.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
