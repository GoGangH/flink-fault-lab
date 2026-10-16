import Deck from "@/components/deck/Deck";
import HeroSection from "@/components/sections/HeroSection";
import AgendaSection from "@/components/sections/AgendaSection";
import StreamBasicsSection from "@/components/sections/StreamBasicsSection";
import KafkaBasicsSection from "@/components/sections/KafkaBasicsSection";
import JobOverviewSection from "@/components/sections/JobOverviewSection";
import RegionSection from "@/components/sections/RegionSection";
import ArchitectureSection from "@/components/sections/ArchitectureSection";
import SimulationSection from "@/components/sections/SimulationSection";
import CheckpointSection from "@/components/sections/CheckpointSection";
import RestartSection from "@/components/sections/RestartSection";
import ExactlyOnceSection from "@/components/sections/ExactlyOnceSection";
import TwoPhaseCommitSection from "@/components/sections/TwoPhaseCommitSection";
import SummarySection from "@/components/sections/SummarySection";
import QnaSection from "@/components/sections/QnaSection";
import { PAGES } from "@/lib/pages";

export default function Home() {
  return (
    <Deck pages={PAGES}>
      <HeroSection />
      <AgendaSection />
      <StreamBasicsSection />
      <KafkaBasicsSection />
      <ArchitectureSection />
      <JobOverviewSection />
      <RegionSection />
      <SimulationSection />
      <CheckpointSection />
      <RestartSection />
      <ExactlyOnceSection />
      <TwoPhaseCommitSection />
      <SummarySection />
      <QnaSection />
    </Deck>
  );
}
