/** 본문 속 설정 키·식별자 */
export default function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[0.88em] text-ink">{children}</code>;
}
