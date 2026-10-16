/**
 * 페이지별 스포트라이트 가이드 대본.
 * target은 현재 페이지 안의 [data-tour="..."] 요소. "@"로 시작하면 페이지 밖(상단 메뉴, 페이저)에서 찾는다.
 */
export type TourStep = { target: string; title: string; body: string };

export const TOURS: Record<string, TourStep[]> = {
  top: [
    { target: "hero-title", title: "오늘의 주제", body: "TaskManager 하나가 죽는 상황 하나로 발표 전체를 끌고 갑니다. Job은 어떻게 살아나고, 데이터는 괜찮은지 따라가 봅니다." },
    { target: "hero-flow", title: "이 색을 기억해 주세요", body: "파란 점은 레코드, 노란 점은 checkpoint barrier(레코드 사이에 끼어 흐름), 빨간 구간은 TaskManager가 죽은 지점입니다. 이후 모든 페이지에서 같은 색을 씁니다." },
    { target: "hero-questions", title: "세 가지 질문", body: "발표는 이 세 질문 순서로 진행합니다. 질문을 누르면 해당 페이지로 바로 갑니다." },
    { target: "@guide", title: "가이드", body: "페이지마다 이런 가이드가 있습니다. 이 버튼이나 G 키로 언제든 다시 볼 수 있습니다." },
    { target: "@toc", title: "목차와 페이지 이동", body: "목차를 열어 원하는 페이지로 바로 갈 수 있습니다(T 키). 페이지는 ← → 키로 넘기고, 메뉴 아래 파란 막대가 진행 상태입니다." },
  ],
  agenda: [
    { target: "agenda-list", title: "발표 순서", body: "사전 지식 세 페이지로 기초를 맞춘 뒤, 세 질문에 차례로 답합니다. 항목을 누르면 그 페이지로 바로 이동합니다." },
  ],
  stream: [
    { target: "stream-points", title: "스트림 처리 세 줄 요약", body: "끝이 없는 데이터를 병렬 Task가 나눠 처리하고, 각 Task는 자기 몫의 state를 들고 있습니다." },
    { target: "stream-demo", title: "직접 해 보기", body: "A, B, C를 몇 번 보내 보세요. 같은 key는 항상 같은 Task로 갑니다. 그다음 Task 1 장애를 누르면 A, C의 개수가 사라집니다. 이걸 막는 장치가 checkpoint입니다." },
    { target: "stream-glossary", title: "용어 정리", body: "뒤 페이지에서 계속 나오는 용어입니다. 헷갈리면 이 페이지로 돌아오세요." },
  ],
  kafka: [
    { target: "kafka-offset", title: "되감을 수 있는 Source", body: "읽기를 몇 번 누르고 offset을 저장한 뒤, 더 읽다가 되감아 보세요. 노랗게 표시된 레코드가 장애 뒤 다시 처리되는 구간입니다." },
    { target: "kafka-txn", title: "트랜잭션", body: "트랜잭션에 몇 개 쓰고 abort해 보세요. read_committed consumer에게는 아무것도 보이지 않습니다. 질문 3에서 exactly-once Sink가 바로 이 원리를 씁니다." },
  ],
  arch: [
    { target: "arch-jm", title: "지휘하는 쪽: JobManager", body: "장애를 감지하고 복구를 지휘합니다. 특히 JobMaster(장애 처리)와 CheckpointCoordinator(스냅샷 조율)를 기억해 두세요." },
    { target: "arch-tm", title: "죽는 쪽: TaskManager", body: "실제 연산이 도는 JVM 프로세스입니다. 시뮬레이터는 병렬도 2라서 TM마다 Source·Count·Sink가 한 벌씩 있습니다." },
    { target: "arch-causes", title: "TM은 왜 죽나", body: "OOM이나 노드 장애처럼 프로세스가 사라지는 경우가 대표적입니다. 어떤 원인이든 Flink의 복구 절차는 같습니다." },
  ],
  job: [
    { target: "job-flow", title: "예제 Job", body: "orders 토픽에서 단어를 읽어 key별로 세고, 결과를 word-counts 토픽에 씁니다. KeyedCount 안의 개수가 state입니다." },
    { target: "job-scenarios", title: "시나리오 4개", body: "시뮬레이터에서 이 순서로 장애를 냅니다. 설정을 하나씩 바꿔 가며 유실, 중복, 정확한 복구, Job 실패를 차례로 봅니다." },
    { target: "job-symbols", title: "화면 기호", body: "시뮬레이터와 애니메이션에서 쓰는 기호입니다. 특히 노란 마름모는 Task가 저장소로 올리는 스냅샷 조각입니다." },
  ],
  region: [
    { target: "region-keyby", title: "keyBy가 하는 일", body: "같은 key를 항상 같은 subtask로 보냅니다. key별 state가 한 곳에 모여야 정확히 셀 수 있기 때문이고, 그 결과 모든 Source가 모든 Count와 이어집니다." },
    { target: "region-compare", title: "어디까지 재시작되나", body: "tm-1 종료를 누르면 재시작하는 Task가 보라로 바뀝니다. keyBy가 있는 Job은 이어진 6개가 한 region이라 전부 재시작하고, forward만 있는 Job은 죽은 줄만 재시작합니다." },
    { target: "region-why", title: "왜 같이 되돌리나", body: "한쪽이 되감으면 그 데이터를 받은 쪽도 같은 지점으로 돌아가야 해서, 연결을 따라 전부 번집니다. 다음 시뮬레이터가 바로 이 keyBy Job입니다." },
  ],
  sim: [
    { target: "sim-narr", title: "상황 줄", body: "지금 화면에서 무슨 일이 일어나는지 한 문장으로 알려 줍니다. 발표 중에 이 줄을 읽어 주면 흐름이 따라옵니다." },
    { target: "sim-producer", title: "1. Producer가 데이터를 씁니다", body: "Flink 밖의 주문 서비스가 orders 토픽에 단어를 계속 씁니다. 새 레코드는 파티션 오른쪽 끝에 초록 테두리로 들어오고, 최신 offset이 하나씩 늘어납니다." },
    { target: "sim-in", title: "2. Source가 읽어 갑니다", body: "파티션마다 Source가 하나씩 붙어 있습니다. 파란 ▼가 읽는 위치이고, 읽을 때마다 테이프가 한 칸 당겨지며 레코드가 선을 따라 내려갑니다. 왼쪽 회색은 이미 읽은 칸, 노란 세로선은 마지막 checkpoint가 저장한 위치입니다." },
    { target: "sim-tasks", title: "3. subtask와 각자의 state", body: "병렬도 2라서 TM마다 Source·Count·Sink가 한 벌씩 있습니다. keyBy로 A는 Count[0], B는 Count[1]로 가서 채널이 X자로 교차합니다. subtask마다 state가 따로 있고, 평소에는 각 TM 메모리(state backend)에 있습니다. Source는 읽은 offset, Count는 key별 개수, Sink는 열린 트랜잭션이 state입니다." },
    { target: "sim-jm", title: "4. JobManager가 checkpoint 요청", body: "가운데 JobManager가 좌우 두 Source에 '시작' 요청을 내려보냅니다. 요청을 받은 Source는 offset을 저장하고, barrier를 Kafka가 아니라 자기 출력 버퍼에 넣습니다. 출력 버퍼는 하나지만 받는 Count마다 칸이 나뉘어 있고, 레코드는 key에 맞는 칸 하나에, barrier는 모든 칸의 맨 뒤에 들어갑니다. 앞의 레코드가 다 나간 뒤에 barrier가 네트워크로 나갑니다." },
    { target: "sim-tasks", title: "5. barrier 정렬", body: "Count는 입력 채널이 두 개입니다. 한쪽 barrier가 먼저 오면 그 채널을 '차단'하고, 거기로 온 레코드는 줄 세워 둡니다. 다른 쪽 barrier까지 와야 state를 저장하고 막은 레코드를 처리합니다." },
    { target: "sim-store", title: "6. Checkpoint 저장소", body: "저장소는 하나입니다. checkpoint마다 chk-N 폴더가 생기고, barrier를 처리한 subtask가 TM 메모리의 state를 그 순간 그대로 복사해 자기 파일로 올립니다. 데이터(레코드) 자체는 올리지 않고, offset과 계산 결과만 올립니다. 6개가 다 모이면 JobManager가 _metadata를 써서 완료를 확정하고, 그 전에 장애가 나면 그 checkpoint는 무효입니다. 실제로는 Count와 Sink가 operator chaining으로 한 Task가 되어 4개를 기다리지만, 역할을 보이려고 나눠 그렸습니다." },
    { target: "sim-out", title: "7. Kafka 출력 토픽", body: "Sink가 결과(단어:개수)를 씁니다. exactly-once에서는 보라 점선(미커밋)으로 먼저 쓰고, checkpoint가 완료되면 JobManager가 Sink에 완료 알림(notifyCheckpointComplete)을 보내고, 알림을 받은 Sink가 트랜잭션을 commit해서 초록이 됩니다. 실제로는 모든 subtask에 알림이 가지만 받아서 일을 하는 건 Sink뿐이라 Sink로 가는 것만 그렸습니다." },
    { target: "sim-presets", title: "시나리오", body: "0번 정상 흐름으로 checkpoint 한 바퀴를 먼저 보여 주고, 1 → 2 → 3 → 4 순서로 장애 시나리오를 보여 주면 됩니다." },
    { target: "sim-mode", title: "단계별 / 실시간", body: "단계별은 장면마다 멈춰서 설명 카드를 띄우고, 다음(Space)을 누르면 다음 장면까지 진행합니다. 실시간은 계속 흐르게 두고, TM 박스를 누르면 그 TM이 죽습니다." },
    { target: "sim-step", title: "단계 카드", body: "지금 멈춘 장면의 이름과 설명입니다. 발표할 때는 이 카드를 읽고 다음을 누르면 됩니다. 위 막대는 시나리오 안에서 몇 번째 장면인지 보여 줍니다." },
    { target: "sim-play", title: "재생", body: "일시정지, 처음부터, 느리게, 빠르게입니다. 설명할 때는 일시정지(P)로 멈추고 짚으면 됩니다." },
    { target: "sim-settings", title: "설정", body: "톱니바퀴를 누르면 checkpoint, Sink 보장 수준, 재시작 전략을 바꿀 수 있습니다. 시나리오 버튼을 누르면 이 설정이 자동으로 맞춰집니다." },
    { target: "sim-steps", title: "복구 6단계", body: "장애가 나면 왼쪽부터 차례로 켜집니다. 질문 1의 답이 이 6단계입니다." },
    { target: "sim-results", title: "결과 검증", body: "유실·중복 개수와, Count의 state가 입력을 정확히 한 번씩 센 값과 같은지 보여 줍니다." },
    { target: "sim-log", title: "JobManager 로그", body: "실제 Flink 로그와 비슷한 문구로 기록이 남습니다. 질문이 나오면 여기서 근거를 짚어 주세요." },
  ],
  checkpoint: [
    { target: "cp-anatomy", title: "checkpoint = offset + state + 트랜잭션", body: "barrier가 Task를 지날 때마다 그 Task의 조각이 저장소로 들어갑니다. Source는 offset, KeyedCount는 state, Sink는 준비된 트랜잭션. 세 조각이 다 모이면 checkpoint가 완료됩니다." },
    { target: "bs-stage", title: "두 채널, 하나의 연산자", body: "두 Source에서 레코드가 KeyedCount로 들어옵니다. barrier가 지나가는 순간 연산자가 무엇을 저장하는지 봅니다." },
    { target: "bs-side", title: "한 단계씩 진행", body: "'다음 단계' 버튼으로 진행하면 단계마다 설명이 여기에 나옵니다. 핵심은 3단계, 정렬을 기다리는 장면입니다." },
    { target: "bs-mode", title: "Aligned와 Unaligned", body: "정렬을 기다리는 방식과, 기다리지 않고 in-flight 데이터를 같이 저장하는 방식을 바꿔 가며 비교할 수 있습니다." },
    { target: "cp-compare", title: "Aligned와 Unaligned 비교", body: "Aligned는 checkpoint가 작고 복원이 빠르지만 정렬하는 동안 처리가 막힙니다. Unaligned는 막힘이 없지만 in-flight 데이터까지 저장해 checkpoint가 커집니다. 기본은 aligned, backpressure로 checkpoint가 늦어지면 unaligned나 aligned-checkpoint-timeout을 씁니다." },
    { target: "cp-cards", title: "어디에, 어떻게 저장하나", body: "State Backend 선택과, 자동으로 관리되는 checkpoint와 사람이 찍는 savepoint의 차이입니다." },
  ],
  restart: [
    { target: "rc-pattern", title: "장애 패턴 고르기", body: "장애가 짧은 시간에 몰려서 날 때와 띄엄띄엄 날 때를 바꿔 보세요. 전략마다 포기하는 조건이 달라서 결과가 갈립니다." },
    { target: "rc-rows", title: "전략별 타임라인", body: "초록은 실행, 노랑은 재시작 대기, 빨간 X는 장애입니다. fixed-delay는 총 횟수로, failure-rate는 일정 시간 안의 빈도로 포기를 판단하고, exponential-delay는 대기를 늘리되 포기하지 않습니다." },
    { target: "rc-takeaway", title: "정리", body: "패턴마다 한 줄 요약입니다. 특히 fixed-delay가 가끔 나는 장애에도 결국 멈춘다는 점이 실무에서 자주 놓치는 부분입니다." },
  ],
  exactly: [
    { target: "eo-table", title: "세 가지 보장 수준", body: "시뮬레이터 시나리오 123과 하나씩 짝을 이룹니다. 차이는 장애 뒤 결과에 유실이나 중복이 남는지입니다." },
    { target: "eo-conds", title: "exactly-once의 세 조건", body: "되감을 수 있는 Source, 일관된 스냅샷, 트랜잭션 또는 멱등 Sink. 셋 중 하나라도 빠지면 깨집니다." },
    { target: "eo-sinks", title: "트랜잭션 Sink와 멱등 Sink", body: "재처리 결과가 바깥에 두 번 반영되지 않게 하는 두 방법입니다. 결과를 key별로 덮어쓸 수 있으면 멱등 Sink가 더 단순하고 지연도 없습니다. append로 쌓아야 하면 트랜잭션 Sink가 필요합니다." },
  ],
  twopc: [
    { target: "tpc-flow", title: "checkpoint에 올라탄 트랜잭션", body: "트랜잭션을 열고, barrier에서 준비하고, checkpoint가 완료되면 커밋합니다. 커밋 전 데이터는 read_committed consumer에게 보이지 않습니다." },
    { target: "tpc-fail", title: "중간에 죽으면", body: "완료되지 않은 트랜잭션은 abort되고, 직전 checkpoint부터 다시 처리합니다. 그래서 바깥에는 한 번만 커밋됩니다." },
    { target: "tpc-code", title: "실제 코드", body: "기억할 건 세 가지입니다. DeliveryGuarantee.EXACTLY_ONCE, Job마다 고유한 transactionalIdPrefix, 그리고 consumer의 read_committed." },
    { target: "tpc-traps", title: "자주 겪는 함정", body: "특히 트랜잭션 타임아웃은 exactly-once를 켜 놓고도 데이터를 잃는 대표적인 원인입니다." },
  ],
  wrap: [
    { target: "wrap-recap", title: "세 질문의 답", body: "감지 → 취소 → 재시작 판단 → 재배포, 복원 기준은 마지막 완료 checkpoint, 중복 방지는 트랜잭션·멱등 Sink입니다." },
    { target: "wrap-cheat", title: "핵심 설정", body: "실무에서 먼저 확인할 설정 키입니다. 발표 뒤 참고 자료로 쓰시면 됩니다." },
  ],
  qa: [{ target: "qa-list", title: "예상 질문", body: "질문을 누르면 답이 펼쳐집니다. 나올 만한 질문을 미리 정리해 두었습니다." }],
};
