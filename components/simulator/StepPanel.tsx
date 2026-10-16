import { btnPrime } from "@/lib/ui";

/**
 * 단계별 모드의 설명 카드. 한 장면이 끝나면 멈추고 설명을 띄운다.
 * 내용과 버튼 상태는 lib/simulator/view.ts(syncMode)가 채운다.
 */
export default function StepPanel() {
  return (
    <div id="step-panel" className="group border-b border-line bg-surface px-4 py-3.5" data-waiting="false" data-tour="sim-step">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs text-muted" id="step-scn" />
        <span className="font-mono text-xs text-muted tabular-nums" id="step-idx" />
        <div className="flex min-w-[120px] flex-1 gap-1" id="step-dots" />
      </div>
      <div className="mt-2 flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-[17px] font-semibold" id="step-title" />
          <p className="mt-1 max-w-[80ch] text-[15px] leading-relaxed text-muted group-data-[waiting=false]:italic" id="step-desc" />
        </div>
        <button type="button" id="step-next" className={btnPrime + " min-w-24 px-5 py-2 text-[14px]"} title="다음 단계 (Space)">
          다음
        </button>
      </div>
    </div>
  );
}
