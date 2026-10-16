const ITEMS = [
  ["size-3 rounded-full bg-rec", "레코드"],
  ["size-2 rounded-full bg-ok", "heartbeat (JM↔TM 생존 신호)"],
  ["size-3 rounded-full border border-barrier bg-barrier-dot", "barrier (숫자 = checkpoint 번호)"],
  ["h-3 w-5 rounded-sm border border-barrier bg-barrier-tint", "스냅샷 조각"],
  ["h-3 w-5 rounded-sm bg-line", "읽은 입력"],
  ["h-3 w-5 rounded-sm bg-ok-tint", "커밋된 출력"],
  ["h-3 w-5 rounded-sm border border-dashed border-pending bg-pending-tint", "미커밋 출력"],
  ["h-3 w-5 rounded-sm border border-line opacity-60", "abort됨"],
  ["h-3 w-5 rounded-sm border border-fail bg-fail-tint", "유실·중복"],
];

/** 시뮬레이터 그림 기호 */
export default function SimLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line px-[18px] py-3 text-xs text-muted">
      {ITEMS.map(([c, t]) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <i className={"inline-block " + c} />
          {t}
        </span>
      ))}
    </div>
  );
}
