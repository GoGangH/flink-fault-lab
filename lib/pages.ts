export type Part = "시작" | "사전 지식" | "질문 1 · 복구 과정" | "질문 2 · 복원 기준" | "질문 3 · 유실과 중복" | "마무리";

export type PageInfo = {
  id: string;
  /** 상단 메뉴·목차에 쓰는 짧은 이름 */
  label: string;
  /** 목차에 쓰는 한 줄 설명 */
  desc: string;
  part: Part;
};

/** 덱 페이지 순서. id는 각 섹션의 id, URL hash와 같다. */
export const PAGES: PageInfo[] = [
  { id: "top", label: "표지", desc: "TaskManager 하나가 죽었다", part: "시작" },
  { id: "agenda", label: "목차", desc: "발표 순서", part: "시작" },
  { id: "stream", label: "스트림과 State", desc: "연산자, 병렬 Task, Keyed State", part: "사전 지식" },
  { id: "kafka", label: "Kafka 기초", desc: "offset 되감기와 트랜잭션", part: "사전 지식" },
  { id: "arch", label: "클러스터 구조", desc: "JobManager와 TaskManager의 역할", part: "사전 지식" },
  { id: "job", label: "예제 Job", desc: "시뮬레이터가 돌리는 파이프라인과 시나리오", part: "사전 지식" },
  { id: "region", label: "keyBy와 region", desc: "TM 하나가 죽었는데 왜 전체가 재시작되나", part: "사전 지식" },
  { id: "sim", label: "장애 시뮬레이션", desc: "직접 TM을 죽이며 복구 6단계 확인", part: "질문 1 · 복구 과정" },
  { id: "checkpoint", label: "Checkpoint", desc: "barrier 정렬과 스냅샷", part: "질문 2 · 복원 기준" },
  { id: "restart", label: "Restart Strategy", desc: "재시작 전략 4가지 비교", part: "질문 2 · 복원 기준" },
  { id: "exactly", label: "보장 수준", desc: "at-least-once와 exactly-once의 차이", part: "질문 3 · 유실과 중복" },
  { id: "twopc", label: "Two-Phase Commit", desc: "트랜잭션 Sink와 자주 겪는 함정", part: "질문 3 · 유실과 중복" },
  { id: "wrap", label: "정리", desc: "세 질문의 답과 핵심 설정", part: "마무리" },
  { id: "qa", label: "Q&A", desc: "예상 질문 8개", part: "마무리" },
];

export const PARTS = [...new Set(PAGES.map((p) => p.part))];

/** 목차에서 각 페이지의 번호(01, 02 …) */
export const pageNo = (id: string) => String(PAGES.findIndex((p) => p.id === id) + 1).padStart(2, "0");
