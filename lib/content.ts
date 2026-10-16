/** 발표 본문에 쓰는 코드 예시와 표 데이터 */

export const KAFKA_SINK = `env.enableCheckpointing(60_000, CheckpointingMode.EXACTLY_ONCE);

KafkaSink<String> sink = KafkaSink.<String>builder()
    .setBootstrapServers(brokers)
    .setRecordSerializer(KafkaRecordSerializationSchema.builder()
        .setTopic("word-counts")
        .setValueSerializationSchema(new SimpleStringSchema())
        .build())
    .setDeliveryGuarantee(DeliveryGuarantee.EXACTLY_ONCE)   // 2PC
    .setTransactionalIdPrefix("wordcount-sink")             // Job마다 고유하게
    .setProperty("transaction.timeout.ms", "900000")        // broker 상한 이하
    .build();

// 다운스트림 consumer
props.put("isolation.level", "read_committed");`;

export const CHEAT = [
  ["execution.checkpointing.interval", "60 s", "checkpoint 주기. 지정하지 않으면 checkpoint가 꺼져 있음"],
  ["execution.checkpointing.mode", "EXACTLY_ONCE", "barrier 정렬 여부. AT_LEAST_ONCE는 정렬을 건너뜀"],
  ["execution.checkpointing.unaligned.enabled", "true", "backpressure가 심할 때 정렬 대기 없이 in-flight 데이터까지 저장"],
  ["execution.checkpointing.min-pause", "30 s", "checkpoint 사이 최소 간격. 처리량 확보용"],
  ["state.backend.type", "rocksdb", "hashmap 또는 rocksdb"],
  ["execution.checkpointing.incremental", "true", "RocksDB에서 바뀐 파일만 업로드"],
  ["jobmanager.execution.failover-strategy", "region", "region(기본) 또는 full"],
  ["restart-strategy.type", "exponential-delay", "fixed-delay, failure-rate, exponential-delay, none"],
  ["heartbeat.timeout", "50 s", "TM 장애 감지 시간. 줄이면 빨리 감지하지만 오탐이 늘어남"],
];

export const QA = [
  ["TaskManager 하나만 죽었는데 왜 모든 Task가 재시작되나요?", "Region failover는 pipelined로 연결된 Task 묶음(region) 단위로 재시작합니다. 스트리밍 Job은 keyBy 같은 all-to-all 연결 때문에 보통 Job 전체가 하나의 region이 됩니다. 배치처럼 blocking shuffle로 끊긴 Job이면 실패한 region만 재시작합니다."],
  ["ack가 정말 6개인가요?", "그림에서는 역할을 보이려고 Count와 Sink를 나눠 그렸지만, 실제 Flink는 병렬도가 같고 1:1로 이어진 연산자를 하나의 Task로 묶습니다(operator chaining). 이 Job은 Source 2개 + (Count·Sink) 2개 = Task 4개라 JobManager는 ack 4개를 기다립니다. 묶인 연산자들의 state는 같은 Task의 스냅샷으로 함께 올라갑니다."],
  ["tm-2가 죽으면 멀쩡한 tm-1도 재시작되나요?", "재시작되는 건 TaskManager가 아니라 Task입니다. tm-1 프로세스는 그대로 두고 그 위의 Task만 취소했다가 같은 slot에 다시 배포합니다. 죽은 tm-2 자리에만 ResourceManager가 새 TaskManager를 받아 옵니다. 그리고 6개 Task 모두 같은 checkpoint로 함께 돌아가는데, 한쪽만 되돌리면 Task끼리 시점이 어긋나 중복이나 유실이 생기기 때문입니다."],
  ["JobManager가 죽으면 어떻게 되나요?", "HA(ZooKeeper 또는 Kubernetes)를 켜면 새 JobManager가 리더로 선출됩니다. 완료된 checkpoint의 메타데이터 위치가 HA 저장소에 있어서, 새 JobManager가 이를 읽고 최신 checkpoint로 Job을 복구합니다. HA가 없으면 Job이 사라집니다."],
  ["Checkpoint 간격을 짧게 하면 무조건 좋은가요?", "복구할 때 재처리할 양과 exactly-once 출력 지연은 줄어듭니다. 대신 스냅샷 업로드 IO, barrier 정렬 비용, 저장소 부하가 늘어납니다. 큰 state라면 incremental checkpoint와 min-pause를 함께 조정합니다."],
  ["Unaligned checkpoint는 언제 쓰나요?", "backpressure 때문에 barrier가 늦게 도착해 정렬이 오래 걸리고 checkpoint가 타임아웃 날 때 씁니다. barrier가 버퍼 속 데이터를 추월하고, 그 in-flight 데이터를 checkpoint에 같이 저장합니다. exactly-once는 유지되지만 checkpoint 크기가 커집니다."],
  ["복구 시간을 줄이려면?", "장애 감지는 heartbeat 설정으로 앞당길 수 있고, 재배포는 미리 띄워 둔 여유 TM이나 slot으로 빨라집니다. state 복원은 local recovery(TM 로컬 디스크의 사본 사용)와 incremental checkpoint로 줄일 수 있습니다."],
  ["Kafka Source는 Kafka에 offset을 커밋하지 않나요?", "checkpoint가 완료되면 Kafka에도 offset을 커밋하지만, 그건 모니터링(consumer lag 확인)용입니다. 복구할 때는 Kafka에 커밋된 offset이 아니라 checkpoint에 저장된 offset을 씁니다."],
];

export const GLOSSARY = [
  ["Job", "제출한 스트리밍 프로그램 하나"],
  ["Operator", "map, keyBy, sink 같은 처리 단계"],
  ["Task", "연산자를 병렬로 실행하는 단위"],
  ["Slot", "TaskManager가 Task를 돌리는 자리"],
  ["State", "Task가 기억하는 값 (key별 개수 등)"],
  ["Checkpoint", "모든 Task의 state와 Source offset을 한 시점에 저장한 스냅샷"],
  ["Barrier", "checkpoint 경계를 알리며 데이터 사이에 흐르는 표식"],
  ["Restart Strategy", "장애 후 재시작할지, 언제 할지 정하는 규칙"],
];

/** [이름, 설정, 확인할 것, 결과 톤, 결과] */
export const SCENARIOS = [
  ["1. 유실", "checkpoint 끔", "되살릴 offset과 state가 없어 최신 위치부터 다시 시작", "bad", "유실 발생"],
  ["2. 중복", "checkpoint 켬 · at-least-once", "되감아 다시 처리한 결과를 Sink가 또 씀", "warn", "중복 발생"],
  ["3. 정확", "checkpoint 켬 · exactly-once", "커밋 안 된 트랜잭션을 버리고 다시 처리", "good", "유실·중복 0"],
  ["4. 정렬 중 장애", "exactly-once · tm-2 종료", "Count[0]이 barrier를 기다리는 순간 tm-2가 죽어 그 checkpoint는 폐기", "good", "직전 checkpoint로 복구"],
  ["5. 포기", "fixed-delay 3회", "장애가 4번 이어지면 재시작을 멈춤", "bad", "Job FAILED"],
];

/** [모양 클래스, 이름, 설명] — 시뮬레이터와 애니메이션에서 쓰는 기호 */
export const SYMBOLS = [
  ["block size-3.5 rounded-full bg-rec", "레코드", "파란 점, 글자는 key"],
  ["block size-3.5 rounded-full border border-barrier bg-barrier-dot", "barrier", "노란 점, 숫자는 checkpoint 번호. 레코드 사이에 끼어 흐른다"],
  ["block size-2.5 rotate-45 bg-barrier", "스냅샷 조각", "Task가 저장소로 올리는 offset·state"],
  ["block h-3.5 w-6 rounded-sm border-[1.5px] border-dashed border-pending bg-pending-tint", "미커밋 출력", "트랜잭션이 아직 안 끝난 레코드"],
  ["block h-3.5 w-6 rounded-sm border-[1.5px] border-fail bg-fail-tint", "유실·중복", "잃었거나 두 번 커밋된 레코드"],
];

/** barrier 처리 방식 비교: [이름, 동작, 장점, 단점, 언제] */
export const BARRIER_MODES = [
  [
    "Aligned (기본)",
    "먼저 온 채널을 막고, 모든 입력 채널의 barrier가 모이면 state를 찍는다",
    "checkpoint에 연산자 state만 들어가 작고, 복원이 빠르고 단순하다. exactly-once state를 보장한다",
    "정렬하는 동안 막힌 채널이 멈춘다. backpressure로 barrier가 늦게 오면 정렬이 길어져 처리 지연이 커지고, checkpoint가 타임아웃 날 수 있다",
    "대부분의 Job. 기본값",
  ],
  [
    "Unaligned",
    "barrier가 버퍼 속 레코드를 추월해 바로 다음으로 가고, 추월당한 in-flight 레코드를 state와 함께 저장한다",
    "정렬을 기다리지 않아 backpressure가 심해도 checkpoint가 빨리 끝난다. 처리가 멈추지 않는다. exactly-once는 그대로다",
    "네트워크 버퍼의 in-flight 데이터까지 저장해 checkpoint가 커지고 IO가 늘어난다. 복원할 때 그 데이터를 다시 흘려야 해 복원이 느려진다. savepoint에는 쓸 수 없다",
    "backpressure 때문에 checkpoint가 자주 늦거나 타임아웃 나는 Job",
  ],
  [
    "AT_LEAST_ONCE 모드",
    "정렬하지 않는다. barrier가 먼저 온 채널도 막지 않고 계속 처리한다",
    "막힘도 추가 저장도 없어 가장 가볍고 지연이 가장 짧다",
    "state에 barrier 뒤의 데이터가 섞여 찍힌다. 복원 후 그 데이터를 다시 처리하면 state에 중복 반영된다",
    "약간의 중복이 허용되고 지연이 가장 중요한 Job",
  ],
];

/** 중복을 막는 두 가지 Sink: [방식, 어떻게, 장점, 단점, 예] */
export const SINK_KINDS = [
  [
    "트랜잭션 Sink (2PC)",
    "checkpoint 사이의 출력을 트랜잭션으로 묶고, checkpoint가 확정되면 commit한다. 재처리 구간의 출력은 commit 전에 abort된다",
    "어떤 출력이든(append, 이벤트 로그) 정확히 한 번 보이게 할 수 있다",
    "출력이 checkpoint 간격만큼 늦게 보인다. 대상 시스템이 트랜잭션을 지원해야 하고, 읽는 쪽이 read_committed여야 한다. 트랜잭션 타임아웃을 관리해야 한다",
    "Kafka exactly-once Sink, 파일 Sink",
  ],
  [
    "멱등(idempotent) Sink",
    "같은 key로 같은 값을 다시 써도 결과가 같게 쓴다(upsert, 덮어쓰기). 재처리로 같은 결과가 또 와도 최종 값은 그대로다",
    "트랜잭션이 필요 없고 바로 보여서 지연이 없다. 구현과 운영이 단순하다",
    "결과가 key로 식별되고 덮어써도 되는 경우에만 쓸 수 있다. 재처리 도중에는 잠깐 옛 값이 다시 보일 수 있다",
    "DB upsert (word → count), Elasticsearch 문서 id, Redis SET",
  ],
];
