import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import PageList from "@/components/deck/PageList";

export default function AgendaSection() {
  return (
    <Section id="agenda">
      <SectionHead eyebrow="목차" title="이런 순서로 이야기합니다">
        먼저 사전 지식 세 가지를 짧게 짚고, 세 질문에 차례로 답합니다.
      </SectionHead>
      <div data-tour="agenda-list">
        <PageList skip={["시작"]} />
      </div>
    </Section>
  );
}
