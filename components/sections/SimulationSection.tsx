import Section from "@/components/ui/Section";
import Simulator from "@/components/simulator/Simulator";

export default function SimulationSection() {
  return (
    <Section id="sim" className="min-h-[calc(100vh-60px)] pt-6 pb-16">
      <Simulator />
    </Section>
  );
}
