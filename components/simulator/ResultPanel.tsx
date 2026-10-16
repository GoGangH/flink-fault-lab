import PanelTitle from "./PanelTitle";

const METRICS = [
  ["m-out", "커밋된 출력"],
  ["m-dup", "중복"],
  ["m-lost", "유실"],
  ["m-rs", "재시작"],
];

/** 유실·중복 지표와 state 정답 비교 */
export default function ResultPanel() {
  return (
    <div className="min-w-0 px-4 py-4" data-tour="sim-results">
      <PanelTitle>결과 검증</PanelTitle>
      <div className="mb-3 grid grid-cols-4 gap-2 max-sm:grid-cols-2">
        {METRICS.map(([id, t]) => (
          <div key={id} className="metric rounded-md bg-sunk px-2.5 py-2" id={id}>
            <span className="block text-[11.5px] text-muted">{t}</span>
            <b className="font-mono text-xl font-semibold tabular-nums">0</b>
          </div>
        ))}
      </div>
      <table className="state-tbl w-full border-collapse text-[13px] tabular-nums">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th className="px-1.5 py-1 text-left font-medium">key</th>
            <th className="px-1.5 py-1 text-right font-medium">담당</th>
            <th className="px-1.5 py-1 text-right font-medium">state 값</th>
            <th className="px-1.5 py-1 text-right font-medium">정답</th>
          </tr>
        </thead>
        <tbody id="state-body" />
      </table>
      <div className="verdict mt-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium" id="verdict">state 정확</div>
    </div>
  );
}
