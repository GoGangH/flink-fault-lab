"use client";

import { useEffect, useRef } from "react";
import { mountSimulator } from "@/lib/simulator/mount";
import { note } from "@/lib/ui";
import SimToolbar from "./SimToolbar";
import Narration from "./Narration";
import StepPanel from "./StepPanel";
import ClusterStage from "./ClusterStage";
import SimLegend from "./SimLegend";
import RecoverySteps from "./RecoverySteps";
import ResultPanel from "./ResultPanel";
import JobManagerLog from "./JobManagerLog";

/**
 * 장애 주입 시뮬레이터. 본문 폭을 벗어나 화면 폭에 가깝게 넓게 그린다.
 *   [도구 막대: 시나리오 · 단계별/실시간 · 재생 · 설정]
 *   [단계 카드 (단계별) 또는 상황 줄 (실시간)]
 *   [그림 (전체 폭)]
 *   [복구 6단계]
 *   [결과 검증 | JobManager 로그]
 */
export default function Simulator() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? mountSimulator(ref.current) : undefined), []);

  return (
    <div ref={ref} className="relative left-1/2 w-[min(1600px,calc(100vw-48px))] -translate-x-1/2">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <SimToolbar />
        <StepPanel />
        <Narration />
        <ClusterStage />
        <SimLegend />
        <RecoverySteps />
        <div className="grid divide-line border-t border-line max-lg:divide-y lg:grid-cols-[1fr_1.2fr] lg:divide-x">
          <ResultPanel />
          <JobManagerLog />
        </div>
      </div>
      <p className={note}>
        시간은 시연용으로 압축했습니다. checkpoint 간격 6초, heartbeat 타임아웃 1.8초. 실제 기본값은 checkpoint 꺼짐,{" "}
        <code className="font-mono">heartbeat.timeout</code> 50초입니다.
      </p>
    </div>
  );
}
