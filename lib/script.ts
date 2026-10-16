/**
 * 발표 대본. /script 페이지에서 보인다.
 * say: 말할 내용(문단 단위), cue: 화면에서 할 동작, min: 예상 시간(분)
 */
export type ScriptPage = { min: number; say: string[]; cue?: string[] };

export const SCRIPT: Record<string, ScriptPage> = {
  top: {
    min: 1,
    say: [
      "안녕하세요. 오늘은 Flink의 Fault Tolerance, 그중에서도 TaskManager가 죽었을 때 무슨 일이 일어나는지 이야기하겠습니다.",
      "스트리밍 Job은 멈추지 않고 계속 돌면서 상태를 들고 있습니다. 그래서 장애가 나면 두 가지가 문제입니다. Job을 어떻게 다시 띄우느냐, 그리고 그 사이 흐르던 데이터가 사라지거나 두 번 처리되지 않느냐입니다.",
      "화면의 띠를 보시면 파란 점이 레코드, 레코드 사이에 낀 노란 점이 checkpoint barrier, 빨간 구간이 TaskManager가 죽은 지점입니다. 오늘 모든 화면에서 이 색을 그대로 씁니다.",
    ],
  },
  agenda: {
    min: 0.5,
    say: [
      "순서는 이렇습니다. 먼저 사전 지식 세 가지를 짧게 맞추고, 그다음 세 질문에 차례로 답하겠습니다.",
      "복구 과정은 시뮬레이터로 직접 장애를 일으켜 보고, 복원 기준은 checkpoint와 restart strategy, 마지막으로 유실과 중복을 막는 exactly-once를 봅니다.",
    ],
  },
  stream: {
    min: 2,
    say: [
      "첫 번째 사전 지식입니다. Flink의 연산은 병렬 Task로 나뉘어 돌고, keyBy를 하면 같은 key는 항상 같은 Task로 갑니다.",
      "그리고 Task는 key별 값, 예를 들어 단어 개수를 자기 메모리에 들고 있습니다. 이걸 keyed state라고 합니다.",
      "직접 보겠습니다. A, B, C를 몇 개 보내면 A와 C는 Task 1에, B는 Task 2에 쌓입니다. 이제 Task 1을 죽여 보겠습니다. A와 C의 개수가 사라졌습니다.",
      "state가 TaskManager 안에 있기 때문에, TaskManager가 죽으면 state도 같이 사라집니다. 이걸 막기 위해 어딘가에 저장해 두는 장치가 checkpoint입니다.",
    ],
    cue: ["A, B, C를 3~4번 섞어서 보내기", "Task 1 장애 클릭", "아래 용어 표는 짚고만 넘어가기"],
  },
  kafka: {
    min: 2,
    say: [
      "두 번째는 Kafka입니다. 오늘 예제의 입력과 출력이 모두 Kafka 토픽이고, Kafka의 두 가지 성질이 나중에 핵심 재료가 됩니다.",
      "하나는 offset입니다. 파티션은 순서가 있는 로그라서, 어디까지 읽었는지를 offset 숫자 하나로 기억합니다. 읽다가 offset을 저장해 두고, 장애가 났다고 치고 되감으면 그 구간을 다시 읽습니다. 노랗게 표시된 부분입니다. 이게 '되감을 수 있는 Source'입니다.",
      "다른 하나는 트랜잭션입니다. 프로듀서가 여러 레코드를 묶어 쓰다가 abort하면, read_committed로 읽는 consumer에게는 아무것도 보이지 않습니다. exactly-once Sink가 바로 이 성질을 씁니다.",
    ],
    cue: ["읽기 3번 → offset 저장 → 읽기 3번 → 되감기", "트랜잭션에 쓰기 2~3번 → abort", "한 번 더 쓰고 commit"],
  },
  arch: {
    min: 1.5,
    say: [
      "세 번째는 클러스터 구조입니다. JobManager가 지휘하는 쪽이고, TaskManager가 실제로 연산이 돌고 죽기도 하는 쪽입니다.",
      "JobManager 안에서는 두 가지를 기억해 주세요. 장애를 처리하는 JobMaster, 그리고 checkpoint를 조율하는 CheckpointCoordinator입니다.",
      "시뮬레이터는 병렬도 2입니다. slot sharing 기본값 때문에 TM마다 Source, Count, Sink가 한 벌씩 들어갑니다. 대신 keyBy 때문에 데이터는 TM을 건너 다닙니다.",
    ],
  },
  job: {
    min: 1.5,
    say: [
      "시뮬레이터로 넘어가기 전에 예제를 소개하겠습니다. orders 토픽에서 단어를 읽어서, 단어별로 몇 번 나왔는지 세고, 그 결과를 word-counts 토픽에 쓰는 Job입니다.",
      "KeyedCount 안에 쌓이는 A와 B의 개수가 state입니다. 화면에는 한 벌만 그렸지만 시뮬레이터에서는 병렬도 2로 두 벌이 돌고, A는 Count[0], B는 Count[1]이 셉니다.",
      "시나리오는 다섯 개입니다. checkpoint를 끈 상태, at-least-once Sink, exactly-once Sink, barrier 정렬을 기다리는 도중의 장애, 그리고 장애가 연달아 나는 경우입니다.",
    ],
    cue: ["시나리오 표를 위에서부터 한 줄씩 짚기"],
  },
  region: {
    min: 2,
    say: [
      "시뮬레이터로 가기 전에 하나만 더 짚겠습니다. TM 하나가 죽었는데 왜 멀쩡한 TM의 Task까지 재시작될까요.",
      "keyBy는 같은 key를 항상 같은 subtask로 보냅니다. A의 개수를 세려면 모든 A가 한 곳에 모여야 하니까요. 그래서 어느 Source든 모든 Count로 보낼 수 있어야 하고, 모든 Task가 서로 이어집니다.",
      "Flink는 이렇게 이어진 Task 묶음을 region이라 부르고, 장애가 나면 region을 통째로 되돌립니다. 한쪽이 되감아 다시 보내면 그걸 받는 쪽도 같은 지점으로 돌아가야 하기 때문입니다.",
      "비교해 보겠습니다. keyBy가 있는 Job은 region이 하나라 tm-1만 죽어도 6개 모두 재시작합니다. forward만 있는 Job은 줄마다 region이 따로라 죽은 줄만 재시작합니다.",
    ],
    cue: ["tm-1 종료 클릭 → 왼쪽 Job은 tm-2 Task까지 보라(재시작), 오른쪽 Job은 tm-2 줄이 그대로 흐르는 것 짚기", "되돌리기"],
  },
  sim: {
    min: 7,
    say: [
      "이제 질문 1입니다. 그림을 위에서부터 따라가 보겠습니다. Kafka 입력 토픽에 파티션이 두 개 있고, 파티션마다 Source가 하나씩 붙어 단어를 읽어 내려받습니다.",
      "병렬도가 2라서 TM마다 Source, Count, Sink가 한 벌씩 있습니다. keyBy 때문에 A는 Count[0]으로, B는 Count[1]로 가서 채널이 X자로 교차합니다. 각 subtask는 자기 state를 따로 들고 있습니다.",
      "JobManager가 두 Source에 checkpoint 시작을 요청합니다. barrier는 Kafka에 들어가는 게 아닙니다. Source의 출력 버퍼는 하나지만 받는 Count마다 칸(subpartition)이 나뉘어 있습니다. 레코드는 key에 맞는 칸에만 들어가고, barrier는 모든 칸의 맨 뒤에 하나씩 들어가 앞의 레코드가 다 나간 뒤에 네트워크로 나갑니다.",
      "여기가 핵심입니다. Count는 입력이 두 개라서 barrier가 따로 도착합니다. 먼저 온 채널은 막고, 그 채널로 온 레코드는 줄 세워 둡니다. 나머지 barrier까지 와야 그 순간의 state를 저장소에 올리고, 막아 둔 레코드를 처리합니다. 이게 barrier 정렬입니다.",
      "state는 평소 각 TM 메모리에 있고, checkpoint 순간에만 그 복사본이 저장소로 갑니다. 저장소는 S3 같은 곳 하나이고, checkpoint마다 폴더가 생겨 subtask별 state 파일이 들어갑니다. Kafka offset도 Source의 state라서 같이 들어갑니다. 6개가 다 모이면 JobManager가 _metadata를 써서 완료를 확정하고, Sink에 완료를 알립니다. 알림을 받은 Sink가 트랜잭션을 commit하면 출력이 초록으로 확정됩니다. Sink가 혼자 먼저 commit하지 않는 이유는, 다른 subtask가 저장에 실패하면 그 checkpoint가 무효가 되기 때문입니다. 참고로 실제 Flink에서는 Count와 Sink처럼 1:1로 이어진 연산자를 하나의 Task로 묶는 operator chaining이 기본이라, 이 Job은 Task 4개, ack도 4개입니다. 화면에서는 역할을 보이려고 나눠 그렸습니다.",
      "이제 장애를 내 보겠습니다. 시나리오 1은 checkpoint가 없어 유실, 2는 at-least-once라 중복, 3은 exactly-once라 유실과 중복이 없습니다.",
      "시나리오 4는 Count[0]이 Source[1]의 barrier를 기다리는 바로 그 순간, Source[1]이 있는 tm-2를 죽입니다. 기다리던 barrier는 영영 오지 않으니 chk-2는 실패로 버립니다. 그리고 tm-1은 멀쩡하지만, 한 region이라 tm-1의 Task도 함께 취소되고, 기다리던 상태와 메모리의 최신 state까지 모두 버린 뒤 6개 Task가 함께 chk-1로 돌아갑니다. 한쪽만 되돌리면 시점이 어긋나 중복이나 유실이 생기기 때문입니다.",
      "그리고 복구 6단계를 봐 주세요. 장애 발생, heartbeat 타임아웃으로 감지, region 전체 취소, restart strategy 판단, 새 TM에 재배포, state 복원. 이것이 질문 1의 답입니다.",
    ],
    cue: [
      "단계별 모드에서 0. 정상 흐름 → 장면마다 카드 읽고 Space",
      "정렬 대기 장면에서 Count 입구의 '차단'과 줄 선 레코드 짚기",
      "1 → 2 → 3 순서로 시나리오, 마지막 장면에서 결과 검증 지표 짚기",
      "4. 정렬 중 장애: 저장소가 '실패 · 폐기'로 바뀌는 장면",
      "질문이 나오면 실시간으로 바꾸고 TM 박스를 눌러 직접 장애",
    ],
  },
  checkpoint: {
    min: 3,
    say: [
      "질문 2, 무엇을 기준으로 되살리느냐입니다. 답은 마지막으로 완료된 checkpoint입니다.",
      "checkpoint에는 offset만 들어가는 게 아닙니다. barrier가 지나갈 때마다 Source는 offset을, KeyedCount는 지금까지 센 state를, Sink는 준비된 트랜잭션을 저장소에 올립니다. 세 조각이 모두 모여야 checkpoint 하나가 완료됩니다. 셋 다 같은 barrier 기준이라 같은 시점을 가리킵니다.",
      "그럼 입력이 여러 개일 때는 어떻게 같은 시점을 맞출까요.",
      "CheckpointCoordinator가 Source에 barrier를 넣습니다. barrier는 데이터 사이에 끼어서 흐르고, barrier 앞은 이번 checkpoint, 뒤는 다음 checkpoint 몫입니다.",
      "입력이 두 개인 연산자에 채널 1의 barrier가 먼저 도착하면, 채널 1을 잠깐 막고 채널 2의 barrier를 기다립니다. 이것이 정렬, alignment입니다. 둘 다 도착하면 그 순간 state를 저장합니다. 그래서 offset과 state가 정확히 같은 시점을 가리킵니다.",
      "Unaligned로 바꾸면 기다리지 않고 바로 찍는 대신, 아직 처리 안 된 in-flight 데이터를 같이 저장합니다. 장단점을 정리하면, aligned는 checkpoint가 작고 복원이 빠르지만 정렬하는 동안 처리가 막혀 backpressure 때 checkpoint가 늦어집니다. unaligned는 막힘이 없는 대신 checkpoint가 커지고 복원이 느려지며 savepoint에는 못 씁니다. 그래서 기본은 aligned로 두고, checkpoint가 자주 늦으면 unaligned나, 평소엔 aligned로 찍다가 정렬이 오래 걸릴 때만 unaligned로 바꾸는 aligned-checkpoint-timeout을 씁니다.",
    ],
    cue: ["위 애니메이션에서 조각이 하나씩 저장소로 들어가는 것 짚기", "스텝퍼: 다음 단계를 눌러 3단계(정렬 대기)에서 잠깐 멈추기, 아래 저장소 줄 확인", "끝까지 간 뒤 Unaligned로 바꿔 3단계만 비교"],
  },
  restart: {
    min: 2,
    say: [
      "어디서 복원할지는 checkpoint가 정하고, 재시작을 할지 말지, 얼마나 기다릴지는 restart strategy가 정합니다.",
      "장애가 몰려서 나는 경우부터 보겠습니다. fixed-delay는 세 번 재시작하고 네 번째에 포기하고, failure-rate는 2분 안에 세 번이 몰리자 바로 포기합니다. exponential-delay는 대기 시간을 1초, 2초, 4초로 늘려 가며 계속 버팁니다.",
      "이번엔 5분에 한 번씩 가끔 나는 경우입니다. failure-rate는 빈도가 낮으니 계속 살려 두고, exponential-delay는 한동안 안정적이었으니 매번 1초로 초기화됩니다. 그런데 fixed-delay는 시간과 상관없이 총 횟수만 세기 때문에, 띄엄띄엄 나는 장애에도 결국 Job을 멈춥니다.",
      "그래서 오래 도는 스트리밍 Job에는 fixed-delay보다 failure-rate나 exponential-delay가 맞고, 최근 Flink는 exponential-delay를 기본으로 씁니다.",
    ],
    cue: ["'몰려서 날 때'를 먼저 보여 주고 '가끔 날 때'로 전환", "fixed-delay 줄이 두 경우 모두 실패하는 것 짚기"],
  },
  exactly: {
    min: 2,
    say: [
      "질문 3입니다. 먼저 짚을 점은, 복구하면 마지막 checkpoint 이후의 레코드는 반드시 다시 처리된다는 것입니다. 재처리 자체는 피할 수 없습니다.",
      "그래서 exactly-once는 한 번만 처리한다는 뜻이 아니라, 결과에 한 번만 반영된다는 뜻입니다.",
      "이를 위한 조건은 세 가지입니다. 되감을 수 있는 Source, 일관된 state 스냅샷, 그리고 트랜잭션이나 멱등 Sink. 시뮬레이터의 시나리오 1, 2, 3이 각각 이 표의 한 줄입니다.",
    ],
  },
  twopc: {
    min: 2.5,
    say: [
      "트랜잭션 Sink는 checkpoint에 올라탑니다. checkpoint 사이의 출력을 하나의 트랜잭션에 쓰고, barrier가 오면 preCommit, 모든 Task의 스냅샷이 끝나 checkpoint가 완료되면 그때 commit합니다.",
      "중간에 죽으면 그 트랜잭션은 abort되고, 직전 checkpoint부터 다시 처리해서 새 트랜잭션에 씁니다. 바깥에는 한 번만 커밋됩니다.",
      "코드로는 세 가지만 기억하시면 됩니다. DeliveryGuarantee.EXACTLY_ONCE, Job마다 고유한 transactionalIdPrefix, 그리고 읽는 쪽의 read_committed.",
      "실무에서 가장 많이 겪는 함정은 트랜잭션 타임아웃입니다. checkpoint 간격과 복구 시간보다 짧으면, 커밋하기 전에 broker가 먼저 abort해서 exactly-once를 켜 놓고도 데이터를 잃습니다.",
    ],
  },
  wrap: {
    min: 1,
    say: [
      "정리하겠습니다. 복구 과정은 heartbeat로 감지하고, region 단위로 취소하고, restart strategy가 허락하면 재배포합니다.",
      "복원 기준은 마지막으로 완료된 checkpoint이고, Source offset과 state가 같은 시점으로 함께 돌아갑니다.",
      "유실은 checkpoint와 되감을 수 있는 Source로, 중복은 트랜잭션이나 멱등 Sink로 막습니다. 아래 설정 표는 나중에 참고 자료로 봐 주세요.",
    ],
  },
  qa: {
    min: 3,
    say: ["질문 받겠습니다."],
    cue: ["자주 나오는 질문은 화면 목록을 펼쳐서 답하기: region 재시작, JobManager 장애, checkpoint 간격"],
  },
};
