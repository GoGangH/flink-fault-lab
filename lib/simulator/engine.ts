import { IDX, KEYS_OF, PHASE_TIME, SUBS, SUB_NAME, TIMING, idxOf, keyOf, route } from "./constants";
import type { Counts, Idx, Item, Key, Level, OutRec, Settings, SimEvent, SimState, Slot, SubId } from "./types";

const other = (i: Idx): Idx => (i === 0 ? 1 : 0);
const empty = (j: Idx): Counts => Object.fromEntries(KEYS_OF[j].map((k) => [k, 0]));
const subsOn = (i: Idx): SubId[] => [`source${i}`, `count${i}`, `sink${i}`];

function travel(it: Item) {
  if (it.k === "ack") return TIMING.ack[Number(it.sub.slice(-1))];
  if (it.at === "fetch") return TIMING.fetch;
  if (it.at === "fwd") return TIMING.fwd;
  return it.from === it.to ? TIMING.shuffle.same : TIMING.shuffle.cross;
}

/**
 * Flink 장애 복구 시뮬레이션 모델 (병렬도 2). DOM을 모르고 상태만 다룬다.
 * 입력 파티션 2개 → Source[i] → keyBy → Count[j] → Sink[j] → 출력 파티션 j
 */
export class SimEngine {
  settings: Settings = { chk: true, guarantee: "eo", strat: "fixed" };
  /** 참이면 주기적 checkpoint를 걸지 않는다 (단계별 모드에서 대본이 직접 건다) */
  manualChk = false;
  S!: SimState;

  constructor() {
    this.reset();
  }

  /** exactly-once Sink는 checkpoint가 켜져 있을 때만 동작한다 */
  get eo() {
    return this.settings.guarantee === "eo" && this.settings.chk;
  }
  get canKill() {
    return this.S.job === "RUNNING" && !this.S.phase;
  }
  /** Count[j]가 barrier 정렬을 기다리는 중이면 막힌 채널 번호 */
  blockedChannel(j: Idx): Idx | null {
    const a = this.S.align[j];
    if (a.id == null) return null;
    return a.got[0] && !a.got[1] ? 0 : a.got[1] && !a.got[0] ? 1 : null;
  }

  log(lvl: Level, src: string, msg: string) {
    this.S.log.push({ t: this.S.t, lvl, src, msg });
    if (this.S.log.length > 140) this.S.log.shift();
  }

  reset() {
    const all = <T,>(v: () => T) => Object.fromEntries(SUBS.map((s) => [s, v()])) as Record<SubId, T>;
    this.S = {
      t: 0, logEnd: [0, 0], pos: [0, 0], counts: [empty(0), empty(1)], countPos: [[0, 0], [0, 0]],
      items: [], fx: [], outBuf: [[[], []], [[], []]], sendAcc: [[0, 0], [0, 0]], queue: [[[], []], [[], []]], align: [{ id: null, got: [false, false] }, { id: null, got: [false, false] }],
      output: [], committed: new Set(), lost: new Set(), dup: 0, committedN: 0,
      nextChk: 1, inProg: null, last: null, failedChk: null, sinkTxn: [1, 1],
      // 첫 checkpoint는 3초 뒤. 파티션 1은 반 박자 늦게 쌓여 두 Source의 흐름이 엇갈린다
      acc: { prod: [0, -TIMING.produce / 2], read: [TIMING.read, TIMING.read], chk: TIMING.chk - 3 },
      tms: { A: { name: "tm-1", st: "alive" }, B: { name: "tm-2", st: "alive" } }, tmSeq: 2,
      task: all(() => "RUNNING"), flash: all(() => 0), inject: [0, 0],
      job: "RUNNING", phase: null, recovered: false, restarts: 0, failTimes: [], expStep: 0, lastFail: -1e9,
      deadSlot: null, log: [], auto: null, ev: [], evSeq: 0,
    };
    this.log("INFO", "JobMaster", "Job wordcount (3f2a9c1e) switched from state CREATED to RUNNING. parallelism 2");
    if (this.settings.chk) this.log("INFO", "CheckpointCoordinator", "Checkpointing enabled: interval 6 s, mode EXACTLY_ONCE (aligned)");
    else this.log("WARN", "JobMaster", "Checkpointing is disabled. State will not be recoverable.");
  }

  emit(type: SimEvent, i?: number) {
    const S = this.S;
    S.ev.push({ seq: ++S.evSeq, type, i });
    if (S.ev.length > 400) S.ev.shift();
  }
  /** seq 이후에 type 이벤트가 몇 번 났나 (i를 주면 그 번호만) */
  seen(since: number, type: SimEvent, i?: number) {
    return this.S.ev.filter((e) => e.seq > since && e.type === type && (i == null || e.i === i)).length;
  }

  setStrategy(strat: Settings["strat"]) {
    this.settings.strat = strat;
    Object.assign(this.S, { restarts: 0, failTimes: [], expStep: 0 });
    this.log("INFO", "JobMaster", `Restart strategy changed to ${strat}`);
  }

  /* ---------- checkpoint ---------- */

  /** 지금 바로 checkpoint 시작 (단계별 모드) */
  triggerNow() {
    if (this.settings.chk && !this.S.inProg && !this.S.phase && this.S.job === "RUNNING") this.trigger();
  }

  /** CheckpointCoordinator가 두 Source에 checkpoint 시작을 요청한다 */
  private trigger() {
    const S = this.S;
    const id = S.nextChk++;
    S.inProg = { id, offsets: [null, null], counts: [null, null], acks: 0, done: [] };
    for (const i of IDX) S.fx.push({ k: "trigger", i, p: 0, id });
    this.emit("trigger", id);
    this.log("INFO", "CheckpointCoordinator", `Triggering checkpoint ${id} (type=CHECKPOINT) for job 3f2a9c1e`);
  }

  /** Source[i]: 요청을 받으면 다음에 내보낼 offset을 저장하고, 두 출력 채널에 barrier를 끼워 넣는다 */
  private injectBarrier(i: Idx, id: number) {
    const S = this.S;
    if (!S.inProg || S.inProg.id !== id) return;
    // 아직 파티션에서 내려오는 중인 레코드는 barrier 뒤에 들어가므로 그 첫 offset이 저장 지점이다
    const pending = S.items.flatMap((it) => (it.k === "rec" && it.at === "fetch" && it.i === i ? [it.o] : []));
    const offset = pending.length ? Math.min(...pending) : S.pos[i];
    S.inProg.offsets[i] = offset;
    // barrier는 두 출력 버퍼의 맨 뒤, 이미 쌓인 레코드 뒤에 끼어 들어간다
    for (const to of IDX) S.outBuf[i][to].push({ it: { k: "bar", at: "shuffle", from: i, to, p: 0, id }, age: 0 });
    S.inject[i] = 0.6;
    this.emit("inject", i);
    S.flash[`source${i}`] = 0.5;
    this.ack(`source${i}`, id, `offset ${offset}`);
  }

  private ack(sub: SubId, id: number, label: string) {
    this.S.items.push({ k: "ack", sub, p: 0, id, label });
  }

  private complete() {
    const S = this.S;
    const c = S.inProg!;
    S.last = { id: c.id, offsets: c.offsets as [number, number], counts: c.counts as [Counts, Counts] };
    this.log("INFO", "CheckpointCoordinator", `Completed checkpoint ${c.id} for job 3f2a9c1e (6/6 subtasks acknowledged)`);
    // 완료 알림은 Sink에 항상 간다. exactly-once Sink는 받으면 트랜잭션을 commit하고, at-least-once Sink는 할 일이 없다
    for (const j of IDX) S.fx.push({ k: "commit", j, p: 0, id: c.id });
    S.inProg = null;
    this.emit("complete", c.id);
  }

  private commitTxn(j: Idx, id: number, recovered = false) {
    let n = 0;
    for (const r of this.S.output) if (r.j === j && r.st === "pre" && r.txn <= id) { this.commit(r); n++; }
    this.log("INFO", "KafkaCommitter", `${recovered ? "Committing recovered" : "Committing"} transaction wordcount-sink-${j}-${id} (${n} records)`);
    if (!recovered) this.emit("commit", j);
  }

  private commit(r: OutRec) {
    const S = this.S;
    const key = `${r.part}:${r.o}`;
    r.st = "ok";
    if (S.committed.has(key)) { r.dup = true; S.dup++; }
    S.committed.add(key);
    S.committedN++;
  }

  private sinkWrite(j: Idx, part: Idx, o: number, key: Key, count: number) {
    const S = this.S;
    const r: OutRec = { j, part, o, key, count, st: "pending", txn: S.sinkTxn[j], dup: false };
    if (!this.eo) { this.commit(r); r.st = "new"; }
    S.output.push(r);
    if (S.output.length > 500) S.output.shift();
    S.fx.push({ k: "write", j, p: 0, key, count });
    this.emit("write", j);
  }

  /* ---------- 도착 처리 ---------- */

  private countRecord(j: Idx, from: Idx, o: number, key: Key) {
    const S = this.S;
    S.counts[j][key] = (S.counts[j][key] ?? 0) + 1;
    S.countPos[j][from] = o + 1;
    S.items.push({ k: "rec", at: "fwd", j, p: 0, o, part: from, key, count: S.counts[j][key]! });
  }

  private arrive(it: Item) {
    const S = this.S;
    if (it.k === "ack") {
      if (S.inProg && S.inProg.id === it.id && !S.inProg.done.includes(it.sub)) {
        S.inProg.done.push(it.sub);
        if (++S.inProg.acks === 6) this.complete();
      }
      return;
    }
    if (it.at === "fetch") {
      const to = route(it.key);
      S.outBuf[it.i][to].push({ it: { k: "rec", at: "shuffle", from: it.i, to, p: 0, o: it.o, key: it.key }, age: 0 });
      return;
    }
    if (it.at === "shuffle") {
      const j = it.to, from = it.from;
      if (it.k === "rec") {
        // 정렬 중 이미 barrier가 온 채널의 레코드는 처리하지 않고 기다린다
        if (S.align[j].id != null && S.align[j].got[from]) S.queue[j][from].push(it);
        else this.countRecord(j, from, it.o, it.key);
        return;
      }
      const a = S.align[j];
      if (a.id !== it.id) { a.id = it.id; a.got = [false, false]; }
      a.got[from] = true;
      if (!a.got[other(from)]) {
        this.log("INFO", `KeyedCount[${j}]`, `Received barrier ${it.id} from Source[${from}]. 채널 ${from} 차단, Source[${other(from)}]의 barrier 대기`);
        this.emit("align-wait", j);
        return;
      }
      // 두 채널 모두 도착 → 이 순간의 state를 스냅샷하고 barrier를 내려보낸 뒤 막아 둔 레코드를 처리
      if (S.inProg && S.inProg.id === it.id) S.inProg.counts[j] = { ...S.counts[j] };
      S.flash[`count${j}`] = 0.5;
      const c = S.counts[j];
      this.ack(`count${j}`, it.id, KEYS_OF[j].map((k) => `${k} ${c[k] ?? 0}`).join(" · "));
      S.items.push({ k: "bar", at: "fwd", j, p: 0, id: it.id });
      this.emit("align-done", j);
      a.id = null;
      a.got = [false, false];
      for (const i of IDX) {
        const q = S.queue[j][i];
        S.queue[j][i] = [];
        for (const r of q) if (r.k === "rec") this.countRecord(j, i, r.o, r.key);
      }
      return;
    }
    // fwd: Count[j] → Sink[j]
    const j = it.j;
    if (it.k === "rec") { this.sinkWrite(j, it.part, it.o, it.key, it.count); return; }
    if (this.eo) for (const r of S.output) if (r.j === j && r.st === "pending" && r.txn === it.id) r.st = "pre";
    S.sinkTxn[j] = it.id + 1;
    S.flash[`sink${j}`] = 0.5;
    this.ack(`sink${j}`, it.id, this.eo ? `txn ${it.id}` : "없음");
  }

  /* ---------- 장애와 복구 ---------- */

  kill(slot: Slot) {
    if (!this.canKill) return;
    const S = this.S;
    const i = idxOf(slot);
    const tm = S.tms[slot];
    tm.st = "dead";
    S.deadSlot = slot;
    subsOn(i).forEach((s) => (S.task[s] = "FAILED"));
    const waiting = IDX.filter((j) => this.blockedChannel(j) != null);
    const lostInFlight = S.items.filter((x) => x.k === "rec").length + S.queue.flat(2).length + S.outBuf.flat(2).filter((b) => b.it.k === "rec").length;
    S.items = [];
    S.outBuf = [[[], []], [[], []]];
    S.fx = [];
    S.queue = [[[], []], [[], []]];
    this.log("CHAOS", "chaos", `kill -9 ${tm.name} → 전송 중이던 레코드 ${lostInFlight}개 소실${waiting.length ? ` (KeyedCount[${waiting.join(",")}]가 barrier 정렬 대기 중이었음)` : ""}`);
    S.phase = { step: 1, left: PHASE_TIME.fail, total: PHASE_TIME.fail };
    S.recovered = false;
    this.emit("kill", i);
  }

  /** Restart Strategy 판단. 재시작 대기 시간(초) 또는 포기(null) */
  private decide(): number | null {
    const S = this.S;
    const s = this.settings.strat, now = S.t;
    S.failTimes.push(now);
    if (s === "none") return null;
    if (s === "fixed") return S.restarts >= 3 ? null : 2;
    if (s === "exponential") {
      if (now - S.lastFail > 30) S.expStep = 0;
      S.lastFail = now;
      return Math.min(8, Math.pow(2, S.expStep++));
    }
    return S.failTimes.filter((t) => now - t < 30).length >= 3 ? null : 1.5;
  }

  private restore() {
    const S = this.S;
    if (this.eo) {
      // 완료된 checkpoint의 트랜잭션은 commit 알림을 못 받았어도 복구 때 commit한다
      for (const j of IDX) if (S.last && S.output.some((r) => r.j === j && r.st === "pre" && r.txn <= S.last!.id)) this.commitTxn(j, S.last.id, true);
      let n = 0;
      for (const r of S.output) if (r.st === "pending" || r.st === "pre") { r.st = "aborted"; n++; }
      this.log("INFO", "KafkaWriter", `Aborting lingering transactions wordcount-sink-*-* (${n} uncommitted records discarded)`);
    }
    S.align = [{ id: null, got: [false, false] }, { id: null, got: [false, false] }];
    const snap = this.settings.chk ? S.last : null;
    if (snap) {
      S.pos = [...snap.offsets];
      S.counts = [{ ...snap.counts[0] }, { ...snap.counts[1] }];
      S.countPos = [[...snap.offsets], [...snap.offsets]];
      this.log("INFO", "CheckpointCoordinator", `Restoring job 3f2a9c1e from Checkpoint ${snap.id}`);
      for (const i of IDX) this.log("INFO", `KafkaSourceReader[${i}]`, `Seeking partition orders-${i} to offset ${snap.offsets[i]}`);
    } else {
      let n = 0;
      for (const i of IDX) for (let o = 0; o < S.logEnd[i]; o++) {
        const k = `${i}:${o}`;
        if (!S.committed.has(k) && !S.lost.has(k)) { S.lost.add(k); n++; }
      }
      S.pos = [...S.logEnd];
      S.counts = [empty(0), empty(1)];
      S.countPos = [[...S.logEnd], [...S.logEnd]];
      this.log("WARN", "CheckpointCoordinator", "No checkpoint found. Restoring from empty state.");
      this.log("WARN", "KafkaSourceReader", `No restored offset. Starting from latest offsets (${n} records skipped)`);
    }
    S.sinkTxn = [S.nextChk, S.nextChk];
  }

  private advancePhase(dt: number) {
    const S = this.S;
    const ph = S.phase!;
    ph.left -= dt;
    if (ph.left > 0) return;
    const slot = S.deadSlot!;
    const dead = S.tms[slot];
    switch (ph.step) {
      case 1:
        S.phase = { step: 2, left: PHASE_TIME.detect, total: PHASE_TIME.detect };
        break;
      case 2:
        this.log("WARN", "JobMaster", `Heartbeat of TaskManager with id ${dead.name} timed out.`);
        subsOn(idxOf(slot)).forEach((s) => this.log("INFO", "ExecutionGraph", `${SUB_NAME(s)} switched from RUNNING to FAILED on ${dead.name}`));
        this.log("INFO", "RestartPipelinedRegionFailoverStrategy", "Calculating tasks to restart to recover the failed task. 6 tasks will be restarted (1 region).");
        SUBS.forEach((s) => { if (S.task[s] === "RUNNING") S.task[s] = "CANCELING"; });
        if (S.inProg) {
          this.log("WARN", "CheckpointCoordinator", `Checkpoint ${S.inProg.id} of job 3f2a9c1e failed: task failure (${S.inProg.acks}/6 acknowledged). 폐기`);
          S.failedChk = { id: S.inProg.id, until: S.t + 6 };
          S.inProg = null;
        }
        S.phase = { step: 3, left: PHASE_TIME.failover, total: PHASE_TIME.failover };
        this.emit("detect");
        break;
      case 3: {
        SUBS.forEach((s) => { if (S.task[s] === "CANCELING") S.task[s] = "CANCELED"; });
        const d = this.decide();
        if (d == null) {
          this.log("ERROR", "JobMaster", `Recovery is suppressed by ${this.settings.strat} restart strategy (restarts so far: ${S.restarts})`);
          this.log("ERROR", "ExecutionGraph", "Job wordcount (3f2a9c1e) switched from state RUNNING to FAILING → FAILED.");
          S.job = "FAILED";
          S.phase = null;
          S.auto = null;
          this.emit("job-failed");
          return;
        }
        this.log("INFO", "JobMaster", `Restart strategy ${this.settings.strat}: restarting in ${d} s (재시작 ${S.restarts + 1}회째)`);
        S.phase = { step: 4, left: d, total: d, delay: d };
        this.emit("decide");
        break;
      }
      case 4:
        S.restarts++;
        S.tmSeq++;
        S.tms[slot] = { name: "tm-" + S.tmSeq, st: "new" };
        this.log("INFO", "ResourceManager", `Requesting new worker. Registering TaskManager tm-${S.tmSeq}`);
        SUBS.forEach((s) => (S.task[s] = "DEPLOYING"));
        S.phase = { step: 5, left: PHASE_TIME.slots, total: PHASE_TIME.slots };
        this.emit("deploy");
        break;
      case 5:
        SUBS.forEach((s) => (S.task[s] = "INITIALIZING"));
        this.restore();
        S.phase = { step: 6, left: PHASE_TIME.restore, total: PHASE_TIME.restore };
        this.emit("restore");
        break;
      case 6:
        SUBS.forEach((s) => (S.task[s] = "RUNNING"));
        S.tms[slot].st = "alive";
        this.log("INFO", "ExecutionGraph", "All 6 tasks switched from INITIALIZING to RUNNING. Job wordcount 처리 재개.");
        S.phase = null;
        S.recovered = true;
        S.acc.chk = TIMING.chk - 3;
        S.acc.read = [TIMING.read, TIMING.read];
        this.emit("running");
        break;
    }
  }

  /* ---------- 시간 진행 ---------- */

  step(dt: number) {
    const S = this.S;
    S.t += dt;
    for (const s of SUBS) if (S.flash[s] > 0) S.flash[s] -= dt;
    for (const i of IDX) if (S.inject[i] > 0) S.inject[i] -= dt;
    if (S.failedChk && S.t > S.failedChk.until) S.failedChk = null;

    // 프로듀서는 Job 상태와 무관하게 두 파티션에 계속 쓴다
    for (const i of IDX) {
      S.acc.prod[i] += dt;
      while (S.acc.prod[i] >= TIMING.produce) { S.acc.prod[i] -= TIMING.produce; S.logEnd[i]++; }
    }

    if (S.phase) this.advancePhase(dt);

    if (!S.phase && S.job === "RUNNING") {
      for (const i of IDX) {
        const lag = S.logEnd[i] - S.pos[i];
        const every = lag > 1 ? TIMING.catchup : TIMING.read;
        S.acc.read[i] = Math.min(S.acc.read[i] + dt, every);
        if (lag > 0 && S.acc.read[i] >= every) {
          S.acc.read[i] = 0;
          S.items.push({ k: "rec", at: "fetch", i, p: 0, o: S.pos[i], key: keyOf(i, S.pos[i]) });
          S.pos[i]++;
        }
      }
      if (this.settings.chk && !this.manualChk) {
        // 간격은 이전 checkpoint가 끝난 뒤부터 센다 (진행 중에는 멈춤, Flink의 min-pause와 같은 효과)
        if (!S.inProg) S.acc.chk += dt;
        if (!S.inProg && S.acc.chk >= TIMING.chk) { S.acc.chk = 0; this.trigger(); }
      }
      if (S.auto && S.auto.kills > 0) {
        S.auto.wait -= dt;
        const ready = S.auto.wait <= 0 && (!S.auto.align || IDX.some((j) => this.blockedChannel(j) != null));
        if (ready) { S.auto.kills--; S.auto.wait = S.auto.between; this.kill(S.auto.slot); }
      }
    }

    for (const f of S.fx) f.p += dt / (TIMING.fx[f.k] * (f.k === "trigger" ? TIMING.triggerScale[f.i] : f.k === "commit" ? TIMING.triggerScale[f.j] : 1));
    const fxDone = S.fx.filter((f) => f.p >= 1);
    if (fxDone.length) {
      S.fx = S.fx.filter((f) => f.p < 1);
      for (const f of fxDone) {
        if (f.k === "trigger") this.injectBarrier(f.i, f.id);
        if (f.k === "commit") {
          if (this.eo) this.commitTxn(f.j, f.id);
          else {
            this.log("INFO", `Sink[${f.j}]`, `notifyCheckpointComplete(${f.id}) 수신. at-least-once라 commit할 트랜잭션 없음 (출력은 이미 공개됨)`);
            S.flash[`sink${f.j}`] = 0.5;
            this.emit("commit", f.j);
          }
        }
      }
    }

    // 출력 버퍼: 맨 앞 항목이 충분히 머물렀고 직전 전송과 간격이 벌어졌으면 네트워크로 내보낸다
    for (const i of IDX) for (const to of IDX) {
      const q = S.outBuf[i][to];
      for (const b of q) b.age += dt;
      S.sendAcc[i][to] += dt;
      if (q.length && q[0].age >= TIMING.bufDwell && S.sendAcc[i][to] >= TIMING.bufGap) {
        S.items.push(q.shift()!.it);
        S.sendAcc[i][to] = 0;
      }
    }

    for (const it of S.items) it.p += dt / travel(it);
    const arrived = S.items.filter((i) => i.p >= 1);
    if (arrived.length) {
      S.items = S.items.filter((i) => i.p < 1);
      arrived.forEach((it) => this.arrive(it));
    }
  }
}
