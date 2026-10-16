import { GEO, IDX, KEYS_OF, PHASE_TIME, STRATS, SUBS, TIMING, ackPath, along, keyOf, route } from "./constants";
import type { SimEngine } from "./engine";
import { narrate } from "./narration";
import type { Counts, Idx, Item, Key, Op, Slot, SubId } from "./types";
import type { Step } from "./steps";

const opOf = (s: SubId) => s.slice(0, -1) as Op;
const idxOfSub = (s: SubId) => Number(s.slice(-1)) as Idx;
const fmtCounts = (j: Idx, c: Counts | null) => (c ? KEYS_OF[j].map((k) => `${k} ${c[k] ?? 0}`).join(" · ") : "-");

/**
 * 엔진 상태를 시뮬레이터 DOM에 그린다.
 * 60fps 갱신이라 React 렌더링 대신 id로 찾은 요소를 직접 바꾼다.
 * 마크업은 components/simulator/* 에 있고, 여기서 쓰는 id는 그 컴포넌트들과 맞춰져 있다.
 */
export class SimView {
  private lastLogLen = 0;
  private lastLogRef: unknown = null;

  constructor(private root: HTMLElement) {}

  private $<T extends Element = HTMLElement>(sel: string) {
    return this.root.querySelector(sel) as T;
  }
  private $$<T extends Element = HTMLElement>(sel: string) {
    return [...this.root.querySelectorAll(sel)] as T[];
  }

  resetLog() {
    this.lastLogRef = null;
  }

  /* ---------- 매 프레임: 그림 ---------- */

  private eng: SimEngine | null = null;

  renderStage(eng: SimEngine) {
    this.eng = eng;
    const { S } = eng;
    for (const slot of ["A", "B"] as Slot[]) {
      const tm = S.tms[slot];
      this.$(`#tm${slot}-r`).setAttribute("class", "tm-box tm-" + tm.st);
      // 복구 중 살아 있는 TM은 프로세스는 그대로 두고 그 위의 Task만 내렸다 다시 올린다
      const taskRestart = tm.st === "alive" && !!S.phase && S.phase.step >= 3;
      this.$(`#tm${slot}-t`).textContent =
        tm.name + (tm.st === "dead" ? " · 연결 끊김" : tm.st === "new" ? " · 새 TM" : taskRestart ? " · TM은 그대로, Task만 재시작" : "");
      this.$(`#tm${slot}-x`).setAttribute("visibility", tm.st === "dead" ? "visible" : "hidden");
    }
    for (const s of SUBS) {
      this.$(`#n-${s}`).setAttribute("class", "node st-" + S.task[s] + (S.flash[s] > 0 ? " flash" : ""));
      this.$(`#s-${s}`).textContent = S.task[s];
    }
    // 각 subtask가 지금 들고 있는 state
    for (const i of IDX) {
      this.$(`#l-source${i}`).textContent = `offset ${S.pos[i]}`;
      this.$(`#l-count${i}`).textContent = fmtCounts(i, S.counts[i]);
      this.$(`#l-sink${i}`).textContent = eng.eo
        ? `txn ${S.sinkTxn[i]} · 미커밋 ${S.output.filter((r) => r.j === i && (r.st === "pending" || r.st === "pre")).length}건`
        : "없음";
      // key → subtask는 고정, subtask → TM은 배포 때 정해진다 (장애 후 새 TM으로 바뀔 수 있음)
      const tm = S.tms[i === 0 ? "A" : "B"];
      this.$(`#k-count${i}`).textContent = `담당 key ${KEYS_OF[i].join(", ")} · 실행 TM: ${tm.name}${tm.st === "dead" ? " (죽음)" : tm.st === "new" ? " (새로 배포)" : ""}`;
      const b = eng.blockedChannel(i);
      this.$(`#a-count${i}`).textContent = b == null ? "" : `정렬 대기: Source[${b === 0 ? 1 : 0}]의 barrier를 기다림`;
      for (const from of IDX) {
        this.$(`#ch-${from}${i}`).setAttribute("class", "chan" + (b === from ? " blocked" : ""));
      }
    }
    this.renderJobManager(eng);
    this.renderStore(eng);
    for (const i of IDX) {
      this.$(`#prod-${i}`).textContent = `orders-${i} 최신 offset ${Math.max(0, S.logEnd[i] - 1)}`;
      this.$(`#in-cells-${i}`).innerHTML = this.inputCells(eng, i);
      this.$(`#out-cells-${i}`).innerHTML = this.outputCells(eng, i);
    }
    this.$("#dyn").innerHTML = this.movingParts(eng);
  }

  private renderJobManager(eng: SimEngine) {
    const { S, settings } = eng;
    let tone = "", txt = "RUNNING";
    if (S.job === "FAILED") { tone = "bad"; txt = "FAILED"; }
    else if (S.phase && S.phase.step >= 2) { tone = "warn"; txt = "복구 중"; }
    this.$("#jm-pill").setAttribute("class", "pill " + tone);
    const pt = this.$("#jm-pill-t");
    pt.setAttribute("class", "pill-t " + tone);
    pt.textContent = txt;

    let st = "JobMaster · 정상";
    if (S.job === "FAILED") st = "JobMaster · 재시작 포기";
    else if (S.phase) st = ["", "JobMaster · 아직 모름", "JobMaster · heartbeat 없음", "JobMaster · Task 취소", `JobMaster · ${Math.max(0, S.phase.left).toFixed(1)}s 뒤 재시작`, "JobMaster · 재배포", "JobMaster · state 복원"][S.phase.step];
    this.$("#jm-status").textContent = st;

    this.$("#jm-chk").textContent = !settings.chk
      ? "꺼짐"
      : S.inProg
        ? `chk-${S.inProg.id} 진행 · ack ${S.inProg.acks}/6`
        : S.phase || S.job === "FAILED"
          ? "대기"
          : eng.manualChk
            ? "다음 단계에서 checkpoint"
          : `${Math.max(0, TIMING.chk - S.acc.chk).toFixed(1)}s 뒤 chk-${S.nextChk}`;
  }

  /** Checkpoint 저장소(하나): chk-N 폴더 안 subtask별 파일 칸과 _metadata. 진행 중 조각이 들어오면 새 값으로 바뀐다 */
  private renderStore(eng: SimEngine) {
    const { S, settings } = eng;
    const p = S.inProg, last = S.last, failed = S.failedChk;
    let title = "아직 완료된 checkpoint 없음", cls = "store-box", folder = last?.id;
    if (!settings.chk) title = "checkpoint 꺼짐";
    else if (failed) { title = `chk-${failed.id} 실패 · 폐기`; cls += " failed"; folder = failed.id; }
    else if (p) { title = `chk-${p.id} 미확정 · ${p.acks}/6`; folder = p.id; }
    else if (last) { title = `chk-${last.id} 확정`; cls += " done"; }
    this.$("#st-title").textContent = title;
    this.$("#st-box").setAttribute("class", cls);
    this.$("#st-path").textContent = `s3://flink/checkpoints/3f2a9c1e/${folder ? `chk-${folder}/` : ""}`;

    const head: Record<Op, string> = { source: "Source", count: "KeyedCount", sink: "Sink" };
    const value = (s: SubId, offsets: (number | null)[], counts: (Counts | null)[], id: number) => {
      const i = idxOfSub(s), op = opOf(s);
      if (op === "source") return offsets[i] == null ? "-" : `offset ${offsets[i]}`;
      if (op === "count") return fmtCounts(i, counts[i]);
      return eng.eo ? `txn ${id} preCommit` : "저장할 것 없음";
    };
    for (const s of SUBS) {
      const fresh = !!p && p.done.includes(s);
      let h = `${head[opOf(s)]}[${idxOfSub(s)}]`, v = "";
      if (settings.chk) {
        if (fresh) { h += ` · chk-${p!.id} 올라옴 (미확정)`; v = value(s, p!.offsets, p!.counts, p!.id); }
        else if (last) { h += ` · chk-${last.id} 확정됨`; v = value(s, last.offsets, last.counts, last.id); }
        else v = "-";
      }
      this.$(`#sl-${s}-h`).textContent = h;
      this.$(`#sl-${s}-v`).textContent = v;
      this.$(`#sl-${s}`).setAttribute("class", "slot-box" + (fresh ? " fresh" : ""));
    }
    const metaDone = settings.chk && !p && !failed && !!last;
    this.$("#sl-meta-v").textContent = !settings.chk ? "" : p ? `아직 없음 → chk-${p.id}는 아직 무효 (${p.acks}/6)` : failed ? `기록 안 됨 → chk-${failed.id}는 버림` : last ? `chk-${last.id} 기록됨 → 이 순간 확정` : "-";
    this.$("#sl-meta").setAttribute("class", "slot-box" + (metaDone ? " meta" : ""));
  }

  /** fetch 진행도 중 이 지점부터 테이프가 다음 칸으로 당겨진다 (앞부분은 레코드가 내려가는 시간) */
  private static SHIFT_FROM = 0.5;
  /** 새 레코드가 파티션 끝에 들어오는 시간(초) */
  private static POP = 0.35;

  /** 방금 읽은 레코드의 fetch 진행도 (테이프 당김 애니메이션용) */
  private fetchP(eng: SimEngine, i: Idx) {
    const it = eng.S.items.find((x) => x.k === "rec" && x.at === "fetch" && x.i === i && x.o === eng.S.pos[i] - 1);
    return it ? it.p : 1;
  }

  /**
   * 입력 파티션은 테이프처럼 그린다. "읽는 위치"(▼) 바로 위 칸이 다음에 읽을 offset이고,
   * 왼쪽은 이미 읽었거나 건너뛴 칸, 오른쪽은 아직 안 읽은 칸이다.
   * 읽으면 ▼ 위 칸에서 레코드가 내려가고, 그다음 테이프가 한 칸 당겨져 다음 칸이 ▼ 위로 온다.
   */
  private inCellX(eng: SimEngine, i: Idx, o: number) {
    const w = GEO.cells.inW;
    const p = this.fetchP(eng, i);
    const shift = p <= SimView.SHIFT_FROM ? 0 : (p - SimView.SHIFT_FROM) / (1 - SimView.SHIFT_FROM);
    const anchor = eng.S.pos[i] - 1 + shift;
    return GEO.col[i] - (w - 4) / 2 + (o - anchor) * w;
  }

  private inputCells(eng: SimEngine, i: Idx) {
    const { S, settings } = eng;
    const w = GEO.cells.inW, half = Math.floor(GEO.cells.in / 2), y = GEO.cells.inTop + 8;
    const minX = GEO.col[i] - (GEO.cells.in * w) / 2 - 4, maxX = GEO.col[i] + (GEO.cells.in * w) / 2;
    const cut = settings.chk && S.last ? S.last.offsets[i] : -1;
    const sincePop = S.acc.prod[i];
    let h = "";
    let lostX: number | null = null;
    for (let o = Math.max(0, S.pos[i] - 2 - half); o < Math.min(S.logEnd[i], S.pos[i] + half + 1); o++) {
      let x = this.inCellX(eng, i, o);
      // 막 쓰인 레코드는 파티션 오른쪽 끝에서 미끄러져 들어온다
      const isNew = o === S.logEnd[i] - 1 && sincePop >= 0 && sincePop < SimView.POP;
      if (isNew) x += (1 - sincePop / SimView.POP) * w;
      if (x < minX || x + w - 4 > maxX) continue;
      const st = S.lost.has(`${i}:${o}`) ? "lost" : o < S.pos[i] ? "read" : "unread";
      if (st === "lost") lostX = Math.max(lostX ?? x, x);
      h += `<rect x="${x}" y="${y}" width="${w - 4}" height="40" rx="5" class="cell cell-${st}${isNew ? " cell-new" : ""}"/>`;
      h += `<text x="${x + (w - 4) / 2}" y="${y + 18}" text-anchor="middle" class="cell-k">${keyOf(i, o)}</text>`;
      h += `<text x="${x + (w - 4) / 2}" y="${y + 33}" text-anchor="middle" class="cell-o">${o}</text>`;
      if (o === cut) h += `<rect x="${x - 3.5}" y="${y - 4}" width="3" height="48" rx="1.5" fill="var(--barrier)"/>`;
    }
    // 유실된 칸이 테이프 밖으로 밀려나도 몇 개를 건너뛰었는지 남겨 둔다
    const lostN = [...S.lost].filter((k) => k.startsWith(`${i}:`)).length;
    if (lostN) h += `<text x="${GEO.col[i] - (GEO.cells.in * w) / 2 + 70}" y="${y - 10}" class="t-warn" style="font-size:10.5px">유실 ${lostN}개 · 건너뜀</text>`;
    const lag = S.logEnd[i] - S.pos[i];
    if (lag > half) h += `<text x="${maxX}" y="${y - 10}" text-anchor="end" class="t-warn" style="font-size:10.5px">밀린 레코드 ${lag}개 →</text>`;
    return h;
  }

  private outputCells(eng: SimEngine, j: Idx) {
    const n = GEO.cells.out, w = GEO.cells.outW, x0 = GEO.col[j] - (n * w) / 2;
    const recs = eng.S.output.filter((r) => r.j === j).slice(-n);
    let h = "";
    recs.forEach((r, k) => {
      const x = x0 + k * w, y = GEO.cells.outTop;
      const st = r.dup ? "dup" : r.st === "new" ? "ok" : r.st;
      h += `<rect x="${x}" y="${y}" width="${w - 4}" height="40" rx="5" class="cell cell-${st}"/>`;
      h += `<text x="${x + (w - 4) / 2}" y="${y + 18}" text-anchor="middle" class="cell-k">${r.key}:${r.count}</text>`;
      h += `<text x="${x + (w - 4) / 2}" y="${y + 33}" text-anchor="middle" class="cell-o">${r.dup ? "중복" : r.st === "aborted" ? "abort" : `p${r.part}@${r.o}`}</text>`;
    });
    return h;
  }

  /** shuffle 채널(출력 버퍼 출구 → Count 입구) 위 위치 */
  private chanPt(from: Idx, to: Idx, p: number): [number, number] {
    const [x1, y1] = GEO.chanStart(from, to), [x2, y2] = GEO.chanEnd(from, to);
    return [x1 + (x2 - x1) * p, y1 + (y2 - y1) * p];
  }

  private movingParts(eng: SimEngine) {
    const { S } = eng;
    const G = GEO;
    let h = "";
    const rec = (x: number, y: number, key: string, dim = false) =>
      `<circle cx="${x}" cy="${y}" r="9" fill="var(--rec)"${dim ? ' opacity=".55"' : ""}/><text x="${x}" y="${y + 3.5}" text-anchor="middle" class="t-key">${key}</text>`;
    /** barrier: 레코드와 같은 크기의 노란 동그라미에 checkpoint 번호. 레코드 사이에 끼어 같은 길로 흐른다 */
    const bar = (x: number, y: number, id: number) =>
      `<g><title>barrier · checkpoint ${id}</title><circle cx="${x}" cy="${y}" r="10" fill="var(--barrier-dot)" stroke="var(--barrier)" stroke-width="1.2"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" class="t-bkey">${id}</text></g>`;

    // heartbeat
    IDX.forEach((i) => {
      const slot: Slot = i === 0 ? "A" : "B";
      if (S.tms[slot].st !== "dead") {
        const [x, y] = along(G.heartbeat[i], (S.t * 0.9) % 1);
        h += `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--ok)"/>`;
      } else if (S.phase && S.phase.step <= 2) {
        const left = S.phase.step === 1 ? PHASE_TIME.detect : S.phase.left;
        h += `<text x="${G.tm[i].x + G.tm[i].w / 2}" y="${G.tm[i].y + 18}" text-anchor="middle" class="t-warn">heartbeat 없음 · 타임아웃까지 ${left.toFixed(1)}s</text>`;
      }
    });

    // Source 출력 버퍼: 쌓인 레코드와 그 사이에 끼어든 barrier
    IDX.forEach((i) =>
      IDX.forEach((to) => {
        S.outBuf[i][to].slice(0, G.buf.max).forEach((b, k) => {
          const [x, y] = G.bufSlot(i, to, k);
          h += b.it.k === "bar" ? bar(x, y, b.it.id) : b.it.k === "rec" ? rec(x, y, b.it.key) : "";
        });
        const more = S.outBuf[i][to].length - G.buf.max;
        if (more > 0) {
          const [x, y] = G.bufSlot(i, to, G.buf.max - 0.4);
          h += `<text x="${x}" y="${y + 4}" text-anchor="middle" class="t-small">+${more}</text>`;
        }
      }),
    );
    IDX.forEach((i) => {
      if (S.inject[i] <= 0) return;
      const op = Math.min(1, S.inject[i] * 2), x0 = G.col[i] + 130, y = G.buf.y - 22;
      h += `<text x="${x0}" y="${y}" text-anchor="end" class="t-bar" opacity="${op}">barrier를 두 칸 모두의 맨 뒤에 넣음 ↓</text>`;
    });

    const draw = (it: Item) => {
      if (it.k === "ack") {
        const [x, y] = along(ackPath(it.sub), it.p);
        const w = Math.max(48, it.label.length * 6.6 + 12);
        h += `<rect x="${x - w / 2}" y="${y - 10}" width="${w}" height="20" rx="4" fill="var(--barrier-tint)" stroke="var(--barrier)"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="t-bar">${it.label}</text>`;
        return;
      }
      if (it.at === "fetch") {
        // 테이프가 당겨지는 동안은 칸과 함께 읽는 위치로 오고, 그다음 선을 따라 Source로 내려간다
        const cy = G.cells.inTop + 8 + 20;
        // ▼ 위 칸에서 선을 따라 Source로 내려간다
        const y1 = G.row.source.y + 30;
        h += rec(G.col[it.i], cy + (y1 - cy) * it.p, it.key);
        return;
      }
      if (it.at === "shuffle") {
        const [x, y] = this.chanPt(it.from, it.to, it.p);
        h += it.k === "rec" ? rec(x, y, it.key) : bar(x, y, it.id);
        return;
      }
      const x = G.col[it.j], y0 = G.row.count.y + G.row.count.h, y = y0 + (G.row.sink.y - y0) * it.p;
      h += it.k === "rec" ? rec(x, y, it.key) : bar(x, y, it.id);
    };
    S.items.forEach(draw);

    // 정렬 중 막힌 채널 끝에서 기다리는 레코드
    IDX.forEach((j) =>
      IDX.forEach((i) =>
        S.queue[j][i].forEach((q, k) => {
          if (q.k !== "rec") return;
          const [x, y] = this.chanPt(i, j, 1 - 0.14 * (k + 1));
          h += rec(x, y, q.key, true);
        }),
      ),
    );
    // 막힌 채널 표시
    IDX.forEach((j) => {
      const b = eng.blockedChannel(j);
      if (b == null) return;
      const [x, y] = this.chanPt(b, j, 0.93);
      h += `<rect x="${x - 26}" y="${y - 9}" width="52" height="18" rx="9" fill="var(--fail-tint)" stroke="var(--fail)"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="t-warn" style="font-size:10.5px">차단</text>`;
    });

    for (const f of S.fx) {
      if (f.k === "write") {
        const n = G.cells.out, w = G.cells.outW, x0 = G.col[f.j] - (n * w) / 2;
        const filled = Math.min(n, S.output.filter((r) => r.j === f.j).length);
        const tx = x0 + (filled - 1) * w + (w - 4) / 2;
        const lane = G.cells.outTop - 12;
        const path: [number, number][] = [[G.col[f.j], G.row.sink.y + G.row.sink.h], [G.col[f.j], lane], [tx, lane], [tx, G.cells.outTop + 4]];
        const [x, y] = along(path, f.p);
        h += `<rect x="${x - 22}" y="${y - 10}" width="44" height="20" rx="4" fill="var(--rec)"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="t-key">${f.key}:${f.count}</text>`;
        continue;
      }
      const path = f.k === "trigger" ? G.trigger[f.i] : G.commit[f.j];
      const [x, y] = along(path, f.p);
      const label = f.k === "trigger" ? `chk-${f.id} 시작` : `chk-${f.id} 완료 알림`;
      const w = label.length * 7 + 16;
      h += `<rect x="${x - w / 2}" y="${y - 11}" width="${w}" height="22" rx="11" fill="var(--surface)" stroke="var(--barrier)" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="t-bar">${label}</text>`;
    }

    if (S.job === "FAILED")
      h += `<rect x="160" y="378" width="440" height="44" rx="8" fill="var(--fail-tint)" stroke="var(--fail)"/><text x="380" y="406" text-anchor="middle" class="t-warn" style="font-size:14px">Job FAILED · 처음부터 다시 시작하세요</text>`;
    return h;
  }

  /* ---------- 0.12초마다: 패널 ---------- */

  renderPanels(eng: SimEngine, mode: "live" | "step") {
    const [tone, txt] = narrate(eng);
    const narr = this.$("#narr");
    narr.classList.toggle("bad", tone === "bad");
    narr.classList.toggle("warn", tone === "warn");
    this.$("#narr-t").textContent = txt;
    // TM 박스 클릭 = 장애 주입 (실시간 모드에서만)
    for (const s of ["A", "B"] as Slot[]) {
      const t = this.$(`#tm${s}-tip`);
      if (t) t.textContent = mode === "live" && eng.canKill ? `클릭하면 ${eng.S.tms[s].name} 종료` : "";
    }

    this.renderResults(eng);
    this.renderSteps(eng);
    this.renderLog(eng);
  }

  private renderResults(eng: SimEngine) {
    const { S, settings } = eng;
    const metric = (id: string, v: number, bad = false) => {
      const m = this.$(id);
      m.querySelector("b")!.textContent = String(v);
      m.classList.toggle("bad", bad);
    };
    metric("#m-out", S.committedN);
    metric("#m-dup", S.dup, S.dup > 0);
    metric("#m-lost", S.lost.size, S.lost.size > 0);
    metric("#m-rs", S.restarts);

    // 정답: 담당 Count가 각 파티션에서 처리한 위치까지, 그 key가 몇 번 나왔나
    let bad = false, h = "";
    for (const k of ["A", "B"] as Key[]) {
      const j = route(k);
      let truth = 0;
      for (const i of IDX) for (let o = 0; o < S.countPos[j][i]; o++) if (keyOf(i, o) === k) truth++;
      const cur = S.counts[j][k] ?? 0, miss = truth !== cur;
      bad ||= miss;
      h += `<tr><td>${k}</td><td class="text-muted">Count[${j}]</td><td class="${miss ? "miss" : ""}">${cur}</td><td>${truth}</td></tr>`;
    }
    this.$("#state-body").innerHTML = h;
    const v = this.$("#verdict");
    v.classList.toggle("bad", bad);
    v.textContent = bad ? "state 불일치: 입력을 정확히 한 번씩 센 값과 다릅니다" : "state 정확: 입력을 정확히 한 번씩 센 값과 같습니다";

    this.$("#strat-conf").textContent = STRATS[settings.strat].conf;
    this.$("#strat-desc").textContent = STRATS[settings.strat].desc;
  }

  private renderSteps(eng: SimEngine) {
    const { S, settings } = eng;
    for (const li of this.$$<HTMLLIElement>("#steps li")) {
      const s = Number(li.dataset.s);
      const small = li.querySelector("small")!;
      let state = "", detail = "";
      if (S.job === "FAILED" && S.deadSlot) {
        if (s < 4) state = "done";
        if (s === 4) { state = "failed"; detail = "재시작 거부"; }
      } else if (S.phase) {
        if (s < S.phase.step) state = "done";
        if (s === S.phase.step) {
          state = "active";
          if (s === 2) detail = `${S.phase.left.toFixed(1)}s`;
          if (s === 4) detail = `${S.phase.left.toFixed(1)}s 후`;
          if (s === 6) detail = settings.chk && S.last ? `chk-${S.last.id}` : "checkpoint 없음";
        }
      } else if (S.recovered) state = "done";
      small.textContent = detail;
      for (const c of ["active", "done", "failed"]) li.classList.toggle(c, c === state);
    }
  }

  private renderLog(eng: SimEngine) {
    const { log } = eng.S;
    const tail = log[log.length - 1];
    if (log.length === this.lastLogLen && this.lastLogRef === tail) return;
    const fmt = (t: number) => String(Math.floor(t / 60)).padStart(2, "0") + ":" + (t % 60).toFixed(1).padStart(4, "0");
    const el = this.$("#log");
    el.innerHTML = log
      .map((l) => `<div class="${l.lvl}"><time>${fmt(l.t)}</time> <b>${l.lvl === "CHAOS" ? "KILL" : l.lvl}</b> <i>${l.src}</i> ${l.msg}</div>`)
      .join("");
    el.scrollTop = el.scrollHeight;
    this.lastLogLen = log.length;
    this.lastLogRef = tail;
  }

  /* ---------- 모드와 단계 카드 ---------- */

  syncMode(mode: "live" | "step", run: { idx: number; total: number; step: Step; waiting: boolean; label: string } | null, eng: SimEngine) {
    this.root.dataset.mode = mode;
    this.$$("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    this.$("#narr").hidden = mode === "step";
    this.$("#step-panel").hidden = mode !== "step";
    if (mode !== "step" || !run) return;
    this.$("#step-scn").textContent = run.label;
    this.$("#step-idx").textContent = `${run.idx + 1} / ${run.total}`;
    this.$("#step-title").textContent = run.step.title;
    this.$("#step-desc").textContent = run.waiting ? run.step.desc(eng) : "진행 중…";
    this.$("#step-panel").dataset.waiting = String(run.waiting);
    const next = this.$<HTMLButtonElement>("#step-next");
    const last = run.idx >= run.total - 1;
    next.disabled = !run.waiting || last;
    next.textContent = last ? "끝" : "다음";
    this.$("#step-dots").innerHTML = Array.from({ length: run.total }, (_, k) => `<i class="h-1 flex-1 rounded-sm ${k < run.idx || (k === run.idx && run.waiting) ? "bg-rec" : k === run.idx ? "bg-barrier" : "bg-line"}"></i>`).join("");
  }

  /* ---------- 컨트롤 버튼 상태 ---------- */

  syncControls(eng: SimEngine, speed: number, paused: boolean) {
    const { settings } = eng;
    this.$("#chk-on").setAttribute("aria-pressed", String(settings.chk));
    this.$("#chk-off").setAttribute("aria-pressed", String(!settings.chk));
    const gEo = this.$<HTMLButtonElement>("#g-eo");
    gEo.setAttribute("aria-pressed", String(eng.eo));
    gEo.disabled = !settings.chk;
    gEo.title = settings.chk ? "" : "exactly-once Sink는 checkpoint가 있어야 동작합니다";
    this.$("#g-al").setAttribute("aria-pressed", String(!eng.eo));
    this.$$("[data-strat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.strat === settings.strat)));
    this.$("#speed-label").textContent = `${speed}×`;
    this.$$<HTMLButtonElement>("[data-speed-step]").forEach((b) => {
      b.disabled = Number(b.dataset.speedStep) < 0 ? speed <= 0.25 : speed >= 2;
    });
    const pause = this.$("#pause");
    pause.dataset.paused = String(paused);
    pause.setAttribute("aria-label", paused ? "재생" : "일시정지");
    pause.title = paused ? "재생 (P)" : "일시정지 (P)";
  }
}
