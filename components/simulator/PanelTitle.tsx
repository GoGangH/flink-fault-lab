export default function PanelTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h4 className={"mb-2.5 text-[13px] font-semibold text-ink " + className}>{children}</h4>;
}
