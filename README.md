# Flink 장애 복구 랩

Flink TaskManager 장애 복구, Checkpoint 기반 State 복원, Restart Strategy, Exactly-once를
직접 장애를 주입하며 설명하는 발표용 웹 덱입니다. (Next.js 16 · Tailwind CSS 4)

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 확인
```

## 발표 조작

- `←` `→` / `PageUp` `PageDown`: 페이지 넘기기 (URL hash가 페이지를 가리킴, 예: `/#sim`)
- `T` 목차, `G` 현재 페이지 가이드
- 시뮬레이션 페이지: `Space` 다음 단계(단계별 모드), `1` `2` tm-1 / tm-2 종료(실시간 모드), `P` 일시정지

## 발표자 대본 (/presenter)

`/presenter`에서 페이지별 대본, 화면 동작, 경과 시간을 볼 수 있습니다.

- 비밀번호 없이 누구나 열 수 있습니다.
- 같은 브라우저에서 발표 창(`/`)을 함께 열어 두면 현재 페이지 대본이 따라오고, 대본 창에서 넘기면 발표 창도 넘어갑니다.
- 대본 내용은 `lib/script.ts`에서 고칩니다.

## 구조

```
app/
  layout.tsx              폰트, 메타데이터
  page.tsx                섹션을 Deck에 순서대로 배치
  presenter/page.tsx      발표자 대본 (/presenter)
  globals.css             Tailwind 테마 토큰 + SVG 그림용 상태 클래스
components/
  deck/                   페이지 넘김, 목차 서랍, 목차 목록
  tour/Tour.tsx           페이지별 스포트라이트 가이드
  sections/*Section.tsx   페이지별 본문
  simulator/              장애 시뮬레이터 화면 (도구 막대, 단계 카드, 클러스터 그림, 복구 단계, 결과, 로그)
  checkpoint/             checkpoint 구성 애니메이션, barrier 정렬 스텝퍼
  restart/                Restart Strategy 비교
  prereq/                 사전 지식 데모 (Keyed State, offset, 트랜잭션, 파이프라인, region 비교)
  presenter/              발표자 대본 화면
  ui/                     Section, SectionHead, Tag, Code, Icon 등 공용 조각
lib/
  simulator/engine.ts     시뮬레이션 모델 (병렬도 2, 출력 버퍼, barrier 정렬, checkpoint, 2PC, 복구)
  simulator/steps.ts      단계별 모드 대본
  simulator/view.ts       엔진 상태를 SVG에 그림 (60fps라 React 렌더 대신 직접 갱신)
  simulator/mount.ts      버튼·키보드 연결, 애니메이션 루프, 실시간/단계별 모드
  simulator/narration.ts  실시간 모드 상황 문구
  content.ts, pages.ts    본문 데이터, 페이지 순서
  tours.ts, script.ts     가이드 문구, 발표 대본
  ui.ts                   공용 Tailwind 클래스 묶음
```

## Vercel 배포

GitHub에 올린 뒤 Vercel에서 Import 하면 설정 없이 배포됩니다. CLI를 쓰려면 `npx vercel`.
