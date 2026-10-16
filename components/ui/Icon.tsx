const PATHS = {
  play: <path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6.5" y="5.5" width="4" height="13" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5.5" width="4" height="13" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  restart: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </>
  ),
  slower: (
    <>
      <path d="M11.5 6.5 6 12l5.5 5.5z" fill="currentColor" stroke="none" />
      <path d="M18.5 6.5 13 12l5.5 5.5z" fill="currentColor" stroke="none" />
    </>
  ),
  faster: (
    <>
      <path d="M5.5 6.5 11 12l-5.5 5.5z" fill="currentColor" stroke="none" />
      <path d="M12.5 6.5 18 12l-5.5 5.5z" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export type IconName = keyof typeof PATHS;

/** 시뮬레이터 조작에 쓰는 작은 선 아이콘 */
export default function Icon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
