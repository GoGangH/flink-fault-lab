import type { Metadata } from "next";
import PresenterView from "@/components/presenter/PresenterView";

export const metadata: Metadata = {
  title: "발표자 대본 · Flink 장애 복구 랩",
  robots: { index: false, follow: false },
};

export default function ScriptPage() {
  return <PresenterView />;
}
