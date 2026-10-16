import { GEO, IDX, KEYS_OF, SUBS } from "@/lib/simulator/constants";
import type { Idx, Op, SubId } from "@/lib/simulator/types";

const { jm, producer, inTopic, outTopic, cells, col, tm, box, row, store } = GEO;
const pathD = (p: number[][]) => "M" + p.map((q) => q.join(" ")).join(" L");

const TITLE: Record<Op, (i: Idx) => [string, string]> = {
  source: (i) => [`Source[${i}]`, `orders-${i} 읽기`],
  count: (i) => [`KeyedCount[${i}]`, `담당 key ${KEYS_OF[i].join(", ")}`],
  sink: (i) => [`Sink[${i}]`, `word-counts-${i}에 쓰기`],
};

function Task({ op, i }: { op: Op; i: Idx }) {
  const sub = `${op}${i}` as SubId;
  const x = col[i] - box.w / 2, { y, h } = row[op];
  const [title, sub2] = TITLE[op](i);
  // Source는 state를 위쪽에, 출력 네트워크 버퍼를 아래쪽에 둔다
  const stateY = op === "source" ? y + 64 : y + h - 34;
  return (
    <g className="node" id={`n-${sub}`}>
      <rect x={x} y={y} width={box.w} height={h} rx="9" />
      <text x={x + 14} y={y + 24} className="t-title">{title}</text>
      <text x={x + box.w - 12} y={y + 24} textAnchor="end" className="t-st" id={`s-${sub}`}>RUNNING</text>
      <text x={x + 14} y={y + 43} className="t-small" id={op === "count" ? `k-${sub}` : undefined}>{sub2}</text>
      {op === "count" && <text x={x + 14} y={y + 64} className="t-warn" id={`a-${sub}`} />}
      <text x={x + 14} y={stateY} className="t-bar">state · TM 메모리</text>
      <text x={x + 118} y={stateY} className="t-mono" id={`l-${sub}`} />
      {op === "source" && (
        <g>
          {/* 출력 버퍼는 하나(ResultPartition). 안이 받는 Count마다 칸(subpartition)으로 나뉜다 */}
          <rect x={x + 8} y={GEO.buf.y - 16} width={box.w - 16} height={GEO.buf.h + 44} rx="7" className="buf-outer" />
          <text x={x + 14} y={GEO.buf.y - 2} className="t-small">출력 버퍼 (받는 Count마다 칸 하나)</text>
          {IDX.map((to) => {
            const bx = to === 0 ? col[i] - 6 - GEO.buf.w : col[i] + 6;
            return (
              <g key={to}>
                <rect x={bx} y={GEO.buf.y + 4} width={GEO.buf.w} height={GEO.buf.h} rx="5" className="buf-box" />
                <text x={bx + GEO.buf.w / 2} y={GEO.buf.y + GEO.buf.h + 16} textAnchor="middle" className="t-small">{`Count[${to}] 칸`}</text>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}

/** 파티션 테이프 틀. 칸은 뷰가 매 프레임 그린다 */
function Partitions({ id, top, n, w, name, head }: { id: "in" | "out"; top: number; n: number; w: number; name: string; head?: boolean }) {
  return (
    <>
      {IDX.map((i) => {
        const x0 = col[i] - (n * w) / 2;
        return (
          <g key={i}>
            <rect x={x0 - 6} y={top - 6} width={n * w + 8} height={52} rx="7" className="part-box" />
            <text x={x0 - 2} y={top - 10} className="t-small">{`${name}-${i}`}</text>
            <g id={`${id}-cells-${i}`} />
            {head && (
              <>
                <path d={`M${col[i] - 6} ${top + 50} L${col[i] + 6} ${top + 50} L${col[i]} ${top + 58} Z`} fill="var(--rec)" />
                <text x={col[i] + 10} y={top + 60} className="t-small">{`Source[${i}]가 읽는 위치`}</text>
              </>
            )}
          </g>
        );
      })}
    </>
  );
}

/**
 * 시뮬레이터 그림 (viewBox 1200×880, 병렬도 2).
 * 위: Producer가 쓰는 입력 토픽 orders(파티션 2) → 가운데 JobManager → 좌우 TM의 Source → keyBy → Count → Sink → 아래 출력 토픽
 * 오른쪽: Checkpoint 저장소 하나
 */
export default function ClusterStage() {
  return (
    <div className="overflow-x-auto px-2" data-tour="sim-stage">
      <svg className="stage block h-auto w-full min-w-[760px]" viewBox="0 0 1200 930" role="img" aria-label="Producer가 쓰는 Kafka 입력 파티션 두 개에서 Source, KeyedCount, Sink를 거쳐 출력 파티션으로 가는 병렬도 2 파이프라인, 가운데 JobManager와 오른쪽 Checkpoint 저장소">
        {/* 입력 토픽 + Producer */}
        <g data-tour="sim-in">
          <rect x={inTopic.x} y={inTopic.y} width={inTopic.w} height={inTopic.h} rx="10" className="jm-box" />
          <text x={inTopic.x + 12} y={inTopic.y + inTopic.h - 8} className="t-title" style={{ fontSize: 13 }}>Kafka 토픽 orders</text>
          <Partitions id="in" top={cells.inTop + 8} n={cells.in} w={cells.inW} name="orders" head />
        </g>
        <g data-tour="sim-producer">
          <rect x={producer.x} y={producer.y} width={producer.w} height={producer.h} rx="10" className="producer-box" />
          <text x={producer.x + 14} y={producer.y + 24} className="t-title" style={{ fontSize: 14 }}>Producer · 주문 서비스</text>
          <text x={producer.x + 14} y={producer.y + 44} className="t-small">Flink 밖의 프로그램이 단어를 계속 씁니다</text>
          <text x={producer.x + 14} y={producer.y + 70} className="t-mono" style={{ fontSize: 12 }} id="prod-0" />
          <text x={producer.x + 200} y={producer.y + 70} className="t-mono" style={{ fontSize: 12 }} id="prod-1" />
          <path d={`M${producer.x} ${producer.y + 52} L${inTopic.x + inTopic.w + 4} ${producer.y + 52}`} className="edge" markerEnd="url(#arrow)" />
          <text x={(producer.x + inTopic.x + inTopic.w) / 2} y={producer.y + 44} textAnchor="middle" className="t-small">쓰기</text>
        </g>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--line)" />
          </marker>
        </defs>

        {/* 출력 토픽 */}
        <g data-tour="sim-out">
          <rect x={outTopic.x} y={outTopic.y} width={outTopic.w} height={outTopic.h} rx="10" className="jm-box" />
          <text x={outTopic.x + outTopic.w - 12} y={outTopic.y + outTopic.h - 10} textAnchor="end" className="t-title" style={{ fontSize: 13 }}>Kafka 토픽 word-counts · 출력</text>
          <Partitions id="out" top={cells.outTop} n={cells.out} w={cells.outW} name="word-counts" />
        </g>

        {/* 메시지 경로와 heartbeat (가운데 JM에서 좌우로) */}
        {[...GEO.trigger, ...GEO.commit].map((p, k) => <path key={k} className="msg-path" d={pathD(p)} />)}
        {GEO.heartbeat.map((p, k) => <path key={k} className="hb" d={pathD(p)} />)}
        {GEO.heartbeat.map((p, k) => (
          <text key={k} x={p[1][0] + (k === 0 ? -6 : 6)} y={p[1][1] - 4} textAnchor={k === 0 ? "end" : "start"} className="t-small" style={{ fill: "var(--ok)" }}>
            heartbeat
          </text>
        ))}

        {/* JobManager: Kafka 아래 가운데 */}
        <g data-tour="sim-jm">
          <rect x={jm.x} y={jm.y} width={jm.w} height={jm.h} rx="10" className="jm-box" />
          <text x={jm.x + jm.w / 2} y={jm.y + 22} textAnchor="middle" className="t-title" style={{ fontSize: 14 }}>JobManager</text>
          <rect x={jm.x + jm.w / 2 - 40} y={jm.y + 30} width="80" height="18" rx="9" className="pill" id="jm-pill" />
          <text x={jm.x + jm.w / 2} y={jm.y + 43} textAnchor="middle" className="pill-t" id="jm-pill-t">RUNNING</text>
          <text x={jm.x + jm.w / 2} y={jm.y + 64} textAnchor="middle" className="t-mono" style={{ fontSize: 11.5 }} id="jm-chk" />
          <text x={jm.x + jm.w / 2} y={jm.y + 79} textAnchor="middle" className="t-sub" style={{ fontSize: 10.5 }} id="jm-status">JobMaster · 정상</text>
        </g>

        {/* TaskManager */}
        {IDX.map((i) => {
          const b = tm[i], s = i === 0 ? "A" : "B", r = b.x + b.w, bt = b.y + b.h;
          return (
            <g key={i}>
              <rect id={`tm${s}-r`} x={b.x} y={b.y} width={b.w} height={b.h} rx="12" className="tm-box" />
              <text id={`tm${s}-t`} x={i === 0 ? b.x + 14 : r - 14} y={b.y + 18} textAnchor={i === 0 ? "start" : "end"} className="t-tm">{`tm-${i + 1}`}</text>
              <text id={`tm${s}-tip`} x={i === 0 ? r - 14 : b.x + 14} y={b.y + 18} textAnchor={i === 0 ? "end" : "start"} className="t-small tm-tip" />
              <g id={`tm${s}-x`} visibility="hidden">
                <line x1={b.x + 16} y1={b.y + 28} x2={r - 16} y2={bt - 12} className="tm-x" />
                <line x1={r - 16} y1={b.y + 28} x2={b.x + 16} y2={bt - 12} className="tm-x" />
              </g>
            </g>
          );
        })}

        {/* 파티션 → Source (읽는 위치에서 곧장 내려옴) */}
        {IDX.map((i) => (
          <line key={i} x1={col[i]} y1={cells.inTop + 66} x2={col[i]} y2={row.source.y} className="edge-thin" />
        ))}
        {/* keyBy 채널 4개: Source[from] 출력 버퍼 → Count[to] (network) */}
        {IDX.flatMap((from) =>
          IDX.map((to) => {
            const [x1, y1] = GEO.chanStart(from, to), [x2, y2] = GEO.chanEnd(from, to);
            return <line key={`${from}${to}`} id={`ch-${from}${to}`} className="chan" x1={x1} y1={y1} x2={x2} y2={y2} />;
          }),
        )}
        <text x={tm[1].x + tm[1].w - 14} y={row.count.y - 14} textAnchor="end" className="t-small">↖ keyBy: TM을 건너는 network 전송</text>
        {/* Count → Sink, Sink → 출력 파티션 */}
        {IDX.map((i) => (
          <g key={i}>
            <line x1={col[i]} y1={row.count.y + row.count.h} x2={col[i]} y2={row.sink.y} className="edge" />
            <line x1={col[i]} y1={row.sink.y + row.sink.h} x2={col[i]} y2={cells.outTop - 6} className="edge-thin" />
          </g>
        ))}

        <g data-tour="sim-tasks">
          {IDX.map((i) => (["source", "count", "sink"] as Op[]).map((op) => <Task key={op + i} op={op} i={i} />))}
        </g>

        {/* Checkpoint 저장소 하나. checkpoint마다 폴더가 생기고 그 안에 subtask별 state 파일이 들어간다 */}
        <g data-tour="sim-store">
          <rect x={store.x} y={store.y} width={store.w} height={store.h} rx="10" className="store-box" id="st-box" />
          <text x={store.x + 14} y={store.y + 24} className="t-title" style={{ fontSize: 14 }}>Checkpoint 저장소</text>
          <text x={store.x + store.w - 14} y={store.y + 24} textAnchor="end" className="t-mono" style={{ fontSize: 12 }} id="st-title" />
          <text x={store.x + 14} y={store.y + 44} className="t-sub" style={{ fontSize: 11 }} id="st-path">s3://flink/checkpoints/3f2a9c1e/</text>
          <text x={store.x + 14} y={store.y + 68} className="t-small">checkpoint 순간 각 TM 메모리의 state를 복사해 둔 파일</text>
          {IDX.map((i) => (
            <text key={i} x={GEO.slot.x} y={GEO.slotY[`source${i}`] - 8} className="t-small">{`tm-${i + 1}이 올린 파일`}</text>
          ))}
          {SUBS.map((sub) => (
            <g key={sub}>
              <rect x={GEO.slot.x} y={GEO.slotY[sub]} width={GEO.slot.w} height={GEO.slot.h} rx="6" className="slot-box" id={`sl-${sub}`} />
              <text x={GEO.slot.x + 12} y={GEO.slotY[sub] + 20} className="t-small" id={`sl-${sub}-h`} />
              <text x={GEO.slot.x + 12} y={GEO.slotY[sub] + 39} className="t-mono" style={{ fontSize: 12 }} id={`sl-${sub}-v`} />
            </g>
          ))}
          <text x={GEO.slot.x} y={GEO.slotY.meta - 8} className="t-small">JobManager가 마지막에 쓰는 파일</text>
          <rect x={GEO.slot.x} y={GEO.slotY.meta} width={GEO.slot.w} height={GEO.slot.h} rx="6" className="slot-box" id="sl-meta" />
          <text x={GEO.slot.x + 12} y={GEO.slotY.meta + 20} className="t-small">_metadata · 이 파일이 있어야 checkpoint로 인정</text>
          <text x={GEO.slot.x + 12} y={GEO.slotY.meta + 39} className="t-mono" style={{ fontSize: 12 }} id="sl-meta-v" />
        </g>

        {/* 레코드·barrier·스냅샷 조각·메시지 — 매 프레임 다시 그림 */}
        <g id="dyn" />
      </svg>
    </div>
  );
}
