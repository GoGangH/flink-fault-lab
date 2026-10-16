const STEPS = [
  ["장애 발생", "TM 종료"],
  ["장애 감지", "heartbeat 타임아웃"],
  ["범위 결정", "region 전체 취소"],
  ["재시작 판단", "Restart Strategy"],
  ["재배포", "새 TM에 slot 할당"],
  ["State 복원", "checkpoint로 되감기"],
];

/** 복구 6단계를 가로 진행 막대로. 진행 상태(active/done/failed)는 뷰가 클래스로 표시한다. */
export default function RecoverySteps() {
  return (
    <div className="border-t border-line px-4 py-3" data-tour="sim-steps">
      <ol className="steps grid grid-cols-6 gap-1.5 max-md:grid-cols-3" id="steps">
        {STEPS.map(([t, d], i) => (
          <li key={t} data-s={i + 1} className="grid grid-cols-[22px_1fr] items-start gap-2 rounded-md px-2 py-1.5 text-[12.5px] leading-snug text-muted">
            <span className="n grid size-5 place-items-center rounded-full border-[1.5px] border-line font-mono text-[11px]">{i + 1}</span>
            <span>
              <b className="block font-semibold text-ink">{t}</b>
              {d}
              <small className="block font-mono text-[11px]" />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
