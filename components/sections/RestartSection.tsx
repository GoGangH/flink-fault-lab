import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import { note } from "@/lib/ui";
import RestartCompare from "@/components/restart/RestartCompare";

export default function RestartSection() {
  return (
    <Section id="restart">
      <SectionHead eyebrow="질문 2 · Restart Strategy" title="몇 번까지, 얼마나 기다렸다가 다시 띄울까">
        State를 어디서 복원할지는 checkpoint가 정하고, 재시작을 할지 말지와 언제 할지는 Restart Strategy가 정합니다. 같은 장애가 몰려서 날 때와 가끔 날 때, 네 전략이 각각 어떻게 반응하는지 비교합니다.
      </SectionHead>
      <RestartCompare />
      <p className={note}>
        checkpoint를 켜고 전략을 따로 지정하지 않으면 최근 Flink 버전은 exponential-delay를 기본으로 씁니다. 실제 exponential-delay에는 jitter와 일정 시간 안정적이면 대기를 초기화하는 옵션도 있습니다.
      </p>
    </Section>
  );
}
