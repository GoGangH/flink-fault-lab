import PanelTitle from "./PanelTitle";

export default function JobManagerLog() {
  return (
    <div data-tour="sim-log" className="min-w-0 px-4 py-4">
      <PanelTitle>
        JobManager 로그 <span className="font-normal text-muted">(실제 로그를 줄여서 표시)</span>
      </PanelTitle>
      <div className="log h-[260px] overflow-auto rounded-lg bg-sunk px-2.5 py-2 font-mono text-[11.5px] leading-[1.55]" id="log" aria-live="off" />
    </div>
  );
}
